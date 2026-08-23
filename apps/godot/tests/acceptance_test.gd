extends RefCounted

const EXPECTED_PACK_DIGEST := "sha256:1a66a495acdf0cd05006a9f60a22cf9867608e278f77d8ae4fbc4917fd20737b"

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
