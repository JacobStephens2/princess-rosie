extends SceneTree

const STORYBOOK_SHELL := preload("res://scripts/storybook_shell.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")
const KEYBOARD_SPACE: StringName = &"keyboard.space"
const POINTER_PRIMARY: StringName = &"pointer.primary"

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	var canopy := _choose_route(KEYBOARD_SPACE, true)
	var floor := _choose_route(POINTER_PRIMARY, false)

	test.expect(
		canopy == {
			"path_choice": "path-choice.lacewood",
			"available_routes": ["lacewood.canopy", "lacewood.floor"],
			"chosen_route": "lacewood.canopy",
			"interaction": "silver-ribbon-canopy",
			"visual_response": "silver-ribbons-unfurl",
			"routes_equally_safe": true,
			"route_duration_seconds": 1.8,
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
			"route_duration_seconds": 1.8,
			"rejoin_before_birthday_star": true,
			"correctness_signals": 0,
		},
		"releasing the same flight action chooses an equally rich rose-lit woodland floor",
	)
	test.finish(self, "Lacewood Path Choice acceptance")


func _choose_route(source: StringName, choose_canopy: bool) -> Dictionary:
	var shell := STORYBOOK_SHELL.new()
	var pack_root := ProjectSettings.globalize_path("res://../../shared/edition")
	test.expect(shell.prepare_launch(pack_root).get("ok") == true, "the Path Choice journey prepares")
	test.expect(shell.handle_player_intent("begin"), "the cover begins through its public intent")
	for _moment: int in 3:
		test.expect(shell.handle_player_action(source, true), "the shared action advances the story")
		shell.handle_player_action(source, false)

	# Both player paths enter the decision while holding the same flight action.
	test.expect(shell.handle_player_action(source, true), "the shared action is held into Lacewood")
	shell.advance_journey(0.75)
	if not choose_canopy:
		test.expect(shell.handle_player_action(source, false), "release expresses the woodland-floor choice")
	shell.advance_journey(1.25)
	if choose_canopy:
		test.expect(shell.handle_player_action(source, false), "the canopy hold releases after selection")

	var evidence: Dictionary = (
		shell.path_choice_evidence()
		if shell.has_method("path_choice_evidence")
		else {}
	)
	shell.free()
	return evidence
