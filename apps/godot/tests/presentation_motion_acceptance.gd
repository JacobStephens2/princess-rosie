extends SceneTree

const STORYBOOK_SCENE := preload("res://scenes/storybook_shell.tscn")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	_run.call_deferred()


func _run() -> void:
	var shell: StorybookShell = STORYBOOK_SCENE.instantiate()
	root.add_child(shell)
	await process_frame

	var begin_button := shell.get_node("%BeginButton") as Button
	begin_button.pressed.emit()
	await process_frame
	var opening_before: Dictionary = shell.storybook_stage_evidence()
	var opening_moment_before: String = shell.presentation_evidence().get("opening_moment", "")
	await create_timer(0.12).timeout
	var opening_after: Dictionary = shell.storybook_stage_evidence()
	test.expect(
		opening_after.get("opening_visible") == true,
		"the current Opening Storybook Moment keeps its full illustration visible",
	)
	test.expect(
		shell.presentation_evidence().get("opening_moment") == opening_moment_before,
		"authored motion never advances a Storybook Moment on a timer",
	)
	test.expect(
		not is_equal_approx(
			opening_before.get("opening_motion", {}).get("art_scale", 0.0),
			opening_after.get("opening_motion", {}).get("art_scale", 0.0),
		),
		"the illustration breathes gently while the story waits",
	)
	test.expect(
		opening_after.get("opening_text_minimum_font_size", 0) >= 19,
		"Opening Storybook Moment text remains large and readable",
	)

	var continue_button := shell.get_node("%ContinueButton") as Button
	for _moment: int in 2:
		continue_button.button_down.emit()
		continue_button.button_up.emit()
		await process_frame
	continue_button.button_down.emit()
	test.expect(
		shell.presentation_evidence().get("movement_state") == "rise",
		"holding the visible pointer CTA launches into the same rise state as Space",
	)
	continue_button.button_up.emit()
	test.expect(
		shell.presentation_evidence().get("movement_state") == "glide",
		"releasing the visible pointer CTA enters the shared glide state",
	)
	await process_frame
	var flight_before: Dictionary = shell.storybook_stage_evidence()
	await create_timer(0.12).timeout
	var flight_after: Dictionary = shell.storybook_stage_evidence()
	test.expect(flight_after.get("active_play_visible") == true, "the opening transitions into the flight scene")
	test.expect(flight_after.get("flight_background_visible") == true, "Rosalia's Rose Garden flight plate is visible")
	test.expect(flight_after.get("flight_character_visible") == true, "Rosie and Stella are visible in flight")
	test.expect(
		shell.presentation_evidence().get("flight_media_paths") == {
			"flight.rose-garden-background": "source-media/flight/rose-garden-background.png",
			"flight.rosie-stella": "source-media/flight/rosie-stella.png",
		},
		"flight uses authored background and transparent character layers from the Edition Pack",
	)
	test.expect(
		flight_after.get("flight_motion", {}).get("background_offset_x", 0.0)
		!= flight_before.get("flight_motion", {}).get("background_offset_x", 0.0),
		"automatic forward flight produces gentle background parallax",
	)
	shell.advance_simulation(1.3)
	await process_frame
	var before_old_wrap_point: float = (
		shell.storybook_stage_evidence().get("flight_motion", {}).get("background_offset_x", 0.0)
	)
	shell.advance_simulation(0.2)
	await process_frame
	var after_old_wrap_point: float = (
		shell.storybook_stage_evidence().get("flight_motion", {}).get("background_offset_x", 0.0)
	)
	test.expect(
		after_old_wrap_point <= before_old_wrap_point,
		"forward parallax remains smooth instead of wrapping backward",
	)
	test.expect(
		flight_after.get("flight_motion", {}).get("character_position", {})
		!= flight_before.get("flight_motion", {}).get("character_position", {}),
		"Rosie and Stella have gentle native transform animation",
	)

	shell.queue_free()
	await process_frame
	test.finish(self, "presentation motion acceptance")
