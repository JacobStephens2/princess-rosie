extends SceneTree

const STORYBOOK_SHELL := preload("res://scripts/storybook_shell.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	var shell := STORYBOOK_SHELL.new()
	test.expect(shell.prepare_launch().get("ok") == true, "the shell prepares before input")

	test.expect(shell.handle_player_intent("begin"), "Begin is accepted from the cover")
	var begun: Dictionary = shell.presentation_evidence()
	test.expect(begun.get("state") == "opening_storybook_moment", "Begin advances into the story")
	test.expect(begun.get("window_mode") == "fullscreen", "Begin requests fullscreen presentation")

	test.expect(shell.handle_player_intent("escape"), "Escape is accepted during the story")
	var paused: Dictionary = shell.presentation_evidence()
	test.expect(paused.get("state") == "paused", "Escape returns control to a paused presentation")
	test.expect(paused.get("window_mode") == "windowed", "Escape restores windowed control")
	test.expect(paused.get("grown_up_corner_visible") == true, "the Grown-up Corner is available while paused")
	test.expect(paused.get("sound_enabled") == true, "Sound starts enabled")
	test.expect(shell.handle_player_intent("toggle-sound"), "the Grown-up Helper can disable Sound")
	test.expect(shell.presentation_evidence().get("sound_enabled") == false, "one Sound preference records disabled")
	test.expect(shell.handle_player_intent("toggle-sound"), "the Grown-up Helper can enable Sound")
	test.expect(shell.presentation_evidence().get("sound_enabled") == true, "the same Sound preference records enabled")
	test.expect(not shell.handle_player_intent("escape"), "Escape is ignored when already paused")

	test.expect(shell.handle_player_intent("resume"), "the Grown-up Helper can resume")
	test.expect(shell.presentation_evidence().get("state") == "opening_storybook_moment", "resume returns to the interrupted presentation")
	test.expect(shell.presentation_evidence().get("window_mode") == "fullscreen", "resume restores fullscreen")

	shell.free()
	test.finish(self, "presentation transition acceptance")
