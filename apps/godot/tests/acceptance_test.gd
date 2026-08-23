extends RefCounted

const EXPECTED_PACK_DIGEST := "sha256:f5928502373b7455982851e8a10fad81b8370b3b8b6b0520a6e788f23438455c"

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
