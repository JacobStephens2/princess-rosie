extends RefCounted

const EXPECTED_PACK_DIGEST := "sha256:a48913c079f6c1d5a8cff3357cff429c2665b64bf7aff92810612eb2929fa7d3"

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
