extends RefCounted

const EXPECTED_PACK_DIGEST := "sha256:ecb805ab4f01bcc8eed2a4fef4dae0d7342f4cdb3803ed3a79d5cf4374758431"

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
