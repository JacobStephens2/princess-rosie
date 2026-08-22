extends SceneTree

const EXPECTED_DIGEST := "sha256:03898d8b734cd94d98ae8130dda328fee62bbbfc52faa3e22c5c5edaefac1c9e"
const EditionPackAdapter := preload("res://scripts/edition_pack_adapter.gd")

var failures: Array[String] = []


func _init() -> void:
	var adapter := EditionPackAdapter.new()
	var pack_root := ProjectSettings.globalize_path("res://../../shared/edition")
	var prepared: Dictionary = adapter.prepare(pack_root, EXPECTED_DIGEST)

	_expect(prepared.get("ok") == true, "the valid Edition Pack prepares")
	_expect(prepared.get("contract_version") == "rosi-edition-contract/1", "the contract version is retained")
	_expect(prepared.get("revision") == "tracer-lacewood-1", "the revision is retained")
	_expect(prepared.get("pack_digest") == EXPECTED_DIGEST, "the exact digest is retained")
	_expect(prepared.get("scenario_ids") == ["tracer-bullet"], "the scenario identity is retained")

	var mismatched: Dictionary = adapter.prepare(pack_root, "sha256:" + "0".repeat(64))
	_expect(mismatched.get("ok") == false, "a mismatched Edition Pack fails before play")
	_expect(
		str(mismatched.get("error", "")).contains("digest mismatch"),
		"a mismatch explains why the Edition Pack was rejected",
	)

	if failures.is_empty():
		print("PASS: Edition Pack adapter acceptance")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)


func _expect(condition: bool, message: String) -> void:
	if not condition:
		failures.append("FAIL: " + message)
