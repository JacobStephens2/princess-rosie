extends SceneTree

const EDITION_PACK_ADAPTER := preload("res://scripts/edition_pack_adapter.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")

const APPROVED_MEDIA := {
	"opening.celebration-preparations": {
		"path": "source-media/opening-storybook/celebration-preparations.png",
		"sha256": "d301c682d75db0c96d0a0750543ef9876bc1c252dde74ef70492c7bd5ce1220f",
	},
	"opening.scattered-stars": {
		"path": "source-media/opening-storybook/scattered-stars.png",
		"sha256": "d32b9ec5f56342bf7a8aed2b4c8816ade67fc6a771d7379fd4005db153b7fda7",
	},
	"opening.rosie-stella-departure": {
		"path": "source-media/opening-storybook/rosie-stella-departure.png",
		"sha256": "50d6d95b8d330cb1663d8f7327700569c35f7fc25fbf386d94b73e5cb25abcb3",
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
