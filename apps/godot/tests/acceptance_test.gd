extends RefCounted

const EXPECTED_PACK_DIGEST := "sha256:771a89c1ba34ab4759c27e6013003ddb08e42e3571a69affbd0cbb46f5cfdacb"

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
