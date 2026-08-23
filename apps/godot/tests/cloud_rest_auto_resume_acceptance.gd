extends SceneTree

const STORYBOOK_SHELL := preload("res://scripts/storybook_shell.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")
const KEYBOARD_SPACE: StringName = &"keyboard.space"

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	var shell := STORYBOOK_SHELL.new()
	var pack_root := ProjectSettings.globalize_path("res://../../shared/edition")
	test.expect(shell.prepare_launch(pack_root).get("ok") == true, "the Cloud Rest journey prepares")
	shell.handle_player_intent("begin")
	for _moment: int in 2:
		shell.handle_player_action(KEYBOARD_SPACE, true)
		shell.handle_player_action(KEYBOARD_SPACE, false)
	shell.handle_player_action(KEYBOARD_SPACE, true)
	_advance_controlled(shell, 0.75)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	_advance_controlled(shell, 14.1)
	var resting: Dictionary = shell.presentation_evidence()
	var progress_before_resume := float(shell.single_route_evidence().get("progress", 0.0))
	test.expect(
		resting.get("journey_phase") == "cloud-rest"
		and resting.get("cloud_rests") == 1,
		"three nearby Playful Bumps enter one reassuring Cloud Rest",
	)

	_advance_controlled(shell, 1.25)
	var resumed: Dictionary = shell.presentation_evidence()
	test.expect(
		resumed.get("journey_phase") == "lacewood-flight"
		and float(shell.single_route_evidence().get("progress", 0.0)) >= progress_before_resume,
		"Cloud Rest resumes automatically on the same Single Route without an input prompt",
	)
	test.expect(
		resumed.get("birthday_stars") == resting.get("birthday_stars")
		and resumed.get("rainbow_paths") == resting.get("rainbow_paths"),
		"automatic recovery preserves all story progress",
	)

	_advance_controlled(shell, 4.1)
	test.expect(
		shell.presentation_evidence().get("journey_phase") == "birthday-star-approach",
		"the preserved route duration completes after automatic recovery",
	)

	var held_shell := _start_low_lacewood_flight()
	_advance_controlled(held_shell, 13.85)
	held_shell.handle_player_action(KEYBOARD_SPACE, true)
	_advance_controlled(held_shell, 0.3)
	test.expect(
		held_shell.presentation_evidence().get("journey_phase") == "cloud-rest",
		"a low contact can begin Cloud Rest while the control remains held",
	)
	_advance_controlled(held_shell, 1.25)
	test.expect(
		held_shell.presentation_evidence().get("journey_phase") == "lacewood-flight"
		and held_shell.presentation_evidence().get("movement_state") == "rise",
		"a control held through Cloud Rest is live immediately on automatic resume",
	)
	var altitude_on_resume := float(
		held_shell.flight_evidence().get("altitude_stage_heights", 0.0),
	)
	held_shell.advance_simulation(0.25)
	test.expect(
		float(held_shell.flight_evidence().get("altitude_stage_heights", 0.0))
		> altitude_on_resume,
		"the continued hold visibly raises Stella without a release-and-press reset",
	)

	shell.free()
	held_shell.free()
	test.finish(self, "Cloud Rest automatic resume acceptance")


func _start_low_lacewood_flight() -> StorybookShell:
	var shell := STORYBOOK_SHELL.new()
	var pack_root := ProjectSettings.globalize_path("res://../../shared/edition")
	shell.prepare_launch(pack_root)
	shell.handle_player_intent("begin")
	for _moment: int in 2:
		shell.handle_player_action(KEYBOARD_SPACE, true)
		shell.handle_player_action(KEYBOARD_SPACE, false)
	shell.handle_player_action(KEYBOARD_SPACE, true)
	_advance_controlled(shell, 0.75)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	return shell


func _advance_controlled(shell: StorybookShell, seconds: float) -> void:
	var frame_count := ceili(seconds * 60.0)
	for _frame: int in frame_count:
		shell.advance_simulation(1.0 / 60.0)
		shell.advance_journey(1.0 / 60.0)
