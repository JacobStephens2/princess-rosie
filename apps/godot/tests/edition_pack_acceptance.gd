extends SceneTree

const EDITION_PACK_ADAPTER := preload("res://scripts/edition_pack_adapter.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	var adapter := EDITION_PACK_ADAPTER.new()
	var pack_root := ProjectSettings.globalize_path("res://../../shared/edition")
	var prepared: Dictionary = adapter.prepare(pack_root, ACCEPTANCE_TEST.EXPECTED_PACK_DIGEST)

	test.expect(
		prepared.get("ok") == true,
		"the valid Edition Pack prepares: %s" % prepared.get("error", "unknown error"),
	)
	test.expect(prepared.get("contract_version") == "rosie-edition-contract/1", "the contract version is retained")
	test.expect(
		prepared.get("revision") == "mvp-soundscape-1",
		"the revision is retained",
	)
	test.expect(prepared.get("pack_digest") == ACCEPTANCE_TEST.EXPECTED_PACK_DIGEST, "the exact digest is retained")
	test.expect(
		prepared.get("scenario_ids") == ["opening-flight", "tracer-bullet"],
		"the scenario identities are retained",
	)

	var mismatched: Dictionary = adapter.prepare(pack_root, "sha256:" + "0".repeat(64))
	test.expect(mismatched.get("ok") == false, "a mismatched Edition Pack fails before play")
	test.expect(
		str(mismatched.get("error", "")).contains("digest mismatch"),
		"a mismatch explains why the Edition Pack was rejected",
	)

	var malformed_root := ProjectSettings.globalize_path("res://tests/fixtures/malformed-pack")
	var malformed: Dictionary = adapter.prepare(malformed_root)
	test.expect(malformed.get("ok") == false, "a malformed Edition Pack fails before play")
	test.expect(
		malformed.get("error") == "Every Edition Pack file needs a role and relative path",
		"malformed input returns a controlled explanation",
	)

	test.finish(self, "Edition Pack adapter acceptance")
