extends SceneTree

const StorybookShell := preload("res://scripts/storybook_shell.gd")

var failures: Array[String] = []


func _init() -> void:
	var shell := StorybookShell.new()
	_expect(shell.prepare_launch().get("ok") == true, "the shell prepares before input")

	_expect(shell.handle_player_intent("begin"), "Begin is accepted from the cover")
	var begun: Dictionary = shell.presentation_evidence()
	_expect(begun.get("state") == "opening_storybook_moment", "Begin advances into the story")
	_expect(begun.get("window_mode") == "fullscreen", "Begin requests fullscreen presentation")

	_expect(shell.handle_player_intent("escape"), "Escape is accepted during the story")
	var paused: Dictionary = shell.presentation_evidence()
	_expect(paused.get("state") == "paused", "Escape returns control to a paused presentation")
	_expect(paused.get("window_mode") == "windowed", "Escape restores windowed control")
	_expect(paused.get("grown_up_corner_visible") == true, "the Grown-up Corner is available while paused")

	_expect(shell.handle_player_intent("resume"), "the Grown-up Helper can resume")
	_expect(shell.presentation_evidence().get("window_mode") == "fullscreen", "resume restores fullscreen")

	shell.free()
	if failures.is_empty():
		print("PASS: presentation transition acceptance")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)


func _expect(condition: bool, message: String) -> void:
	if not condition:
		failures.append("FAIL: " + message)
