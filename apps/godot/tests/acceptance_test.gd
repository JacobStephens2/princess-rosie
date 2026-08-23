extends RefCounted

const EXPECTED_PACK_DIGEST := "sha256:df593d65a6620daae0ab6eaf740be51c5a1fcc01ff947fc9595978217401958c"

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
