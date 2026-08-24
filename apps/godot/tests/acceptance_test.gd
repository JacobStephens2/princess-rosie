extends RefCounted

const EXPECTED_PACK_DIGEST := "sha256:51f640649f7c7a2ca140e04993e0455283a87dd1b56e92463f172526b371a4f2"

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
