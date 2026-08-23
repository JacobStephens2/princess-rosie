class_name EditionPackAdapter
extends RefCounted

const CONTRACT_VERSION := "rosie-edition-contract/1"
const EDITION_PACK_READER := preload("res://scripts/edition_pack_reader.gd")

var _reader: RefCounted = EDITION_PACK_READER.new()


func prepare(pack_source: String, expected_digest: String = "") -> Dictionary:
	var manifest_result: Dictionary = _reader.read_json_object(pack_source, "edition.json")
	if not manifest_result.ok:
		return manifest_result

	var manifest: Dictionary = manifest_result.value
	if manifest.get("contractVersion") != CONTRACT_VERSION:
		return _failure("Unsupported Edition Contract version: %s" % manifest.get("contractVersion"))

	var revision: Variant = manifest.get("revision")
	if not revision is String or revision.is_empty():
		return _failure("Edition Pack revision must be a non-empty string")

	var manifest_files: Variant = manifest.get("files")
	if not manifest_files is Array:
		return _failure("Edition Pack files must be an array")

	var manifest_bytes_result: Dictionary = _reader.read_bytes(pack_source, "edition.json")
	if not manifest_bytes_result.ok:
		return manifest_bytes_result

	var hashing := HashingContext.new()
	var hashing_error := hashing.start(HashingContext.HASH_SHA256)
	if hashing_error != OK:
		return _failure("Could not start Edition Pack digest")
	hashing.update("edition.json".to_utf8_buffer())
	hashing.update(PackedByteArray([0]))
	hashing.update(manifest_bytes_result.value)

	var files: Array[Dictionary] = []
	for file_value: Variant in manifest_files:
		if not file_value is Dictionary:
			return _failure("Every Edition Pack file needs a role and relative path")
		var file: Dictionary = file_value
		if not file.get("role") is String or not file.get("path") is String:
			return _failure("Every Edition Pack file needs a role and relative path")
		files.append(file)
	files.sort_custom(func(left: Dictionary, right: Dictionary) -> bool:
		return str(left.get("path")) < str(right.get("path"))
	)
	var scenario_ids: Array[String] = []

	for file: Dictionary in files:
		var role: String = file.get("role")
		var relative_path: String = file.get("path")
		if not _reader.is_safe_relative_path(relative_path):
			return _failure("Edition Pack path must stay inside its root: %s" % relative_path)

		var bytes_result: Dictionary = _reader.read_bytes(pack_source, relative_path)
		if not bytes_result.ok:
			return bytes_result
		hashing.update(PackedByteArray([0]))
		hashing.update(relative_path.to_utf8_buffer())
		hashing.update(PackedByteArray([0]))
		hashing.update(bytes_result.value)

		if role == "scenario":
			var scenario_id: Variant = file.get("id")
			if not scenario_id is String or scenario_id.is_empty():
				return _failure("Scenario file needs an id: %s" % relative_path)
			scenario_ids.append(scenario_id)

	var pack_digest := "sha256:" + hashing.finish().hex_encode()
	if not expected_digest.is_empty() and pack_digest != expected_digest:
		return _failure(
			"Edition Pack digest mismatch: expected %s, received %s" % [expected_digest, pack_digest],
		)

	return {
		"ok": true,
		"contract_version": CONTRACT_VERSION,
		"revision": revision,
		"pack_digest": pack_digest,
		"scenario_ids": scenario_ids,
	}


func load_content(pack_source: String, prepared_pack: Dictionary) -> Dictionary:
	return _load_json_role(pack_source, prepared_pack, "content")


func load_media(pack_source: String, prepared_pack: Dictionary) -> Dictionary:
	return _load_json_role(pack_source, prepared_pack, "media")


func load_tuning_intent(pack_source: String, prepared_pack: Dictionary) -> Dictionary:
	return _load_json_role(pack_source, prepared_pack, "tuning-intent")


func _load_json_role(pack_source: String, prepared_pack: Dictionary, role: String) -> Dictionary:
	if prepared_pack.get("ok") != true:
		return _failure("Edition Pack must prepare successfully before %s is loaded" % role)

	var manifest_result: Dictionary = _reader.read_json_object(pack_source, "edition.json")
	if not manifest_result.ok:
		return manifest_result
	var manifest_files: Variant = manifest_result.value.get("files")
	if not manifest_files is Array:
		return _failure("Edition Pack files must be an array")
	for file_value: Variant in manifest_files:
		if file_value is Dictionary and file_value.get("role") == role:
			var relative_path: Variant = file_value.get("path")
			if not relative_path is String or not _reader.is_safe_relative_path(relative_path):
				return _failure("Edition Pack %s path is invalid" % role)
			return _reader.read_json_object(pack_source, relative_path)
	return _failure("Edition Pack has no %s file" % role)


func load_png_texture(pack_source: String, relative_path: String) -> Dictionary:
	var bytes_result: Dictionary = _reader.read_bytes(pack_source, relative_path)
	if not bytes_result.ok:
		return bytes_result
	var image := Image.new()
	var image_error := image.load_png_from_buffer(bytes_result.value)
	if image_error != OK:
		return _failure(
			"Edition Pack PNG could not be decoded at %s: %s"
			% [relative_path, error_string(image_error)],
		)
	var hashing := HashingContext.new()
	var hashing_error := hashing.start(HashingContext.HASH_SHA256)
	if hashing_error != OK:
		return _failure("Could not hash Edition Pack PNG: %s" % relative_path)
	hashing.update(bytes_result.value)
	var used_rect := image.get_used_rect()
	var transparent_pixel_count := (
		image.get_width() * image.get_height() - used_rect.size.x * used_rect.size.y
	)
	return {
		"ok": true,
		"texture": ImageTexture.create_from_image(image),
		"sha256": hashing.finish().hex_encode(),
		"has_transparency": image.detect_alpha() != Image.ALPHA_NONE,
		# The area outside the smallest nontransparent rectangle is a conservative
		# lower bound; transparent pixels inside the silhouette are intentionally ignored.
		"transparent_pixel_count": transparent_pixel_count,
	}


func _failure(message: String) -> Dictionary:
	return {"ok": false, "error": message}
