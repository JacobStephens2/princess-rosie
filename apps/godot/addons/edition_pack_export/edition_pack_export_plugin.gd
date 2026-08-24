@tool
extends EditorExportPlugin

## Stages the Edition Pack into the exported application.
##
## The Godot Edition reads shared/edition/ byte for byte, so the pack cannot be
## copied under res:// where Godot's importer would convert its PNGs and WAVs.
## Instead every file the Edition Pack manifest declares is added to the exported
## package unmodified, at the bundled pack root the shell looks for first.

const BUNDLED_PACK_ROOT := "res://edition"
const WORKSPACE_PACK_ROOT := "res://../../shared/edition"
const MANIFEST_NAME := "edition.json"


func _get_name() -> String:
	return "Edition Pack export"


func _export_begin(
	_features: PackedStringArray,
	_is_debug: bool,
	_path: String,
	_flags: int,
) -> void:
	var manifest_bytes := FileAccess.get_file_as_bytes(
		WORKSPACE_PACK_ROOT.path_join(MANIFEST_NAME),
	)
	if manifest_bytes.is_empty():
		push_error("Edition Pack manifest is missing: %s" % WORKSPACE_PACK_ROOT)
		return

	var manifest: Variant = JSON.parse_string(manifest_bytes.get_string_from_utf8())
	if not manifest is Dictionary or not manifest.get("files") is Array:
		push_error("Edition Pack manifest must declare an array of files")
		return

	_stage(MANIFEST_NAME, manifest_bytes)
	for file_value: Variant in manifest.files:
		if not file_value is Dictionary or not file_value.get("path") is String:
			push_error("Every Edition Pack file needs a relative path")
			return
		var relative_path: String = file_value.path
		var bytes := FileAccess.get_file_as_bytes(
			WORKSPACE_PACK_ROOT.path_join(relative_path),
		)
		if bytes.is_empty():
			push_error("Edition Pack file is missing or empty: %s" % relative_path)
			return
		_stage(relative_path, bytes)


func _stage(relative_path: String, bytes: PackedByteArray) -> void:
	add_file(BUNDLED_PACK_ROOT.path_join(relative_path), bytes, false)
