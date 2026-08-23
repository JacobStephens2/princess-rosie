extends RefCounted

const EXPECTED_PACK_DIGEST := "sha256:ee2c6687a97c9991e3627c53dc3d1101c1aa6372d393b9a20305d59152729233"

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
