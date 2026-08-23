extends RefCounted

const EXPECTED_PACK_DIGEST := "sha256:b33c79f94dfe16ed740f4b05cf07d9cb9c125beb781d7871f44a776209550918"

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
