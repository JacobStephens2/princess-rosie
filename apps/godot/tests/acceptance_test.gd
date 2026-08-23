extends RefCounted

const EXPECTED_PACK_DIGEST := "sha256:9b866ec9be74d5425a6ec1ad1b6940deffd7168b3fc22493beecb285647a8ce6"

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
