extends RefCounted

const EXPECTED_PACK_DIGEST := "sha256:19a9e458b2c4b86155ab2ba5cad8bbe599e2e7ad0b29c3c9b13e50beeaac3fb1"

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
