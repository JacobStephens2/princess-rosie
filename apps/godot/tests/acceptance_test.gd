extends RefCounted

const EXPECTED_PACK_DIGEST := "sha256:c28c4e10b5a0097d0fa5440fbb96b01c7e8d4a479ff7282231954bb53b0fec2b"

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
