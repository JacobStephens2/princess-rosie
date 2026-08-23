extends RefCounted

const EXPECTED_PACK_DIGEST := "sha256:7b6ceb969f5ce01aacf815193dd2d3275e24d4869febee284235d2b8fdfadbe2"

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
