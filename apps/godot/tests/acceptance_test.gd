extends RefCounted

const EXPECTED_PACK_DIGEST := "sha256:a57e5252b5a608be8158a1bbeac3b604dcc341c90f8bf52142914ea758383893"

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
