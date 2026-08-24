@tool
extends EditorPlugin

const EDITION_PACK_EXPORT_PLUGIN := preload(
	"res://addons/edition_pack_export/edition_pack_export_plugin.gd",
)

var _export_plugin: EditorExportPlugin


func _enter_tree() -> void:
	_export_plugin = EDITION_PACK_EXPORT_PLUGIN.new()
	add_export_plugin(_export_plugin)


func _exit_tree() -> void:
	remove_export_plugin(_export_plugin)
	_export_plugin = null
