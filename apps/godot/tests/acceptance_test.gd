extends RefCounted

const EXPECTED_PACK_DIGEST := "sha256:57885cc466ba3fabd4644625c1a00767bee1f1b29f7bd0f3ac61edcbb5ab7d9f"

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
