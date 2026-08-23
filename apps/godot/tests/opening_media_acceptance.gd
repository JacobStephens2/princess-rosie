extends SceneTree

const EDITION_PACK_ADAPTER := preload("res://scripts/edition_pack_adapter.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")

const APPROVED_MEDIA := {
	"opening.celebration-preparations": {
		"path": "source-media/opening-storybook/celebration-preparations.png",
		"sha256": "1fc33ef846de26acc92074281b6136da08529ec40572acd42f5533ba585f4dac",
	},
	"opening.scattered-stars": {
		"path": "source-media/opening-storybook/scattered-stars.png",
		"sha256": "90f3f020fa58e993224f94932c6a8eb254ad8d030cc0b5ee59e93896c4417c7e",
	},
	"opening.rosi-stella-departure": {
		"path": "source-media/opening-storybook/rosi-stella-departure.png",
		"sha256": "ca7d2a1544eabb64cd9b926410eb50d4ed96c51dda32358c340d7e7d10bb67a6",
	},
}

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	var adapter := EDITION_PACK_ADAPTER.new()
	var pack_root := ProjectSettings.globalize_path("res://../../shared/edition")
	var prepared: Dictionary = adapter.prepare(pack_root)
	test.expect(prepared.get("ok") == true, "the opening media Edition Pack prepares")
	test.expect(adapter.has_method("load_media"), "the adapter exposes canonical media by role")
	test.expect(adapter.has_method("load_png_texture"), "the adapter decodes approved PNG bytes")
	var media_result: Dictionary = adapter.load_media(pack_root, prepared) if adapter.has_method("load_media") else {}
	test.expect(media_result.get("ok") == true, "the canonical media index loads")
	var media_by_id: Dictionary = {}
	if media_result.get("ok") == true:
		for media_value: Variant in media_result.value.get("media", []):
			if media_value is Dictionary:
				media_by_id[media_value.get("id")] = media_value
	for media_id: String in APPROVED_MEDIA:
		var expected: Dictionary = APPROVED_MEDIA[media_id]
		var media: Dictionary = media_by_id.get(media_id, {})
		test.expect(
			media.get("path") == expected.path,
			"%s retains its canonical read-only Edition Pack path" % media_id,
		)
		var image_result: Dictionary = (
			adapter.load_png_texture(pack_root, expected.path)
			if adapter.has_method("load_png_texture")
			else {}
		)
		test.expect(image_result.get("ok") == true, "%s decodes from approved bytes" % media_id)
		test.expect(image_result.get("texture") is Texture2D, "%s becomes an engine-native texture" % media_id)
		test.expect(
			image_result.get("sha256") == expected.sha256,
			"%s is consumed without editing or re-encoding" % media_id,
		)
	test.finish(self, "Opening Storybook Moment media acceptance")
