extends SceneTree

const STORYBOOK_SHELL := preload("res://scripts/storybook_shell.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")
const DRIVER := preload("res://tests/place_journey_driver.gd")
const KEYBOARD_SPACE: StringName = &"keyboard.space"

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	var shell := STORYBOOK_SHELL.new()
	var pack_root := ProjectSettings.globalize_path("res://../../shared/edition")
	test.expect(shell.prepare_launch(pack_root).get("ok") == true, "the Cloud Rest journey prepares")
	DRIVER.launch(shell)
	_advance_controlled(shell, 0.75)
	DRIVER.cross_into_next_place(shell)
	_advance_controlled(shell, 10.2)
	var resting: Dictionary = shell.presentation_evidence()
	var progress_before_resume := float(resting.get("place_progress", 0.0))
	test.expect(
		resting.get("journey_phase") == "cloud-rest"
		and resting.get("cloud_rests") == 1,
		"three nearby Playful Bumps enter one reassuring Cloud Rest",
	)

	_advance_controlled(shell, 1.25)
	var resumed: Dictionary = shell.presentation_evidence()
	test.expect(
		resumed.get("journey_phase") == "place-flight"
		and float(resumed.get("place_progress", 0.0)) >= progress_before_resume,
		"Cloud Rest resumes automatically on the same place's route without an input prompt",
	)
	test.expect(
		resumed.get("birthday_stars") == resting.get("birthday_stars")
		and resumed.get("rainbow_paths") == resting.get("rainbow_paths"),
		"automatic recovery preserves all story progress",
	)

	shell.handle_player_action(KEYBOARD_SPACE, true)
	_advance_controlled(shell, 4.6)
	test.expect(
		shell.presentation_evidence().get("journey_phase") == "birthday-star-approach",
		"the preserved route completes after automatic recovery, at a gentler pace",
	)

	var held_shell := _start_low_bumpable_flight()
	_advance_controlled(held_shell, 10.0)
	held_shell.handle_player_action(KEYBOARD_SPACE, true)
	_advance_controlled(held_shell, 0.3)
	test.expect(
		held_shell.presentation_evidence().get("journey_phase") == "cloud-rest",
		"a low contact can begin Cloud Rest while the control remains held",
	)
	_advance_controlled(held_shell, 1.25)
	test.expect(
		held_shell.presentation_evidence().get("journey_phase") == "place-flight"
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


# Cloud Rest happens in a place whose Playful Bump is switched on, so the journey flies
# the bump-free first place and turns the page into the second one.
func _start_low_bumpable_flight() -> StorybookShell:
	var shell := STORYBOOK_SHELL.new()
	var pack_root := ProjectSettings.globalize_path("res://../../shared/edition")
	shell.prepare_launch(pack_root)
	DRIVER.launch(shell)
	_advance_controlled(shell, 0.75)
	DRIVER.cross_into_next_place(shell)
	return shell


func _advance_controlled(shell: StorybookShell, seconds: float) -> void:
	var frame_count := ceili(seconds * 60.0)
	for _frame: int in frame_count:
		shell.advance_simulation(1.0 / 60.0)
		shell.advance_journey(1.0 / 60.0)
