extends SceneTree

const StorybookShell := preload("res://scripts/storybook_shell.gd")

var failures: Array[String] = []


func _init() -> void:
	var shell := StorybookShell.new()
	var launch: Dictionary = shell.prepare_launch()
	var evidence: Dictionary = shell.presentation_evidence()

	_expect(launch.get("ok") == true, "the bundled Edition Pack launches")
	_expect(evidence.get("state") == "cover", "launch opens on the cover")
	_expect(evidence.get("window_mode") == "windowed", "launch starts windowed")
	_expect(evidence.get("cover_asset") == "res://assets/storybook-cover.png", "the approved cover is selected")
	_expect(evidence.get("entry_points") == ["begin", "grown-up-corner"], "both quiet entry points are available")
	_expect(evidence.get("pack_digest") == StorybookShell.EXPECTED_PACK_DIGEST, "launch evidence retains the pack digest")

	var stage_rect: Rect2 = shell.storybook_stage_rect(Vector2(1440, 900))
	_expect(stage_rect == Rect2(0, 45, 1440, 810), "the 16:9 Storybook Stage is centered without cropping")
	_expect(shell.has_decorative_surroundings(Vector2(1440, 900)), "taller space is identified as decorative surroundings")
	_expect(not shell.has_decorative_surroundings(Vector2(1280, 720)), "a 16:9 viewport needs no decorative extension")

	shell.free()
	if failures.is_empty():
		print("PASS: Storybook shell launch acceptance")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)


func _expect(condition: bool, message: String) -> void:
	if not condition:
		failures.append("FAIL: " + message)
