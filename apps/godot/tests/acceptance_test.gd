extends RefCounted

const EXPECTED_PACK_DIGEST := "sha256:2837b626d1835cc0b573e000be6f7b783e6ede6237650fa36f3150b3d587c90b"

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
