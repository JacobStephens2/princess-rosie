class_name EditionPackReader
extends RefCounted


func read_bytes(pack_source: String, relative_path: String) -> Dictionary:
	if not is_safe_relative_path(relative_path):
		return _failure("Edition Pack path must stay inside its root: %s" % relative_path)
	if pack_source.get_extension().to_lower() == "zip":
		var archive := ZIPReader.new()
		var archive_error := archive.open(pack_source)
		if archive_error != OK:
			return _failure(
				"Edition Pack archive could not be opened: %s" % error_string(archive_error),
			)
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


func read_json_object(pack_source: String, relative_path: String) -> Dictionary:
	var bytes_result := read_bytes(pack_source, relative_path)
	if not bytes_result.ok:
		return bytes_result
	var json := JSON.new()
	var parse_error := json.parse(bytes_result.value.get_string_from_utf8())
	if parse_error != OK:
		return _failure(
			"Invalid Edition Pack JSON at %s: %s" % [relative_path, json.get_error_message()],
		)
	if not json.data is Dictionary:
		return _failure("Edition Pack JSON must contain an object: %s" % relative_path)
	return {"ok": true, "value": json.data}


func is_safe_relative_path(path: String) -> bool:
	if path.is_empty() or path.is_absolute_path():
		return false
	var simplified := path.simplify_path()
	return simplified != ".." and not simplified.begins_with("../")


func _failure(message: String) -> Dictionary:
	return {"ok": false, "error": message}
