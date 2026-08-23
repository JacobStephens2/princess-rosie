extends RefCounted

const EXPECTED_PACK_DIGEST := "sha256:83dc2d43626258f696c5dc4de6fd4d5a2aee04d3bf8b6721a40abcf9556874ba"

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
