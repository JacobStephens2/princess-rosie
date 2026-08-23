extends SceneTree

const STORYBOOK_SHELL := preload("res://scripts/storybook_shell.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	var sixty_hz := _launched_shell()
	var one_twenty_hz := _launched_shell()
	if sixty_hz == null or one_twenty_hz == null:
		test.finish(self, "flight motion acceptance")
		return

	var initial: Dictionary = sixty_hz.presentation_evidence().get("flight", {})
	test.expect(initial.get("automatic_forward_motion") == true, "Stella moves forward automatically")
	test.expect(is_equal_approx(initial.get("distance_stage_widths", -1.0), 0.0), "flight starts at the journey origin")

	test.expect(sixty_hz.handle_player_intent("action-pressed"), "holding the action begins rise")
	test.expect(one_twenty_hz.handle_player_intent("action-pressed"), "the comparison flight begins rise")
	var altitude_before: float = initial.get("altitude_stage_heights", 0.0)
	test.expect(sixty_hz.advance_simulation(1.0 / 60.0), "active flight advances on the next simulation frame")
	var immediate: Dictionary = sixty_hz.presentation_evidence().get("flight", {})
	test.expect(
		immediate.get("vertical_speed_stage_heights_per_second", 0.0) > 0.0,
		"holding produces upward speed on the next frame",
	)
	test.expect(
		immediate.get("altitude_stage_heights", 0.0) > altitude_before,
		"holding immediately raises Stella",
	)

	for _frame: int in 14:
		sixty_hz.advance_simulation(1.0 / 60.0)
	for _frame: int in 30:
		one_twenty_hz.advance_simulation(1.0 / 120.0)
	var at_sixty: Dictionary = sixty_hz.presentation_evidence().get("flight", {})
	var at_one_twenty: Dictionary = one_twenty_hz.presentation_evidence().get("flight", {})
	test.expect(
		is_equal_approx(
			at_sixty.get("distance_stage_widths", -1.0),
			at_one_twenty.get("distance_stage_widths", -2.0),
		),
		"automatic forward motion is frame-rate independent",
	)
	test.expect(
		absf(
			at_sixty.get("altitude_stage_heights", -1.0)
			- at_one_twenty.get("altitude_stage_heights", -2.0)
		) < 0.0001,
		"rise reaches the same altitude at 60 and 120 Hz",
	)
	test.expect(
		absf(
			at_sixty.get("vertical_speed_stage_heights_per_second", -1.0)
			- at_one_twenty.get("vertical_speed_stage_heights_per_second", -2.0)
		) < 0.0001,
		"rise reaches the same speed at 60 and 120 Hz",
	)

	var rising_speed: float = at_sixty.get("vertical_speed_stage_heights_per_second", 0.0)
	test.expect(sixty_hz.handle_player_intent("action-released"), "releasing enters glide")
	sixty_hz.advance_simulation(0.25)
	var gliding: Dictionary = sixty_hz.presentation_evidence().get("flight", {})
	test.expect(
		gliding.get("vertical_speed_stage_heights_per_second", rising_speed) < rising_speed,
		"release immediately bends the buoyant arc into a glide",
	)
	test.expect(
		gliding.get("distance_stage_widths", 0.0) > at_sixty.get("distance_stage_widths", 0.0),
		"gliding never stops automatic forward travel",
	)

	sixty_hz.handle_player_intent("action-pressed")
	for _frame: int in 600:
		sixty_hz.advance_simulation(1.0 / 120.0)
	var ceiling: Dictionary = sixty_hz.presentation_evidence().get("flight", {})
	test.expect(
		ceiling.get("altitude_stage_heights", 2.0) <= ceiling.get("maximum_altitude_stage_heights", 1.0),
		"rise remains inside the authored flight corridor",
	)
	sixty_hz.handle_player_intent("action-released")
	for _frame: int in 1200:
		sixty_hz.advance_simulation(1.0 / 120.0)
	var floor_evidence: Dictionary = sixty_hz.presentation_evidence().get("flight", {})
	test.expect(
		floor_evidence.get("altitude_stage_heights", -1.0)
		>= floor_evidence.get("minimum_altitude_stage_heights", 0.0),
		"glide remains inside the authored flight corridor",
	)

	sixty_hz.free()
	one_twenty_hz.free()
	test.finish(self, "flight motion acceptance")


func _launched_shell() -> StorybookShell:
	var shell := STORYBOOK_SHELL.new()
	var pack_root := ProjectSettings.globalize_path("res://../../shared/edition")
	if shell.prepare_launch(pack_root).get("ok") != true:
		test.expect(false, "the flight shell prepares")
		shell.free()
		return null
	shell.handle_player_intent("begin")
	for _moment: int in 3:
		shell.handle_player_intent("continue")
	test.expect(shell.presentation_evidence().get("state") == "active_play", "the complete opening launches flight")
	return shell
