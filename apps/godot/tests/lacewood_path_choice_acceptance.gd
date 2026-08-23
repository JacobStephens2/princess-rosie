extends SceneTree

const STORYBOOK_SHELL := preload("res://scripts/storybook_shell.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")
const KEYBOARD_SPACE: StringName = &"keyboard.space"
const POINTER_PRIMARY: StringName = &"pointer.primary"

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	var canopy := _choose_route(KEYBOARD_SPACE, true)
	var floor := _choose_route(POINTER_PRIMARY, false)
	_route_waits_for_direct_pointer_choice()
	_space_gesture_requires_deliberate_input()
	_route_duration_follows_tuning()

	test.expect(
		canopy == {
			"path_choice": "path-choice.lacewood",
			"available_routes": ["lacewood.canopy", "lacewood.floor"],
			"chosen_route": "lacewood.canopy",
			"interaction": "silver-ribbon-canopy",
			"visual_response": "silver-ribbons-unfurl",
			"routes_equally_safe": true,
			"route_duration_seconds": 6.0,
			"route_progress": 0.0,
			"rejoin_before_birthday_star": true,
			"correctness_signals": 0,
		},
		"holding the shared flight action chooses the equally safe silver-ribbon canopy",
	)
	test.expect(
		floor == {
			"path_choice": "path-choice.lacewood",
			"available_routes": ["lacewood.canopy", "lacewood.floor"],
			"chosen_route": "lacewood.floor",
			"interaction": "rose-lit-floor",
			"visual_response": "rose-lights-bloom",
			"routes_equally_safe": true,
			"route_duration_seconds": 6.0,
			"route_progress": 0.0,
			"rejoin_before_birthday_star": true,
			"correctness_signals": 0,
		},
		"releasing the same flight action chooses an equally rich rose-lit woodland floor",
	)
	test.finish(self, "Lacewood Path Choice acceptance")


func _route_waits_for_direct_pointer_choice() -> void:
	var shell := STORYBOOK_SHELL.new()
	var pack_root := ProjectSettings.globalize_path("res://../../shared/edition")
	test.expect(shell.prepare_launch(pack_root).get("ok") == true, "the direct choice prepares")
	test.expect(shell.handle_player_intent("begin"), "the direct-choice journey begins")
	for _moment: int in 3:
		shell.handle_player_action(KEYBOARD_SPACE, true)
		shell.handle_player_action(KEYBOARD_SPACE, false)
	shell.advance_journey(0.75)
	shell.advance_journey(5.0)
	test.expect(
		shell.path_choice_evidence().get("chosen_route") == "",
		"Lacewood waits without choosing a route until the player acts on a path",
	)
	var chose_floor: bool = (
		shell.handle_route_choice_intent("lacewood.floor", POINTER_PRIMARY)
		if shell.has_method("handle_route_choice_intent")
		else false
	)
	test.expect(
		chose_floor
		and shell.path_choice_evidence().get("chosen_route") == "lacewood.floor"
		and shell.presentation_evidence().get("observed_action_sources", []).has(
			"pointer.primary",
		),
		"a fresh pointer intent on the woodland floor chooses that route directly",
	)
	shell.free()


func _space_gesture_requires_deliberate_input() -> void:
	var floor_shell := _start_path_choice()
	floor_shell.handle_player_action(KEYBOARD_SPACE, true)
	floor_shell.advance_journey(0.05)
	floor_shell.handle_player_action(KEYBOARD_SPACE, false)
	test.expect(
		floor_shell.path_choice_evidence().get("chosen_route") == "",
		"a 50 ms accidental Space tap cannot commit either Lacewood route",
	)
	floor_shell.handle_player_action(KEYBOARD_SPACE, true)
	floor_shell.advance_journey(0.25)
	floor_shell.handle_player_action(KEYBOARD_SPACE, false)
	test.expect(
		floor_shell.path_choice_evidence().get("chosen_route") == "lacewood.floor",
		"a deliberate short Space gesture chooses the rose-lit woodland floor",
	)
	floor_shell.free()

	var canopy_shell := _start_path_choice(true)
	canopy_shell.advance_journey(1.0)
	test.expect(
		canopy_shell.path_choice_evidence().get("chosen_route") == "",
		"an action held before Lacewood appears cannot pre-arm the canopy",
	)
	canopy_shell.handle_player_action(KEYBOARD_SPACE, false)
	canopy_shell.handle_player_action(KEYBOARD_SPACE, true)
	canopy_shell.advance_journey(0.6)
	test.expect(
		canopy_shell.path_choice_evidence().get("chosen_route") == "lacewood.canopy",
		"a fresh sustained Space hold chooses the silver-ribbon canopy",
	)
	canopy_shell.free()


func _start_path_choice(preheld: bool = false) -> StorybookShell:
	var shell := STORYBOOK_SHELL.new()
	var pack_root := ProjectSettings.globalize_path("res://../../shared/edition")
	test.expect(shell.prepare_launch(pack_root).get("ok") == true, "the gesture choice prepares")
	test.expect(shell.handle_player_intent("begin"), "the gesture-choice journey begins")
	for _moment: int in 3:
		shell.handle_player_action(KEYBOARD_SPACE, true)
		shell.handle_player_action(KEYBOARD_SPACE, false)
	if preheld:
		shell.handle_player_action(KEYBOARD_SPACE, true)
	shell.advance_journey(0.75)
	return shell


func _route_duration_follows_tuning() -> void:
	var shell := STORYBOOK_SHELL.new()
	var pack_root := ProjectSettings.globalize_path("res://../../shared/edition")
	test.expect(shell.prepare_launch(pack_root).get("ok") == true, "the tuned route prepares")
	shell._path_choice_tuning["routeDurationSeconds"] = 2.4
	test.expect(shell.handle_player_intent("begin"), "the tuned journey begins")
	for _moment: int in 3:
		shell.handle_player_action(KEYBOARD_SPACE, true)
		shell.handle_player_action(KEYBOARD_SPACE, false)
	shell.handle_player_action(KEYBOARD_SPACE, true)
	shell.advance_journey(0.75)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	test.expect(
		shell.handle_route_choice_intent("lacewood.canopy", POINTER_PRIMARY),
		"the tuned route starts through a direct path intent",
	)
	shell.advance_journey(1.8)
	test.expect(
		shell.presentation_evidence().get("journey_phase") == "lacewood-route",
		"runtime route progress does not outrun the Edition Pack duration",
	)
	shell.advance_journey(0.6)
	test.expect(
		shell.presentation_evidence().get("journey_phase") == "cloud-rest"
		and shell.path_choice_evidence().get("route_duration_seconds") == 2.4,
		"runtime completion and semantic evidence share the Edition Pack duration",
	)
	shell.free()


func _choose_route(source: StringName, choose_canopy: bool) -> Dictionary:
	var shell := STORYBOOK_SHELL.new()
	var pack_root := ProjectSettings.globalize_path("res://../../shared/edition")
	test.expect(shell.prepare_launch(pack_root).get("ok") == true, "the Path Choice journey prepares")
	test.expect(shell.handle_player_intent("begin"), "the cover begins through its public intent")
	for _moment: int in 3:
		test.expect(shell.handle_player_action(source, true), "the shared action advances the story")
		shell.handle_player_action(source, false)

	test.expect(shell.handle_player_action(source, true), "the shared action flies into Lacewood")
	shell.advance_journey(0.75)
	test.expect(shell.handle_player_action(source, false), "the flight action neutralizes at the fork")
	var route_id := "lacewood.canopy" if choose_canopy else "lacewood.floor"
	test.expect(
		shell.handle_route_choice_intent(route_id, POINTER_PRIMARY),
		"the player acts directly on the chosen Lacewood route",
	)

	var evidence: Dictionary = (
		shell.path_choice_evidence()
		if shell.has_method("path_choice_evidence")
		else {}
	)
	shell.free()
	return evidence
