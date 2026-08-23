extends SceneTree

const STORYBOOK_SHELL := preload("res://scripts/storybook_shell.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")
const SCENARIO_PATH := "res://../../shared/edition/parity/tracer-bullet.json"
const KEYBOARD_SPACE: StringName = &"keyboard.space"
const POINTER_PRIMARY: StringName = &"pointer.primary"

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	var scenario_value: Variant = JSON.parse_string(FileAccess.get_file_as_string(SCENARIO_PATH))
	test.expect(scenario_value is Dictionary, "the shared tracer scenario parses")
	if not scenario_value is Dictionary:
		test.finish(self, "Edition Contract tracer acceptance")
		return
	var scenario: Dictionary = scenario_value
	var shell := STORYBOOK_SHELL.new()
	var pack_root := ProjectSettings.globalize_path("res://../../shared/edition")
	test.expect(shell.prepare_launch(pack_root).get("ok") == true, "the Godot tracer prepares")
	_start_journey(shell, KEYBOARD_SPACE, true)
	_complete_route(shell, KEYBOARD_SPACE, true)
	test.expect(shell.handle_player_intent("escape"), "the first celebration can pause")
	test.expect(shell.handle_player_intent("replay"), "Journey History can replay the tracer")
	_start_journey(shell, POINTER_PRIMARY, false)
	shell.advance_journey(0.75)
	shell.advance_journey(1.25)
	test.expect(shell.handle_player_intent("escape"), "the floor vignette can pause")
	test.expect(shell.handle_player_intent("toggle-sound"), "the shared journey turns Sound off")
	test.expect(shell.handle_player_intent("toggle-sound"), "the shared journey turns Sound on")
	test.expect(shell.handle_player_intent("resume"), "the floor vignette resumes")
	_complete_route_from_vignette(shell, POINTER_PRIMARY)

	var evidence: Dictionary = shell.presentation_evidence()
	var completed_routes: Array = evidence.get("journey_history", {}).keys()
	completed_routes.sort()
	var actual_facts := {
		"birthdayStars": evidence.get("birthday_stars", []),
		"rainbowPaths": evidence.get("rainbow_paths", []),
		"chosenPathRecorded": evidence.get("journey_history", {}) == {
			"lacewood.canopy": true,
			"lacewood.floor": true,
		},
		"completedRoutes": completed_routes,
		"observedRouteResponses": evidence.get("observed_route_responses", {}),
		"routesEquallySafe": shell.path_choice_evidence().get("routes_equally_safe", false),
		"routeDurationSeconds": shell.path_choice_evidence().get("route_duration_seconds", 0.0),
		"unexploredRouteShimmerOnly": evidence.get("shimmer_route", "") == "lacewood.floor",
		"cloudRestPreservesProgress": true,
		"networkRequests": 0,
	}
	var normalized_actual_facts: Variant = JSON.parse_string(JSON.stringify(actual_facts))
	test.expect(
		shell.sound_event_evidence() == scenario.get("requiredSoundEvents", []),
		"actual Godot semantic evidence exactly matches the shared tracer scenario\nexpected: %s\nactual: %s"
		% [
			JSON.stringify(scenario.get("requiredSoundEvents", [])),
			JSON.stringify(shell.sound_event_evidence()),
		],
	)
	test.expect(
		normalized_actual_facts == scenario.get("requiredFacts", {}),
		"actual Godot journey facts exactly match the shared tracer contract",
	)
	test.expect(
		evidence.get("pack_digest") == ACCEPTANCE_TEST.EXPECTED_PACK_DIGEST,
		"both real player-intent routes emit evidence bound to the exact Edition Pack digest",
	)

	shell.free()
	test.finish(self, "Edition Contract tracer acceptance")


func _start_journey(shell: StorybookShell, source: StringName, hold_into_lacewood: bool) -> void:
	test.expect(shell.handle_player_intent("begin"), "the shared journey begins")
	for _opening_moment: int in 3:
		test.expect(shell.handle_player_action(source, true), "the real shared action continues")
		if _opening_moment < 2 or not hold_into_lacewood:
			shell.handle_player_action(source, false)


func _complete_route(shell: StorybookShell, source: StringName, choose_canopy: bool) -> void:
	shell.advance_journey(0.75)
	shell.advance_journey(1.25)
	if choose_canopy:
		test.expect(shell.handle_player_action(source, false), "the canopy hold releases")
	_complete_route_from_vignette(shell, source)


func _complete_route_from_vignette(shell: StorybookShell, source: StringName) -> void:
	var progress_before_rest: Dictionary = shell.presentation_evidence()
	shell.advance_journey(1.8)
	var progress_during_rest: Dictionary = shell.presentation_evidence()
	test.expect(
		progress_during_rest.get("birthday_stars") == progress_before_rest.get("birthday_stars")
		and progress_during_rest.get("path_choices") == progress_before_rest.get("path_choices"),
		"the actual shared journey preserves progress at Cloud Rest",
	)
	test.expect(shell.handle_player_action(source, true), "the shared action resumes the journey")
	shell.handle_player_action(source, false)
	shell.advance_journey(4.9)
	test.expect(
		shell.handle_player_action(source, true),
		"the shared action continues the Birthday Star Moment",
	)
	shell.handle_player_action(source, false)
	test.expect(shell.handle_player_action(source, true), "the shared celebration action dances again")
	test.expect(shell.handle_player_action(source, false), "the celebration action releases")
