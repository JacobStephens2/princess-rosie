extends SceneTree

const EDITION_PACK_ADAPTER := preload("res://scripts/edition_pack_adapter.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")

const CHARACTER_ID := "flight.rosie-stella"
const CHARACTER_PATH := "source-media/flight/rosie-stella.png"
const CHARACTER_SHA256 := "5b711626b4e43be16084d6c1a879b61ac958a7dd08b5b326fd80f0e273e62532"
const BACKGROUND_ID := "flight.rose-garden-background"
const BACKGROUND_PATH := "source-media/flight/rose-garden-background.png"
const BACKGROUND_SHA256 := "da9eabdb23b01639e01b9d6f3b304ba10ae4876a44ce6a00ccd4a371d1ba6c81"

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	var adapter := EDITION_PACK_ADAPTER.new()
	var pack_root := ProjectSettings.globalize_path("res://../../shared/edition")
	var prepared: Dictionary = adapter.prepare(pack_root)
	test.expect(prepared.get("ok") == true, "the flight-media Edition Pack prepares")
	var media_result: Dictionary = adapter.load_media(pack_root, prepared)
	test.expect(media_result.get("ok") == true, "the canonical flight media index loads")
	var character_media: Dictionary = {}
	var background_media: Dictionary = {}
	if media_result.get("ok") == true:
		for media_value: Variant in media_result.value.get("media", []):
			if media_value is Dictionary:
				if media_value.get("id") == CHARACTER_ID:
					character_media = media_value
				elif media_value.get("id") == BACKGROUND_ID:
					background_media = media_value
	test.expect(character_media.get("role") == "character-layer", "Rosie and Stella are a distinct character layer")
	test.expect(character_media.get("path") == CHARACTER_PATH, "the character layer has one canonical source path")

	var image_result: Dictionary = (
		adapter.load_png_texture(pack_root, CHARACTER_PATH)
		if character_media.get("path") == CHARACTER_PATH
		else {}
	)
	test.expect(image_result.get("ok") == true, "the approved Rosie and Stella PNG decodes in Godot")
	test.expect(image_result.get("texture") is Texture2D, "the character layer becomes an engine-native texture")
	test.expect(image_result.get("sha256") == CHARACTER_SHA256, "the exact selected character bytes are retained")
	test.expect(image_result.get("has_transparency") == true, "the character layer contains genuine alpha transparency")
	test.expect(
		image_result.get("transparent_pixel_count", 0) > 1000,
		"transparent pixels surround the complete character silhouette",
	)
	test.expect(background_media.get("path") == BACKGROUND_PATH, "the flight background has one canonical source path")
	var background_result: Dictionary = adapter.load_png_texture(pack_root, BACKGROUND_PATH)
	test.expect(background_result.get("ok") == true, "the selected Rosalia's Rose Garden flight plate decodes")
	test.expect(background_result.get("sha256") == BACKGROUND_SHA256, "the exact selected background bytes are retained")
	test.finish(self, "flight media acceptance")
