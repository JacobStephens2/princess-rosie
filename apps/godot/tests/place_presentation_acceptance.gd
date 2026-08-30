extends SceneTree

const STORYBOOK_SCENE := preload("res://scenes/storybook_shell.tscn")
const EDITION_PACK_ADAPTER := preload("res://scripts/edition_pack_adapter.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")
const DRIVER := preload("res://tests/place_journey_driver.gd")
const ROSE_GARDEN_BACKGROUND := "source-media/flight/rose-garden-background.png"
const LACEWOOD_BACKGROUND := "source-media/lacewood/lacewood-single-route-background.png"
const ABBEY_BACKGROUND := "source-media/abbey/abbey-background.png"
const CLOISTER_BACKGROUND := "source-media/cloister/cloister-background.png"
const PELLEGRINO_PEAK_BACKGROUND := "source-media/pellegrino-peak/pellegrino-peak-background.png"
const SAPPHIRE_SEA_BACKGROUND := "source-media/sapphire-sea/sapphire-sea-background.png"
const DEFERRED_FORK_ARTWORK := "source-media/lacewood/lacewood-background.png"
const KEYBOARD_SPACE: StringName = &"keyboard.space"

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	_run.call_deferred()


func _run() -> void:
	var adapter := EDITION_PACK_ADAPTER.new()
	var pack_root := ProjectSettings.globalize_path(ACCEPTANCE_TEST.PACK_ROOT)
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
	test.expect(
		shell.presentation_evidence().get("place_media_paths") == {
			"flight.rose-garden-background": ROSE_GARDEN_BACKGROUND,
			"lacewood.background": LACEWOOD_BACKGROUND,
			"abbey.background": ABBEY_BACKGROUND,
			"cloister.background": CLOISTER_BACKGROUND,
			"pellegrino-peak.background": PELLEGRINO_PEAK_BACKGROUND,
			"sapphire-sea.background": SAPPHIRE_SEA_BACKGROUND,
		},
		"the realized places carry one Place Illustration each: %s"
		% JSON.stringify(shell.presentation_evidence().get("place_media_paths")),
	)
	DRIVER.launch(shell)
	test.expect(
		shell.presentation_evidence().get("state") == "active_play",
		"the visual journey begins and launches into flight",
	)
	DRIVER.advance(shell, 0.75)
	await process_frame

	var entry := shell.storybook_stage_evidence()
	test.expect(
		entry.get("place_background_visible") == true,
		"the first Place Illustration replaces the launch plate without a fork pause",
	)
	test.expect(
		entry.get("place_composition") == {
			"place": "rose-garden",
			"tint": "#ffd7e6",
			"single_corridor_visible": true,
			"fork_visible": false,
			"atmospheric_motion": true,
			"high_interaction_visible": true,
			"low_interaction_visible": true,
			"observed_visual_responses": [],
			"place_tint_applied": true,
			"playful_bump_wobble_visible": false,
		},
		"one corridor combines both altitude bands without advertising a choice: %s"
		% JSON.stringify(entry.get("place_composition")),
	)
	test.expect(
		shell.get_node_or_null("%CanopyRouteTarget") == null
		and shell.get_node_or_null("%FloorRouteTarget") == null,
		"the Storybook Stage contains no route-selection targets",
	)

	var start_position: Dictionary = entry.get("flight_motion", {}).get("character_position", {})
	for _frame: int in 30:
		shell.advance_simulation(1.0 / 60.0)
	DRIVER.advance(shell, 9.0)
	await process_frame
	var midpoint := shell.storybook_stage_evidence()
	var midpoint_position: Dictionary = midpoint.get("flight_motion", {}).get("character_position", {})
	test.expect(
		float(midpoint_position.get("x", 0.0)) - float(start_position.get("x", 0.0)) >= 300.0,
		"Stella visibly travels forward through the sustained passage",
	)
	var high_y := float(midpoint_position.get("y", 0.0))
	shell.handle_player_action(KEYBOARD_SPACE, false)
	for _frame: int in 60:
		shell.advance_simulation(1.0 / 60.0)
	DRIVER.advance(shell, 0.1)
	await process_frame
	var settled_y := float(
		shell.storybook_stage_evidence().get("flight_motion", {}).get(
			"character_position",
			{},
		).get("y", 0.0),
	)
	test.expect(settled_y > high_y, "release visibly settles Stella lower inside the same corridor")
	test.expect(
		(shell.get_node("%FlightTitle") as Label).text == "Flying through Rosalia’s Rose Garden",
		"the active passage names the place the child is looking at",
	)
	test.expect(
		(shell.get_node("%FlightInstruction") as Label).text == "Hold to rise • release to settle",
		"the active passage teaches Flight Control instead of route selection",
	)

	# Crossing into the second place repaints the same composition in its own light.
	DRIVER.advance(shell, 24.0)
	DRIVER.turn_the_page(shell)
	DRIVER.advance(shell, 0.2)
	await process_frame
	var crossing := shell.storybook_stage_evidence()
	test.expect(
		crossing.get("place_background_visible") == true
		and crossing.get("place_composition", {}).get("place") == "lacewood"
		and crossing.get("place_composition", {}).get("tint") == "#e8f2ff",
		"the second place presents through the same module with its own illustration and tint: %s"
		% JSON.stringify(crossing.get("place_composition")),
	)
	test.expect(
		(shell.get_node("%FlightTitle") as Label).text == "Flying through Zélie’s Lacewood",
		"the active passage follows the child into the next place",
	)

	shell.queue_free()
	await process_frame
	test.finish(self, "place presentation acceptance")
