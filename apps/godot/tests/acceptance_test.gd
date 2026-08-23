extends RefCounted

const EXPECTED_PACK_DIGEST := "sha256:9b31b3b3b9d90e1a4562c16fe2d4a2f4f9d194f5e30773b624fb77d1b41ddaaf"

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
