extends RefCounted

const EXPECTED_PACK_DIGEST := "sha256:541a6b5939abf506aeccbb97fa587843d67a640003ddbf56a1001b8396213f1e"

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
