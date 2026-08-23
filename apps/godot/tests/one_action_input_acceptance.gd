extends SceneTree

const STORYBOOK_SHELL := preload("res://scripts/storybook_shell.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")

const KEYBOARD_SPACE: StringName = &"keyboard.space"
const POINTER_PRIMARY: StringName = &"pointer.primary"

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	var shell := STORYBOOK_SHELL.new()
	var pack_root := ProjectSettings.globalize_path("res://../../shared/edition")
	test.expect(shell.prepare_launch(pack_root).get("ok") == true, "the shell prepares for one-action input")
	test.expect(shell.handle_player_intent("begin"), "Begin opens the first story moment")

	test.expect(
		shell.handle_player_action(KEYBOARD_SPACE, true),
		"an intentional Space press turns the first story moment",
	)
	test.expect(
		shell.presentation_evidence().get("opening_moment") == "opening.scattered-stars",
		"Space reaches the Star-scatter moment",
	)
	test.expect(
		not shell.handle_player_action(KEYBOARD_SPACE, true),
		"key repeat cannot turn another story moment",
	)
	test.expect(
		not shell.handle_player_action(POINTER_PRIMARY, true),
		"an overlapping primary pointer cannot double-trigger the held action",
	)
	test.expect(
		shell.presentation_evidence().get("opening_moment") == "opening.scattered-stars",
		"overlapping input leaves the current story moment waiting",
	)
	test.expect(
		not shell.handle_player_action(KEYBOARD_SPACE, false),
		"releasing one overlapping source keeps the shared action held",
	)
	test.expect(
		shell.presentation_evidence().get("active_action_sources") == ["pointer.primary"],
		"semantic evidence retains the still-held source",
	)
	test.expect(
		shell.handle_player_action(POINTER_PRIMARY, false),
		"releasing the final source resets the shared action",
	)

	test.expect(
		shell.handle_player_action(POINTER_PRIMARY, true),
		"an intentional primary pointer press turns the Star-scatter moment",
	)
	test.expect(
		shell.presentation_evidence().get("opening_moment") == "opening.departure",
		"primary mouse or trackpad input reaches Rosie and Stella's promise",
	)
	test.expect(shell.handle_player_action(POINTER_PRIMARY, false), "the story action releases cleanly")

	test.expect(
		shell.handle_player_action(KEYBOARD_SPACE, true),
		"holding Space on the final story moment launches and rises",
	)
	test.expect(
		shell.presentation_evidence().get("state") == "active_play",
		"the same public action path enters active flight",
	)
	test.expect(
		shell.presentation_evidence().get("movement_state") == "rise",
		"the launch press remains held as immediate flight input",
	)
	test.expect(
		not shell.handle_player_action(POINTER_PRIMARY, true),
		"overlapping pointer input does not emit a second rise edge",
	)
	test.expect(
		not shell.handle_player_action(KEYBOARD_SPACE, false),
		"flight does not glide while the pointer remains held",
	)
	test.expect(
		shell.presentation_evidence().get("movement_state") == "rise",
		"the shared action remains rising until every source releases",
	)
	test.expect(
		shell.handle_player_action(POINTER_PRIMARY, false),
		"releasing the final source enters glide",
	)
	test.expect(
		shell.presentation_evidence().get("movement_state") == "glide",
		"Space, mouse, and trackpad share one release state",
	)
	test.expect(
		shell.presentation_evidence().get("observed_action_sources")
		== ["keyboard.space", "pointer.primary"],
		"semantic evidence records both equivalent physical bindings",
	)

	shell.free()
	test.finish(self, "one-action input acceptance")
