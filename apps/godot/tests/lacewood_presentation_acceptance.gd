extends SceneTree

const STORYBOOK_SCENE := preload("res://scenes/storybook_shell.tscn")
const EDITION_PACK_ADAPTER := preload("res://scripts/edition_pack_adapter.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")
const LACEWOOD_BACKGROUND := "source-media/lacewood/lacewood-single-route-background.png"
const DEFERRED_FORK_ARTWORK := "source-media/lacewood/lacewood-background.png"
const KEYBOARD_SPACE: StringName = &"keyboard.space"

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
		"the Edition Pack activates the uninterrupted single-route Lacewood scenery",
	)
	test.expect(
		FileAccess.file_exists(pack_root.path_join(DEFERRED_FORK_ARTWORK)),
		"the former fork artwork remains reusable for a possible post-MVP reconsideration",
	)

	var shell: StorybookShell = STORYBOOK_SCENE.instantiate()
	root.add_child(shell)
	await process_frame
	test.expect(
		shell.prepare_launch(pack_root).get("ok") == true,
		"the visual journey prepares from the current Edition Pack",
	)
	test.expect(shell.handle_player_intent("begin"), "the visual journey begins")
	for _moment: int in 2:
		shell.handle_player_action(KEYBOARD_SPACE, true)
		shell.handle_player_action(KEYBOARD_SPACE, false)
	shell.handle_player_action(KEYBOARD_SPACE, true)
	shell.advance_journey(0.75)
	await process_frame

	var entry := shell.storybook_stage_evidence()
	test.expect(
		entry.get("lacewood_background_visible") == true,
		"finished Lacewood scenery replaces the Rose Garden plate without a fork pause",
	)
	test.expect(
		entry.get("lacewood_single_route_composition") == {
			"single_corridor_visible": true,
			"fork_visible": false,
			"atmospheric_motion": true,
			"silver_ribbons_visible": true,
			"rose_lights_visible": true,
			"observed_visual_responses": [],
			"celebration_echo": "",
		},
		"one corridor combines the silver ribbons and rose lights without advertising a choice",
	)
	test.expect(
		shell.get_node_or_null("%CanopyRouteTarget") == null
		and shell.get_node_or_null("%FloorRouteTarget") == null,
		"the Storybook Stage contains no route-selection targets",
	)

	var start_position: Dictionary = entry.get("flight_motion", {}).get("character_position", {})
	for _frame: int in 30:
		shell.advance_simulation(1.0 / 60.0)
	shell.advance_journey(9.0)
	await process_frame
	var midpoint := shell.storybook_stage_evidence()
	var midpoint_position: Dictionary = midpoint.get("flight_motion", {}).get("character_position", {})
	test.expect(
		float(midpoint_position.get("x", 0.0)) - float(start_position.get("x", 0.0)) >= 300.0,
		"Stella visibly travels forward through the sustained Lacewood passage",
	)
	var high_y := float(midpoint_position.get("y", 0.0))
	shell.handle_player_action(KEYBOARD_SPACE, false)
	for _frame: int in 60:
		shell.advance_simulation(1.0 / 60.0)
	shell.advance_journey(0.1)
	await process_frame
	var settled_y := float(
		shell.storybook_stage_evidence().get("flight_motion", {}).get(
			"character_position",
			{},
		).get("y", 0.0),
	)
	test.expect(settled_y > high_y, "release visibly settles Stella lower inside the same corridor")
	test.expect(
		(shell.get_node("%FlightInstruction") as Label).text == "Hold to rise • release to settle",
		"the active passage teaches Flight Control instead of route selection",
	)

	shell.queue_free()
	await process_frame
	test.finish(self, "Lacewood presentation acceptance")
