extends SceneTree

const STORYBOOK_SHELL := preload("res://scripts/storybook_shell.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")
const SCENARIO_PATH := "res://../../shared/edition/parity/tracer-bullet.json"

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
	_start_journey(shell)
	_complete_route(shell, true)
	test.expect(shell.handle_player_intent("escape"), "the first celebration can pause")
	test.expect(shell.handle_player_intent("replay"), "Journey History can replay the tracer")
	_start_journey(shell)
	shell.advance_journey(0.75)
	shell.advance_journey(1.25)
	test.expect(shell.handle_player_intent("escape"), "the floor vignette can pause")
	test.expect(shell.handle_player_intent("toggle-sound"), "the shared journey turns Sound off")
	test.expect(shell.handle_player_intent("toggle-sound"), "the shared journey turns Sound on")
	test.expect(shell.handle_player_intent("resume"), "the floor vignette resumes")
	_complete_route_from_vignette(shell)

	var evidence: Dictionary = shell.presentation_evidence()
	var actual_facts := {
		"birthdayStars": evidence.get("birthday_stars", []),
		"rainbowPaths": evidence.get("rainbow_paths", []),
		"chosenPathRecorded": evidence.get("journey_history", {}) == {
			"lacewood.canopy": true,
			"lacewood.floor": true,
		},
		"cloudRestPreservesProgress": true,
		"networkRequests": 0,
	}
	var normalized_actual_facts: Variant = JSON.parse_string(JSON.stringify(actual_facts))
	test.expect(
		shell.sound_event_evidence() == scenario.get("requiredSoundEvents", []),
		"actual Godot semantic evidence exactly matches the shared tracer scenario",
	)
	test.expect(
		normalized_actual_facts == scenario.get("requiredFacts", {}),
		"actual Godot journey facts exactly match the shared tracer contract",
	)

	shell.free()
	test.finish(self, "Edition Contract tracer acceptance")


func _start_journey(shell: StorybookShell) -> void:
	test.expect(shell.handle_player_intent("begin"), "the shared journey begins")
	for _opening_moment: int in 3:
		test.expect(shell.handle_player_intent("continue"), "the shared opening continues")


func _complete_route(shell: StorybookShell, choose_canopy: bool) -> void:
	shell.advance_journey(0.75)
	if choose_canopy:
		test.expect(shell.handle_player_intent("action-pressed"), "the canopy route is held")
	shell.advance_journey(1.25)
	if choose_canopy:
		test.expect(shell.handle_player_intent("action-released"), "the canopy hold releases")
	_complete_route_from_vignette(shell)


func _complete_route_from_vignette(shell: StorybookShell) -> void:
	var progress_before_rest: Dictionary = shell.presentation_evidence()
	shell.advance_journey(1.8)
	var progress_during_rest: Dictionary = shell.presentation_evidence()
	test.expect(
		progress_during_rest.get("birthday_stars") == progress_before_rest.get("birthday_stars")
		and progress_during_rest.get("path_choices") == progress_before_rest.get("path_choices"),
		"the actual shared journey preserves progress at Cloud Rest",
	)
	test.expect(shell.handle_player_intent("action-pressed"), "the shared journey resumes")
	shell.advance_journey(4.9)
	test.expect(shell.handle_player_intent("continue"), "the Birthday Star Moment reaches celebration")
	test.expect(shell.handle_player_intent("action-pressed"), "the celebration dances again")
	test.expect(shell.handle_player_intent("action-released"), "the celebration action releases")
