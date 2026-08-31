@tool
extends EditorExportPlugin

## Stages the Runtime Edition Pack into the exported application.
##
## The editor and development acceptance suite read the complete authoritative
## Edition Pack from shared/edition/. Release packaging derives a player-facing
## subset instead of copying that tree wholesale. The derived files are added
## unmodified under res://edition, where the shell looks first. Notices are
## copied alongside the exported application, not into the PCK.

const BUNDLED_PACK_ROOT := "res://edition"
const WORKSPACE_PACK_ROOT := "res://../../shared/edition"
const NOTICES_ROOT := "res://notices"
const NOTICE_FILES := ["NOTICE.txt", "THIRD-PARTY-NOTICES.txt"]
const RUNTIME_EDITION_PACK := preload("res://addons/edition_pack_export/runtime_edition_pack.gd")

var _export_path := ""
var _derived_ok := false


func _get_name() -> String:
	return "Edition Pack export"


func _export_begin(
	_features: PackedStringArray,
	_is_debug: bool,
	path: String,
	_flags: int,
) -> void:
	_export_path = path
	_derived_ok = false
	var development_root := ProjectSettings.globalize_path(WORKSPACE_PACK_ROOT)
	var pack: RefCounted = RUNTIME_EDITION_PACK.new()
	var derived: Dictionary = pack.derive(development_root)
	if derived.get("ok") != true:
		push_error("Runtime Edition Pack derivation failed: %s" % derived.get("error", "unknown error"))
		return
	for file_value: Variant in derived.get("files", []):
		if not file_value is Dictionary or not file_value.get("path") is String:
			push_error("Every Runtime Edition Pack file needs a relative path")
			return
		if not file_value.get("bytes") is PackedByteArray:
			push_error("Runtime Edition Pack file is missing bytes: %s" % file_value.path)
			return
		_stage(file_value.path, file_value.bytes)
	_derived_ok = true


func _export_end() -> void:
	if not _derived_ok or _export_path.is_empty():
		return
	var notice_root := ProjectSettings.globalize_path(NOTICES_ROOT)
	_copy_notices(notice_root, _export_path.get_base_dir())
	if _export_path.ends_with(".app"):
		_copy_notices(notice_root, _export_path.path_join("Contents/Resources"))


func _stage(relative_path: String, bytes: PackedByteArray) -> void:
	add_file(BUNDLED_PACK_ROOT.path_join(relative_path), bytes, false)


func _copy_notices(notice_root: String, dest_dir: String) -> void:
	var make_error := DirAccess.make_dir_recursive_absolute(dest_dir)
	if make_error != OK:
		push_error("Could not create notice destination: %s" % dest_dir)
		return
	for file_name: String in NOTICE_FILES:
		var bytes := FileAccess.get_file_as_bytes(notice_root.path_join(file_name))
		if bytes.is_empty():
			push_error("Release notice is missing: %s" % file_name)
			return
		var dest_path := dest_dir.path_join(file_name)
		var out := FileAccess.open(dest_path, FileAccess.WRITE)
		if out == null:
			push_error("Could not write release notice: %s" % dest_path)
			return
		out.store_buffer(bytes)
