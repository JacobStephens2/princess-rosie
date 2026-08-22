extends RefCounted

const EXPECTED_PACK_DIGEST := "sha256:03898d8b734cd94d98ae8130dda328fee62bbbfc52faa3e22c5c5edaefac1c9e"

var _failures: Array[String] = []


func expect(condition: bool, message: String) -> void:
	if not condition:
		_failures.append("FAIL: " + message)


func finish(tree: SceneTree, suite_name: String) -> void:
	if _failures.is_empty():
		print("PASS: " + suite_name)
		tree.quit(0)
		return
	for failure in _failures:
		push_error(failure)
	tree.quit(1)
