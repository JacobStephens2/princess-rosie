class_name EditionPackAdapter
extends RefCounted

const CONTRACT_VERSION := "rosi-edition-contract/1"


func prepare(pack_source: String, expected_digest: String = "") -> Dictionary:
	var manifest_result := _read_pack_json(pack_source, "edition.json")
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

	var manifest_bytes_result := _read_pack_bytes(pack_source, "edition.json")
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
		if not _is_safe_relative_path(relative_path):
			return _failure("Edition Pack path must stay inside its root: %s" % relative_path)

		var bytes_result := _read_pack_bytes(pack_source, relative_path)
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
	if prepared_pack.get("ok") != true:
		return _failure("Edition Pack must prepare successfully before content is loaded")

	var manifest_result := _read_pack_json(pack_source, "edition.json")
	if not manifest_result.ok:
		return manifest_result
	var manifest: Dictionary = manifest_result.value
	var manifest_files: Variant = manifest.get("files")
	if not manifest_files is Array:
		return _failure("Edition Pack files must be an array")

	for file_value: Variant in manifest_files:
		if file_value is Dictionary and file_value.get("role") == "content":
			var relative_path: Variant = file_value.get("path")
			if not relative_path is String or not _is_safe_relative_path(relative_path):
				return _failure("Edition Pack content path is invalid")
			return _read_pack_json(pack_source, relative_path)
	return _failure("Edition Pack has no content file")


func _read_pack_json(pack_source: String, relative_path: String) -> Dictionary:
	var bytes_result := _read_pack_bytes(pack_source, relative_path)
	if not bytes_result.ok:
		return bytes_result

	var json := JSON.new()
	var parse_error := json.parse(bytes_result.value.get_string_from_utf8())
	if parse_error != OK:
		return _failure("Invalid Edition Pack JSON at %s: %s" % [relative_path, json.get_error_message()])
	if not json.data is Dictionary:
		return _failure("Edition Pack JSON must contain an object: %s" % relative_path)
	return {"ok": true, "value": json.data}


func _read_pack_bytes(pack_source: String, relative_path: String) -> Dictionary:
	if not _is_safe_relative_path(relative_path):
		return _failure("Edition Pack path must stay inside its root: %s" % relative_path)
	if pack_source.get_extension().to_lower() == "zip":
		var archive := ZIPReader.new()
		var archive_error := archive.open(pack_source)
		if archive_error != OK:
			return _failure("Edition Pack archive could not be opened: %s" % error_string(archive_error))
		if not archive.get_files().has(relative_path):
			archive.close()
			return _failure("Edition Pack file is missing: %s" % relative_path)
		var bytes := archive.read_file(relative_path)
		archive.close()
		return {"ok": true, "value": bytes}

	var path := pack_source.path_join(relative_path)
	if not FileAccess.file_exists(path):
		return _failure("Edition Pack file is missing: %s" % path)
	return {"ok": true, "value": FileAccess.get_file_as_bytes(path)}


func _is_safe_relative_path(path: String) -> bool:
	if path.is_empty() or path.is_absolute_path():
		return false
	var simplified := path.simplify_path()
	return simplified != ".." and not simplified.begins_with("../")


func _failure(message: String) -> Dictionary:
	return {"ok": false, "error": message}
