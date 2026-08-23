extends SceneTree

const STORYBOOK_SCENE := preload("res://scenes/storybook_shell.tscn")
const EDITION_PACK_ADAPTER := preload("res://scripts/edition_pack_adapter.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")
const LACEWOOD_BACKGROUND := "source-media/lacewood/lacewood-background.png"

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	_run.call_deferred()


func _run() -> void:
	var adapter := EDITION_PACK_ADAPTER.new()
	var pack_root := ProjectSettings.globalize_path("res://../../shared/edition")
	var prepared: Dictionary = adapter.prepare(pack_root)
	var media_result: Dictionary = adapter.load_media(pack_root, prepared)
	var lacewood_media: Dictionary = {}
	for media_value: Variant in media_result.get("value", {}).get("media", []):
		if media_value is Dictionary and media_value.get("id") == "lacewood.background":
			lacewood_media = media_value
	test.expect(
		lacewood_media == {
			"id": "lacewood.background",
			"role": "illustration-layer",
			"path": LACEWOOD_BACKGROUND,
		},
		"the Edition Pack exposes the finished Lacewood scenery as an authored layer",
	)
	var lacewood_image: Dictionary = adapter.load_png_texture(pack_root, LACEWOOD_BACKGROUND)
	test.expect(
		lacewood_image.get("sha256")
		== "1fdebf2de5a74187ed446a6cdfc957a44c618936d2a46c9caa3b540c2d2984b6",
		"the production Lacewood plate retains its selected immutable bytes",
	)

	var shell: StorybookShell = STORYBOOK_SCENE.instantiate()
	root.add_child(shell)
	await process_frame
	test.expect(shell.handle_player_intent("begin"), "the visual journey begins")
	for _moment: int in 3:
		test.expect(
			shell.handle_player_action(&"keyboard.space", true),
			"the real shared action advances the visual journey",
		)
		shell.handle_player_action(&"keyboard.space", false)
	shell.handle_player_action(&"keyboard.space", true)
	shell.advance_journey(0.75)
	await process_frame

	var evidence := shell.storybook_stage_evidence()
	test.expect(
		evidence.get("lacewood_background_visible") == true,
		"finished Lacewood scenery replaces the Rose Garden plate at place entry",
	)
	test.expect(
		evidence.get("lacewood_route_composition") == {
			"both_routes_visible": true,
			"routes_equal_emphasis": true,
			"atmospheric_motion": true,
			"selected_visual_response": "",
			"rendered_visual_response": "",
			"shimmer_route": "",
			"celebration_echo": "",
		},
		"the unchosen canopy and woodland floor read as equally inviting routes",
	)
	test.expect(
		evidence.get("flight_character_visible") == true
		and evidence.get("essential_content_cropped") == false,
		"Princess Rosie, Stella, and the essential route cues stay readable inside the Stage",
	)
	test.expect(
		shell.presentation_evidence().get("lacewood_media_paths") == {
			"lacewood.background": LACEWOOD_BACKGROUND,
		},
		"runtime presentation evidence retains the canonical Lacewood scenery identity",
	)

	shell.advance_journey(1.25)
	shell.handle_player_action(&"keyboard.space", false)
	await process_frame
	var selected_composition: Dictionary = shell.storybook_stage_evidence().get(
		"lacewood_route_composition",
		{},
	)
	test.expect(
		selected_composition.get("selected_visual_response") == "silver-ribbons-unfurl"
		and selected_composition.get("rendered_visual_response") == "silver-ribbons-unfurl",
		"the canopy selection visibly unfurls silver ribbons before the routes rejoin",
	)
	shell.advance_journey(1.8)
	test.expect(shell.handle_player_action(&"keyboard.space", true), "the first route resumes")
	shell.handle_player_action(&"keyboard.space", false)
	shell.advance_journey(4.9)
	await _send_space_input(true)
	await _send_space_input(false)
	var celebration_composition: Dictionary = shell.storybook_stage_evidence().get(
		"lacewood_route_composition",
		{},
	)
	test.expect(
		celebration_composition.get("both_routes_visible") == false
		and celebration_composition.get("celebration_echo") == "silver-ribbons",
		"the celebration carries only the chosen route's authored echo beyond the rejoin",
	)
	test.expect(shell.handle_player_intent("escape"), "the first journey opens the Grown-up Corner")
	test.expect(shell.handle_player_intent("replay"), "the first journey replays with private history")
	test.expect(shell.handle_player_intent("begin"), "the replay begins")
	for _moment: int in 3:
		test.expect(
			shell.handle_player_action(&"pointer.primary", true),
			"primary pointer intent advances the replay",
		)
		shell.handle_player_action(&"pointer.primary", false)
	shell.handle_player_action(&"pointer.primary", true)
	shell.advance_journey(0.75)
	await process_frame
	test.expect(
		shell.storybook_stage_evidence().get("lacewood_route_composition", {}).get(
			"shimmer_route",
		) == "lacewood.floor",
		"only the unexplored woodland floor receives one restrained Journey History shimmer",
	)

	shell.queue_free()
	await process_frame
	test.finish(self, "Lacewood presentation acceptance")


func _send_space_input(pressed: bool) -> void:
	var event := InputEventKey.new()
	event.physical_keycode = KEY_SPACE
	event.pressed = pressed
	Input.parse_input_event(event)
	await process_frame
