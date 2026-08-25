extends SceneTree

const STORYBOOK_SHELL := preload("res://scripts/storybook_shell.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")
const KEYBOARD_SPACE: StringName = &"keyboard.space"
const POINTER_PRIMARY: StringName = &"pointer.primary"

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	var shell := STORYBOOK_SHELL.new()
	var pack_root := ProjectSettings.globalize_path("res://../../shared/edition")
	test.expect(shell.prepare_launch(pack_root).get("ok") == true, "the single-route journey prepares")
	test.expect(shell.handle_player_intent("begin"), "the journey begins")
	for _moment: int in 2:
		test.expect(shell.handle_player_action(KEYBOARD_SPACE, true), "Space turns the page")
		shell.handle_player_action(KEYBOARD_SPACE, false)

	test.expect(
		shell.handle_player_action(KEYBOARD_SPACE, true),
		"the final story press launches flight and remains held",
	)
	var before_rise: Dictionary = shell.flight_evidence()
	shell.advance_simulation(1.0 / 60.0)
	var rising: Dictionary = shell.flight_evidence()
	test.expect(
		float(rising.get("altitude_stage_heights", 0.0))
		> float(before_rise.get("altitude_stage_heights", 0.0)),
		"the held story press raises Stella on the next frame",
	)

	shell.advance_journey(0.75)
	var place_entry: Dictionary = shell.presentation_evidence()
	test.expect(
		place_entry.get("journey_phase") == "place-flight"
		and place_entry.get("place") == "rose-garden",
		"the journey's first place begins continuous flight without stopping at a fork",
	)
	var entry_speed := float(shell.flight_evidence().get("vertical_speed_stage_heights_per_second", 0.0))
	shell.advance_simulation(0.2)
	test.expect(
		float(shell.flight_evidence().get("vertical_speed_stage_heights_per_second", 0.0))
		>= entry_speed,
		"the held action stays live when the first place appears",
	)

	test.expect(shell.handle_player_action(KEYBOARD_SPACE, false), "release enters a glide")
	var speed_before_glide := float(
		shell.flight_evidence().get("vertical_speed_stage_heights_per_second", 0.0),
	)
	shell.advance_simulation(0.25)
	test.expect(
		float(shell.flight_evidence().get("vertical_speed_stage_heights_per_second", 0.0))
		< speed_before_glide,
		"release immediately bends Stella downward inside the place",
	)
	test.expect(shell.handle_player_action(POINTER_PRIMARY, true), "pointer hold resumes rise")
	var speed_before_pointer_rise := float(
		shell.flight_evidence().get("vertical_speed_stage_heights_per_second", 0.0),
	)
	shell.advance_simulation(0.25)
	test.expect(
		float(shell.flight_evidence().get("vertical_speed_stage_heights_per_second", 0.0))
		> speed_before_pointer_rise,
		"Space and pointer provide the same continuous Flight Control",
	)

	test.expect(
		not shell.has_method("single_route_evidence"),
		"no separate single-route accessor survives beside the presentation evidence",
	)
	var current_evidence: Dictionary = shell.presentation_evidence()
	var route_evidence: Dictionary = {}
	for key: String in [
		"place",
		"place_name",
		"family_guest",
		"route_duration_seconds",
		"place_progress",
		"safe_limits_preserve_forward_motion",
		"observed_interactions",
		"birthday_star_moment",
		"flight_control_cycles",
		"cloud_rest_automatic_resume",
		"journey_progress_persisted",
	]:
		route_evidence[key] = current_evidence.get(key)
	test.expect(
		route_evidence == {
			"place": "rose-garden",
			"place_name": "Rosalia’s Rose Garden",
			"family_guest": "Mom",
			"route_duration_seconds": 18.0,
			"place_progress": 0.0,
			"safe_limits_preserve_forward_motion": true,
			"observed_interactions": [],
			"birthday_star_moment": "Mom followed the waking roses and drifting petals out of Rosalia’s Rose Garden!",
			"flight_control_cycles": 1,
			"cloud_rest_automatic_resume": true,
			"journey_progress_persisted": false,
		},
		"one presentation evidence dictionary describes the controllable route: %s"
		% JSON.stringify(route_evidence),
	)
	test.expect(
		not place_entry.has("chosen_route")
		and not place_entry.has("path_choices")
		and not place_entry.has("journey_history"),
		"active evidence contains no Path Choice or Journey History state",
	)

	test.expect(shell.handle_player_action(POINTER_PRIMARY, false), "pointer flight releases")
	var touch_press := InputEventScreenTouch.new()
	touch_press.index = 0
	touch_press.pressed = true
	test.expect(
		shell.handle_player_input_event(touch_press),
		"a primary touch begins the same continuous rise",
	)
	var touch_release := InputEventScreenTouch.new()
	touch_release.index = 0
	touch_release.pressed = false
	test.expect(
		shell.handle_player_input_event(touch_release),
		"releasing the primary touch settles Stella",
	)
	test.expect(
		shell.presentation_evidence().get("movement_state") == "glide",
		"actual touch delivery shares the pointer Flight Control state",
	)

	shell.free()
	test.finish(self, "place Flight Control acceptance")
