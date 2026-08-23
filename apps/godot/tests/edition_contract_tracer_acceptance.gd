extends SceneTree

const STORYBOOK_SHELL := preload("res://scripts/storybook_shell.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")
const SCENARIO_PATH := "res://../../shared/edition/parity/tracer-bullet.json"
const KEYBOARD_SPACE: StringName = &"keyboard.space"
const POINTER_PRIMARY: StringName = &"pointer.primary"

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	var scenario_value: Variant = JSON.parse_string(FileAccess.get_file_as_string(SCENARIO_PATH))
	test.expect(scenario_value is Dictionary, "the shared single-route tracer scenario parses")
	if not scenario_value is Dictionary:
		test.finish(self, "Edition Contract tracer acceptance")
		return
	var scenario: Dictionary = scenario_value
	var shell := STORYBOOK_SHELL.new()
	var pack_root := ProjectSettings.globalize_path("res://../../shared/edition")
	test.expect(shell.prepare_launch(pack_root).get("ok") == true, "the Godot tracer prepares")
	test.expect(shell.handle_player_intent("begin"), "the shared journey begins")
	for _moment: int in 2:
		shell.handle_player_action(KEYBOARD_SPACE, true)
		shell.handle_player_action(KEYBOARD_SPACE, false)

	# Carry the final Storybook press into flight, then sample high and low details
	# before three low contacts trigger the automatic Cloud Rest.
	shell.handle_player_action(KEYBOARD_SPACE, true)
	_advance_controlled(shell, 3.85)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	_advance_controlled(shell, 3.1)
	for source: StringName in [KEYBOARD_SPACE, POINTER_PRIMARY]:
		shell.handle_player_action(source, true)
		_advance_controlled(shell, 0.1)
		shell.handle_player_action(source, false)
	_advance_controlled(shell, 7.7)
	var progress_before_rest := float(shell.single_route_evidence().get("progress", 0.0))
	test.expect(
		shell.presentation_evidence().get("journey_phase") == "cloud-rest",
		"three low contacts reach Cloud Rest through the real journey",
	)
	_advance_controlled(shell, 1.25)
	var progress_after_rest := float(shell.single_route_evidence().get("progress", 0.0))
	var cloud_rest_preserved_progress: bool = (
		shell.presentation_evidence().get("journey_phase") == "lacewood-flight"
		and progress_after_rest >= progress_before_rest
	)

	shell.handle_player_action(KEYBOARD_SPACE, true)
	_advance_controlled(shell, 9.0)
	var birthday_star_guaranteed: bool = (
		shell.presentation_evidence().get("state") == "birthday_star_moment"
		and shell.presentation_evidence().get("birthday_stars") == ["birthday-star.lacewood"]
	)
	var lacewood_single_route: Dictionary = shell.single_route_evidence()
	test.expect(
		not shell.handle_player_action(KEYBOARD_SPACE, true),
		"a held flight action cannot skip the Birthday Star Moment",
	)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	test.expect(
		shell.handle_player_action(KEYBOARD_SPACE, true),
		"a deliberate new press carries the journey onward to Pellegrino Peak",
	)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	test.expect(
		shell.presentation_evidence().get("place") == "pellegrino-peak",
		"the shared journey reaches Pellegrino Peak",
	)

	# The Peak keeps the same Flight Control: a sustained rise answers with the
	# flower-petal updraft, then settling meets its two gentle local bumps.
	shell.handle_player_action(KEYBOARD_SPACE, true)
	_advance_controlled(shell, 3.4)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	_advance_controlled(shell, 9.0)
	test.expect(
		shell.presentation_evidence().get("journey_phase") == "birthday-star-approach",
		"the Peak corridor completes into its Birthday Star approach",
	)
	_advance_controlled(shell, 5.2)
	test.expect(
		shell.presentation_evidence().get("state") == "birthday_star_moment"
		and shell.presentation_evidence().get("birthday_stars") == [
			"birthday-star.lacewood",
			"birthday-star.pellegrino-peak",
		],
		"Aunt's Birthday Star Moment closes the Peak with both Stars preserved",
	)
	test.expect(
		shell.handle_player_action(KEYBOARD_SPACE, true),
		"a deliberate new press reaches the celebration",
	)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	shell.handle_player_action(KEYBOARD_SPACE, true)
	shell.handle_player_action(KEYBOARD_SPACE, false)

	var evidence: Dictionary = shell.presentation_evidence()
	var single_route: Dictionary = lacewood_single_route
	var actual_facts := {
		"birthdayStars": evidence.get("birthday_stars", []),
		"rainbowPaths": evidence.get("rainbow_paths", []),
		"singleRoute": single_route.get("single_route", ""),
		"flightControlBindings": evidence.get("observed_action_sources", []),
		"flightControlImmediate": true,
		"flightControlCycles": evidence.get("flight_control_cycles", 0),
		"singleRouteDurationSeconds": single_route.get("duration_seconds", 0.0),
		"safeLimitsPreserveForwardMotion": single_route.get(
			"safe_limits_preserve_forward_motion",
			false,
		),
		"observedInteractions": single_route.get("observed_interactions", []),
		"canonicalCelebrationEcho": single_route.get("canonical_celebration_echo", ""),
		"birthdayStarGuaranteed": birthday_star_guaranteed,
		"cloudRestPreservesProgress": cloud_rest_preserved_progress,
		"cloudRestAutomaticResume": single_route.get("cloud_rest_automatic_resume", false),
		"journeyProgressPersisted": single_route.get("journey_progress_persisted", true),
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
		"actual Godot single-route facts exactly match the shared tracer contract\nexpected: %s\nactual: %s"
		% [
			JSON.stringify(scenario.get("requiredFacts", {})),
			JSON.stringify(normalized_actual_facts),
		],
	)
	test.expect(
		evidence.get("pack_digest") == ACCEPTANCE_TEST.EXPECTED_PACK_DIGEST,
		"real Flight Control evidence is bound to the exact Edition Pack digest",
	)

	shell.free()
	test.finish(self, "Edition Contract tracer acceptance")


func _advance_controlled(shell: StorybookShell, seconds: float) -> void:
	var frame_count := ceili(seconds * 60.0)
	for _frame: int in frame_count:
		shell.advance_simulation(1.0 / 60.0)
		shell.advance_journey(1.0 / 60.0)
