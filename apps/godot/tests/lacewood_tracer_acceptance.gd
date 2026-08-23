extends SceneTree

const STORYBOOK_SHELL := preload("res://scripts/storybook_shell.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")
const SCENARIO_PATH := "res://../../shared/edition/parity/tracer-bullet.json"
const KEYBOARD_SPACE: StringName = &"keyboard.space"
const POINTER_PRIMARY: StringName = &"pointer.primary"

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	var scenario_value: Variant = JSON.parse_string(FileAccess.get_file_as_string(SCENARIO_PATH))
	test.expect(scenario_value is Dictionary, "the single-route tracer scenario parses")
	if not scenario_value is Dictionary:
		test.finish(self, "Lacewood tracer acceptance")
		return
	var scenario: Dictionary = scenario_value
	var shell := STORYBOOK_SHELL.new()
	var pack_root := ProjectSettings.globalize_path("res://../../shared/edition")
	test.expect(shell.prepare_launch(pack_root).get("ok") == true, "the Lacewood tracer prepares")
	test.expect(shell.handle_player_intent("begin"), "the Lacewood tracer begins")
	for _moment: int in 2:
		shell.handle_player_action(KEYBOARD_SPACE, true)
		shell.handle_player_action(KEYBOARD_SPACE, false)

	shell.handle_player_action(KEYBOARD_SPACE, true)
	_advance_controlled(shell, 0.75)
	_advance_controlled(shell, 3.1)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	_advance_controlled(shell, 3.1)
	for source: StringName in [KEYBOARD_SPACE, POINTER_PRIMARY]:
		shell.handle_player_action(source, true)
		_advance_controlled(shell, 0.1)
		shell.handle_player_action(source, false)
	_advance_controlled(shell, 7.7)
	test.expect(
		shell.presentation_evidence().get("journey_phase") == "cloud-rest",
		"three real low-flight contacts reach Cloud Rest",
	)
	_advance_controlled(shell, 1.25)
	test.expect(
		shell.presentation_evidence().get("journey_phase") == "lacewood-flight",
		"Cloud Rest resumes without another player action",
	)

	shell.handle_player_action(KEYBOARD_SPACE, true)
	_advance_controlled(shell, 9.0)
	test.expect(
		shell.presentation_evidence().get("state") == "birthday_star_moment",
		"the guaranteed Birthday Star reaches its self-paced Storybook Moment",
	)
	test.expect(
		not shell.handle_player_action(KEYBOARD_SPACE, true)
		and shell.presentation_evidence().get("state") == "birthday_star_moment",
		"the held flight action cannot skip the Birthday Star Moment",
	)
	var single_route: Dictionary = shell.single_route_evidence()
	shell.handle_player_action(KEYBOARD_SPACE, false)
	test.expect(
		shell.handle_player_action(KEYBOARD_SPACE, true),
		"a release and deliberate new press carries the journey onward",
	)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	test.expect(
		shell.presentation_evidence().get("place") == "cloister",
		"the completed Lacewood flies on to the next place",
	)
	_fly_cloister(shell)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	test.expect(
		shell.handle_player_action(KEYBOARD_SPACE, true),
		"the last Birthday Star Moment reaches the celebration",
	)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	test.expect(shell.handle_player_action(KEYBOARD_SPACE, true), "the celebration dances again")
	shell.handle_player_action(KEYBOARD_SPACE, false)

	var evidence: Dictionary = shell.presentation_evidence()
	test.expect(
		evidence.get("state") == "celebration"
		and evidence.get("journey_phase") == "celebration"
		and evidence.get("birthday_stars") == [
			"birthday-star.lacewood",
			"birthday-star.cloister",
		]
		and evidence.get("rainbow_paths") == [
			"rainbow-path.lacewood",
			"rainbow-path.cloister",
		]
		and evidence.get("playful_bumps") == 3
		and evidence.get("cloud_rests") == 2
		and evidence.get("flight_control_cycles") == 5,
		"one controllable route per place completes the no-failure story: %s"
		% JSON.stringify(evidence),
	)
	test.expect(
		single_route.get("observed_interactions") == ["silver-ribbons", "rose-lights"]
		and single_route.get("canonical_birthday_star_moment")
		== "Gram followed the silver ribbons and glowing roses through Zélie’s Lacewood!"
		and single_route.get("canonical_celebration_echo")
		== "silver-ribbons-and-rose-lights",
		"the combined Lacewood details produce one canonical story and celebration response",
	)
	test.expect(
		not evidence.has("chosen_route")
		and not evidence.has("path_choices")
		and not evidence.has("journey_history")
		and not evidence.has("shimmer_route"),
		"the completed journey records no Path Choice or Journey History state",
	)
	test.expect(
		shell.sound_event_evidence() == scenario.get("requiredSoundEvents", []),
		"the real single-route journey emits the contract-declared sound sequence\nexpected: %s\nactual: %s"
		% [
			JSON.stringify(scenario.get("requiredSoundEvents", [])),
			JSON.stringify(shell.sound_event_evidence()),
		],
	)

	shell.free()
	test.finish(self, "Lacewood tracer acceptance")


func _fly_cloister(shell: StorybookShell) -> void:
	shell.handle_player_action(KEYBOARD_SPACE, true)
	_advance_controlled(shell, 3.1)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	_advance_controlled(shell, 3.1)
	_advance_controlled(shell, 7.7)
	_advance_controlled(shell, 1.25)
	shell.handle_player_action(KEYBOARD_SPACE, true)
	_advance_controlled(shell, 9.0)


func _advance_controlled(shell: StorybookShell, seconds: float) -> void:
	var frame_count := ceili(seconds * 60.0)
	for _frame: int in frame_count:
		shell.advance_simulation(1.0 / 60.0)
		shell.advance_journey(1.0 / 60.0)
