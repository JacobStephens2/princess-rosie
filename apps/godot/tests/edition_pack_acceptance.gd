extends SceneTree

const EDITION_PACK_ADAPTER := preload("res://scripts/edition_pack_adapter.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	var adapter := EDITION_PACK_ADAPTER.new()
	var pack_root := ProjectSettings.globalize_path(ACCEPTANCE_TEST.PACK_ROOT)
	var prepared: Dictionary = adapter.prepare(pack_root)

	test.expect(
		prepared.get("ok") == true,
		"the valid Edition Pack prepares: %s" % prepared.get("error", "unknown error"),
	)
	test.expect(prepared.get("contract_version") == "rosie-edition-contract/1", "the contract version is retained")
	test.expect(
		prepared.get("revision") == ACCEPTANCE_TEST.EXPECTED_PACK_REVISION,
		"the revision is retained",
	)

	var content: Dictionary = adapter.load_content(pack_root, prepared)
	test.expect(
		content.get("ok") == true and content.get("value") is Dictionary,
		"the content role loads through the adapter",
	)
	var media: Dictionary = adapter.load_media(pack_root, prepared)
	test.expect(
		media.get("ok") == true and media.get("value") is Dictionary,
		"the media role loads through the adapter",
	)

	var escaping_root := ProjectSettings.globalize_path("res://tests/fixtures/escaping-pack")
	var escaping: Dictionary = adapter.prepare(escaping_root)
	test.expect(escaping.get("ok") == false, "an Edition Pack path leaving its root is rejected")
	test.expect(
		str(escaping.get("error", "")).contains("must stay inside its root"),
		"an escaping path explains why the Edition Pack was rejected",
	)

	var malformed_root := ProjectSettings.globalize_path("res://tests/fixtures/malformed-pack")
	var malformed: Dictionary = adapter.prepare(malformed_root)
	test.expect(malformed.get("ok") == false, "a malformed Edition Pack fails before play")
	test.expect(
		malformed.get("error") == "Every Edition Pack file needs a role and relative path",
		"malformed input returns a controlled explanation",
	)

	test.finish(self, "Edition Pack adapter acceptance")
