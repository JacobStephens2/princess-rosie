extends SceneTree

## Derive and validate the Runtime Edition Pack before a release export.

const RUNTIME_EDITION_PACK := preload("res://addons/edition_pack_export/runtime_edition_pack.gd")


func _init() -> void:
	var args := OS.get_cmdline_user_args()
	if args.is_empty():
		push_error("Runtime Edition Pack root is missing")
		quit(1)
		return
	var pack: RefCounted = RUNTIME_EDITION_PACK.new()
	var derived: Dictionary = pack.derive(args[0])
	if derived.get("ok") != true:
		push_error(str(derived.get("error", "Runtime Edition Pack derivation failed")))
		quit(1)
		return
	print("PASS: Runtime Edition Pack")
	quit(0)
