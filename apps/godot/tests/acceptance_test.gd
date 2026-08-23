extends RefCounted

const EXPECTED_PACK_DIGEST := "sha256:94afde79ec5f2e6aa4bab2b58270bb2354b57e407f865abc9f51bfe3a88a23a7"

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
