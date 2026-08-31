@tool
class_name RuntimeEditionPack
extends RefCounted

## Derives the player-facing Runtime Edition Pack from the development pack.

const EDITION_PACK_READER := preload("res://scripts/edition_pack_reader.gd")
const CONTRACT_VERSION := "rosie-edition-contract/1"
const MANIFEST_NAME := "edition.json"
const RUNTIME_MEDIA_ROOT := "source-media/soundscape"

const COPIED_JSON_ROLES := {
	"content": true,
	"tuning-intent": true,
	"media": true,
	"soundscape-events": true,
	"soundscape-mix": true,
	"soundscape-runtime-mappings": true,
}

const EXCLUDED_ROLES := {
	"soundscape-provenance": true,
	"source-media-provenance": true,
	"source-media-runtime-import": true,
	"source-media-catalog-state": true,
	"source-media-build-report": true,
}

const EXCLUDED_PATH_FRAGMENTS := [
	"catalog-state/",
	"runtime-imports/",
	"/masters/",
	"provenance.json",
	"/provenance/",
	"soundscape-build-report.json",
]

const FORBIDDEN_SUBSTRINGS := [
	"Jacob Stephens",
	"ownerManualReviewBy",
	"traceId",
	"providerReportedUsage",
	"written appearance cues",
	"long straight dirty-blonde hair",
	"eleven_text_to_sound_v2",
]

var _reader: RefCounted = EDITION_PACK_READER.new()


func derive(development_root: String) -> Dictionary:
	var manifest_result: Dictionary = _reader.read_json_object(development_root, MANIFEST_NAME)
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

	var media: Dictionary = _require_json(development_root, "media.json")
	if not media.ok:
		return media
	var mix: Dictionary = _require_json(development_root, "soundscape/mix.json")
	if not mix.ok:
		return mix
	var catalog: Dictionary = _require_json(development_root, "soundscape/catalog.json")
	if not catalog.ok:
		return catalog
	var source_media: Dictionary = _require_json(development_root, "soundscape/source-media.json")
	if not source_media.ok:
		return source_media
	var mappings: Dictionary = _require_json(development_root, "soundscape/runtime-mappings.json")
	if not mappings.ok:
		return mappings

	var stripped_catalog := _strip_catalog(catalog.value)
	var stripped_source_media := _strip_source_media(source_media.value)
	var required_paths := _required_paths(
		media.value,
		mix.value,
		stripped_catalog,
		mappings.value,
	)
	if required_paths.get("ok") == false:
		return required_paths

	var files: Array = []
	var seen := {MANIFEST_NAME: true}
	files.append(
		_entry(
			"soundscape-catalog",
			"soundscape/catalog.json",
			_json_bytes(stripped_catalog),
		)
	)
	seen["soundscape/catalog.json"] = true
	files.append(
		_entry(
			"soundscape-source-media",
			"soundscape/source-media.json",
			_json_bytes(stripped_source_media),
		)
	)
	seen["soundscape/source-media.json"] = true

	for file_value: Variant in manifest_files:
		if not file_value is Dictionary:
			return _failure("Every Edition Pack file needs a role and relative path")
		var role: Variant = file_value.get("role")
		var relative_path: Variant = file_value.get("path")
		if not role is String or not relative_path is String:
			return _failure("Every Edition Pack file needs a role and relative path")
		if seen.has(relative_path):
			continue
		if EXCLUDED_ROLES.has(role) or _path_is_excluded(relative_path):
			continue
		if COPIED_JSON_ROLES.has(role) or required_paths.paths.has(relative_path):
			var bytes_result: Dictionary = _reader.read_bytes(development_root, relative_path)
			if not bytes_result.ok:
				return bytes_result
			if bytes_result.value.is_empty():
				return _failure("Edition Pack file is missing or empty: %s" % relative_path)
			files.append(_entry(role, relative_path, bytes_result.value))
			seen[relative_path] = true

	var runtime_manifest := {
		"contractVersion": CONTRACT_VERSION,
		"revision": revision,
		"files": [],
	}
	for file_value: Variant in files:
		runtime_manifest.files.append({"role": file_value.role, "path": file_value.path})
	files.insert(0, _entry("manifest", MANIFEST_NAME, _json_bytes(runtime_manifest)))

	var report: Dictionary = validate(files)
	if not report.ok:
		return report
	return {"ok": true, "files": files}


func validate(files: Array) -> Dictionary:
	var by_path := {}
	for file_value: Variant in files:
		if not file_value is Dictionary or not file_value.get("path") is String:
			return _failure("Every Runtime Edition Pack file needs a relative path")
		var relative_path: String = file_value.path
		if by_path.has(relative_path):
			return _failure("Runtime Edition Pack lists a path twice: %s" % relative_path)
		if not file_value.get("bytes") is PackedByteArray:
			return _failure("Runtime Edition Pack file is missing bytes: %s" % relative_path)
		var role: Variant = file_value.get("role")
		if role is String and EXCLUDED_ROLES.has(role):
			return _failure("Forbidden development record entered the Runtime Edition Pack: %s" % relative_path)
		if _path_is_excluded(relative_path):
			return _failure("Forbidden development record entered the Runtime Edition Pack: %s" % relative_path)
		if relative_path.ends_with(".json"):
			var text: String = file_value.bytes.get_string_from_utf8()
			for needle: String in FORBIDDEN_SUBSTRINGS:
				if text.contains(needle):
					return _failure("Forbidden development record entered the Runtime Edition Pack: %s" % needle)
		by_path[relative_path] = file_value

	if not by_path.has(MANIFEST_NAME):
		return _failure("Runtime Edition Pack manifest is missing")
	var manifest_result: Dictionary = _parse_object(by_path[MANIFEST_NAME].bytes, MANIFEST_NAME)
	if not manifest_result.ok:
		return manifest_result
	var manifest_files: Variant = manifest_result.value.get("files")
	if not manifest_files is Array:
		return _failure("Edition Pack files must be an array")
	var listed := {}
	for file_value: Variant in manifest_files:
		if not file_value is Dictionary or not file_value.get("path") is String:
			return _failure("Every Edition Pack file needs a role and relative path")
		var relative_path: String = file_value.path
		listed[relative_path] = true
		if not by_path.has(relative_path):
			return _failure("required runtime reference is missing: %s" % relative_path)

	for relative_path: Variant in by_path:
		if relative_path != MANIFEST_NAME and not listed.has(relative_path):
			return _failure("Forbidden development record entered the Runtime Edition Pack: %s" % relative_path)

	for required_json: String in [
		"content.json",
		"tuning-intent.json",
		"media.json",
		"soundscape/events.json",
		"soundscape/catalog.json",
		"soundscape/source-media.json",
		"soundscape/mix.json",
		"soundscape/runtime-mappings.json",
	]:
		if not by_path.has(required_json):
			return _failure("required runtime reference is missing: %s" % required_json)

	var media_result: Dictionary = _parse_object(by_path["media.json"].bytes, "media.json")
	if not media_result.ok:
		return media_result
	var mix_result: Dictionary = _parse_object(by_path["soundscape/mix.json"].bytes, "soundscape/mix.json")
	if not mix_result.ok:
		return mix_result
	var catalog_result: Dictionary = _parse_object(
		by_path["soundscape/catalog.json"].bytes,
		"soundscape/catalog.json",
	)
	if not catalog_result.ok:
		return catalog_result
	var mappings_result: Dictionary = _parse_object(
		by_path["soundscape/runtime-mappings.json"].bytes,
		"soundscape/runtime-mappings.json",
	)
	if not mappings_result.ok:
		return mappings_result
	var content_result: Dictionary = _parse_object(by_path["content.json"].bytes, "content.json")
	if not content_result.ok:
		return content_result

	for entry_value: Variant in catalog_result.value.get("entries", []):
		if entry_value is Dictionary and entry_value.has("authoring"):
			return _failure("Forbidden development record entered the Runtime Edition Pack: catalog authoring")

	var required: Dictionary = _required_paths(
		media_result.value,
		mix_result.value,
		catalog_result.value,
		mappings_result.value,
	)
	if required.get("ok") == false:
		return required
	for relative_path: Variant in required.paths:
		if not by_path.has(relative_path):
			return _failure("required runtime reference is missing: %s" % relative_path)

	var media_by_id := _media_by_id(media_result.value)
	for media_id: String in _content_media_ids(content_result.value):
		if not media_by_id.has(media_id):
			return _failure("required runtime reference is missing: %s" % media_id)
		var media_path: Variant = media_by_id[media_id].get("path")
		if not media_path is String or not by_path.has(media_path):
			return _failure("required runtime reference is missing: %s" % media_path)

	return {"ok": true}


func materialize(files: Array, dest_root: String) -> Dictionary:
	if dest_root.is_empty():
		return _failure("Runtime Edition Pack destination is missing")
	if DirAccess.dir_exists_absolute(dest_root):
		_remove_dir(dest_root)
	var make_error := DirAccess.make_dir_recursive_absolute(dest_root)
	if make_error != OK:
		return _failure("Could not create Runtime Edition Pack destination: %s" % dest_root)
	for file_value: Variant in files:
		if not file_value is Dictionary or not file_value.get("path") is String:
			return _failure("Every Runtime Edition Pack file needs a relative path")
		var relative_path: String = file_value.path
		if not _reader.is_safe_relative_path(relative_path):
			return _failure("Edition Pack path must stay inside its root: %s" % relative_path)
		var absolute_path := dest_root.path_join(relative_path)
		var parent_error := DirAccess.make_dir_recursive_absolute(absolute_path.get_base_dir())
		if parent_error != OK:
			return _failure("Could not create Runtime Edition Pack path: %s" % relative_path)
		var out := FileAccess.open(absolute_path, FileAccess.WRITE)
		if out == null:
			return _failure("Could not write Runtime Edition Pack file: %s" % relative_path)
		out.store_buffer(file_value.bytes)
	return {"ok": true}


func _require_json(development_root: String, relative_path: String) -> Dictionary:
	return _reader.read_json_object(development_root, relative_path)


func _required_paths(
	media: Dictionary,
	mix: Dictionary,
	catalog: Dictionary,
	mappings: Dictionary,
) -> Dictionary:
	var paths := {}
	for media_value: Variant in media.get("media", []):
		if not media_value is Dictionary or not media_value.get("path") is String:
			return _failure("Every media entry needs a relative path")
		paths[media_value.path] = true
	var soundtrack: Dictionary = mix.get("soundtrack", {})
	var soundtrack_path: Variant = soundtrack.get("path")
	if not soundtrack_path is String or soundtrack_path.is_empty():
		return _failure("required runtime reference is missing: soundtrack")
	paths[soundtrack_path] = true
	var mappings_by_id := {}
	for mapping_value: Variant in mappings.get("mappings", []):
		if mapping_value is Dictionary and mapping_value.get("id") is String:
			mappings_by_id[mapping_value.id] = mapping_value
	for entry_value: Variant in catalog.get("entries", []):
		if not entry_value is Dictionary:
			continue
		var mapping_id: Variant = entry_value.get("runtimeMapping")
		var mapping: Dictionary = mappings_by_id.get(mapping_id, {})
		var mapping_path: Variant = mapping.get("path")
		if mapping_path is String and not mapping_path.is_empty():
			paths[RUNTIME_MEDIA_ROOT.path_join(mapping_path)] = true
	return {"ok": true, "paths": paths}


func _strip_catalog(catalog: Dictionary) -> Dictionary:
	var entries: Array = []
	for entry_value: Variant in catalog.get("entries", []):
		if not entry_value is Dictionary:
			continue
		var entry: Dictionary = entry_value.duplicate(true)
		entry.erase("authoring")
		entries.append(entry)
	return {"entries": entries}


func _strip_source_media(source_media: Dictionary) -> Dictionary:
	var stripped := {}
	if source_media.has("roles"):
		stripped["roles"] = source_media["roles"]
	if source_media.has("fallbackRoles"):
		stripped["fallbackRoles"] = source_media["fallbackRoles"]
	var masters: Array = []
	for master_value: Variant in source_media.get("sourceMasters", []):
		if not master_value is Dictionary:
			continue
		var kept := {}
		for key: String in ["id", "role", "runtimePath"]:
			if master_value.has(key):
				kept[key] = master_value[key]
		masters.append(kept)
	stripped["sourceMasters"] = masters
	return stripped


func _content_media_ids(content: Dictionary) -> PackedStringArray:
	var ids: PackedStringArray = []
	for moment_value: Variant in content.get("openingMoments", []):
		_append_id(ids, moment_value)
	_append_named_id(ids, content.get("initialFlight", {}), "background")
	_append_named_id(ids, content.get("initialFlight", {}), "character")
	_append_named_id(ids, content.get("sharedJourneyMedia", {}), "birthdayStar")
	_append_named_id(ids, content.get("sharedJourneyMedia", {}), "rainbowPath")
	for place_value: Variant in content.get("places", []):
		_append_named_id(ids, place_value, "illustration")
		_append_named_id(ids, place_value, "familyGuestIllustration")
	_append_named_id(ids, content.get("celebration", {}), "illustration")
	_append_named_id(ids, content.get("celebration", {}), "approachIllustration")
	return ids


func _append_id(ids: PackedStringArray, moment_value: Variant) -> void:
	if moment_value is Dictionary:
		_append_named_id(ids, moment_value, "illustration")


func _append_named_id(ids: PackedStringArray, value: Variant, key: String) -> void:
	if value is Dictionary and value.get(key) is String and not value.get(key).is_empty():
		ids.append(value.get(key))


func _media_by_id(media: Dictionary) -> Dictionary:
	var by_id := {}
	for media_value: Variant in media.get("media", []):
		if media_value is Dictionary and media_value.get("id") is String:
			by_id[media_value.id] = media_value
	return by_id


func _parse_object(bytes: PackedByteArray, relative_path: String) -> Dictionary:
	var json := JSON.new()
	var parse_error := json.parse(bytes.get_string_from_utf8())
	if parse_error != OK:
		return _failure(
			"Invalid Edition Pack JSON at %s: %s" % [relative_path, json.get_error_message()],
		)
	if not json.data is Dictionary:
		return _failure("Edition Pack JSON must contain an object: %s" % relative_path)
	return {"ok": true, "value": json.data}


func _path_is_excluded(path: String) -> bool:
	for fragment: String in EXCLUDED_PATH_FRAGMENTS:
		if path.contains(fragment):
			return true
	return false


func _json_bytes(value: Variant) -> PackedByteArray:
	return (JSON.stringify(value, "\t") + "\n").to_utf8_buffer()


func _entry(role: String, path: String, bytes: PackedByteArray) -> Dictionary:
	return {
		"role": role,
		"path": path,
		"bytes": bytes,
	}


func _remove_dir(path: String) -> void:
	var dir := DirAccess.open(path)
	if dir == null:
		return
	dir.include_hidden = true
	var error := dir.list_dir_begin()
	if error != OK:
		return
	var name := dir.get_next()
	while name != "":
		if name != "." and name != "..":
			var child := path.path_join(name)
			if dir.current_is_dir():
				_remove_dir(child)
			DirAccess.remove_absolute(child)
		name = dir.get_next()
	dir.list_dir_end()
	DirAccess.remove_absolute(path)


func _failure(message: String) -> Dictionary:
	return {"ok": false, "error": message}
