extends SceneTree

const STORYBOOK_SHELL := preload("res://scripts/storybook_shell.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")
const KEYBOARD_SPACE: StringName = &"keyboard.space"

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	var responsive_shell := _start_lacewood_flight()
	_advance_controlled(responsive_shell, 3.1)
	test.expect(
		responsive_shell.presentation_evidence().get("observed_interactions")
		== ["silver-ribbons"],
		"flying high awakens the silver ribbons",
	)
	responsive_shell.handle_player_action(KEYBOARD_SPACE, false)
	_advance_controlled(responsive_shell, 3.1)
	test.expect(
		responsive_shell.presentation_evidence().get("observed_interactions")
		== ["silver-ribbons", "rose-lights"],
		"settling low awakens the rose lights on the same route",
	)
	_advance_controlled(responsive_shell, 8.0)
	test.expect(
		responsive_shell.presentation_evidence().get("playful_bumps") == 3
		and responsive_shell.presentation_evidence().get("journey_phase") == "cloud-rest",
		"remaining near the low lacework meets three gentle Playful Bumps",
	)

	var avoiding_shell := _start_lacewood_flight()
	_advance_controlled(avoiding_shell, 14.0)
	test.expect(
		avoiding_shell.presentation_evidence().get("playful_bumps") == 0,
		"guiding Stella high avoids the low lacework bumps without changing her route",
	)

	responsive_shell.free()
	avoiding_shell.free()
	test.finish(self, "Lacewood interaction acceptance")


func _start_lacewood_flight() -> StorybookShell:
	var shell := STORYBOOK_SHELL.new()
	var pack_root := ProjectSettings.globalize_path("res://../../shared/edition")
	test.expect(shell.prepare_launch(pack_root).get("ok") == true, "the interaction journey prepares")
	test.expect(shell.handle_player_intent("begin"), "the interaction journey begins")
	for _moment: int in 2:
		shell.handle_player_action(KEYBOARD_SPACE, true)
		shell.handle_player_action(KEYBOARD_SPACE, false)
	shell.handle_player_action(KEYBOARD_SPACE, true)
	_advance_controlled(shell, 0.75)
	return shell


func _advance_controlled(shell: StorybookShell, seconds: float) -> void:
	var frame_count := ceili(seconds * 60.0)
	for _frame: int in frame_count:
		shell.advance_simulation(1.0 / 60.0)
		shell.advance_journey(1.0 / 60.0)
