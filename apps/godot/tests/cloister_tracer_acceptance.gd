extends SceneTree

const STORYBOOK_SHELL := preload("res://scripts/storybook_shell.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")
const SCENARIO_PATH := "res://../../shared/edition/parity/cloister-single-route.json"
const KEYBOARD_SPACE: StringName = &"keyboard.space"

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	var scenario_value: Variant = JSON.parse_string(FileAccess.get_file_as_string(SCENARIO_PATH))
	test.expect(scenario_value is Dictionary, "the Cloister single-route scenario parses")
	var scenario: Dictionary = scenario_value if scenario_value is Dictionary else {}
	var shell := STORYBOOK_SHELL.new()
	var pack_root := ProjectSettings.globalize_path("res://../../shared/edition")
	test.expect(
		shell.prepare_launch(pack_root).get("ok") == true,
		"the Cloister of Clouds tracer prepares offline",
	)
	_fly_lacewood(shell)
	test.expect(
		shell.presentation_evidence().get("state") == "birthday_star_moment"
		and shell.presentation_evidence().get("place") == "lacewood",
		"the Lacewood reaches Gram's Birthday Star Moment first",
	)

	var cloister_event_start := shell.sound_event_evidence().size()
	shell.handle_player_action(KEYBOARD_SPACE, false)
	test.expect(
		shell.handle_player_action(KEYBOARD_SPACE, true),
		"a deliberate press carries the journey onward from Gram's Moment",
	)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	var entry: Dictionary = shell.presentation_evidence()
	test.expect(
		entry.get("state") == "active_play"
		and entry.get("place") == "cloister"
		and entry.get("journey_phase") == "cloister-flight"
		and entry.get("playful_bumps") == 0,
		"the Lacewood hands the flight onward to the Cloister of Clouds: %s"
		% JSON.stringify(entry),
	)
	test.expect(
		shell.single_route_evidence().get("single_route") == "single-route.cloister"
		and shell.single_route_evidence().get("observed_interactions") == [],
		"the Cloister flies its own single route with no interaction met yet",
	)

	_fly_cloister(shell)
	var moment: Dictionary = shell.presentation_evidence()
	test.expect(
		moment.get("state") == "birthday_star_moment"
		and moment.get("place") == "cloister"
		and moment.get("playful_bumps") == 3
		and moment.get("cloud_rests") == 2
		and moment.get("birthday_stars") == [
			"birthday-star.lacewood",
			"birthday-star.cloister",
		]
		and moment.get("rainbow_paths") == [
			"rainbow-path.lacewood",
			"rainbow-path.cloister",
		],
		"the Cloister reaches Beasley's Birthday Star Moment through its own Cloud Rest: %s"
		% JSON.stringify(moment),
	)
	var cloister_route: Dictionary = shell.single_route_evidence()
	test.expect(
		cloister_route.get("observed_interactions") == ["sunlit-arches", "soft-clouds"]
		and cloister_route.get("canonical_birthday_star_moment")
		== "Beasley padded along the sunlit arches and pounced through the soft clouds of the Cloister of Clouds!"
		and cloister_route.get("canonical_celebration_echo") == "sunlit-arches-and-soft-clouds",
		"both Cloister altitude interactions produce one canonical Beasley story",
	)
	test.expect(
		shell.sound_event_evidence().slice(cloister_event_start)
		== scenario.get("requiredSoundEvents", []),
		"the Cloister emits the contract-declared sound sequence\nexpected: %s\nactual: %s"
		% [
			JSON.stringify(scenario.get("requiredSoundEvents", [])),
			JSON.stringify(shell.sound_event_evidence().slice(cloister_event_start)),
		],
	)

	shell.handle_player_action(KEYBOARD_SPACE, false)
	test.expect(
		shell.handle_player_action(KEYBOARD_SPACE, true),
		"Beasley's Birthday Star Moment continues to the celebration",
	)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	test.expect(
		shell.presentation_evidence().get("state") == "celebration"
		and shell.sound_event_evidence().back() == {
			"event": "sound-event.birthday-castle-arrival",
			"context": {},
		},
		"the last place exits into the Birthday Castle arrival",
	)

	shell.free()
	test.finish(self, "Cloister of Clouds tracer acceptance")


func _fly_lacewood(shell: StorybookShell) -> void:
	shell.handle_player_intent("begin")
	for _moment: int in 2:
		shell.handle_player_action(KEYBOARD_SPACE, true)
		shell.handle_player_action(KEYBOARD_SPACE, false)
	shell.handle_player_action(KEYBOARD_SPACE, true)
	_advance_controlled(shell, 0.75)
	_advance_controlled(shell, 3.1)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	_advance_controlled(shell, 3.1)
	_advance_controlled(shell, 7.7)
	_advance_controlled(shell, 1.25)
	shell.handle_player_action(KEYBOARD_SPACE, true)
	_advance_controlled(shell, 9.0)


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
