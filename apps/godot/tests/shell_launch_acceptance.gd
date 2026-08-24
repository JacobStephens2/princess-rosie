extends SceneTree

const STORYBOOK_SCENE := preload("res://scenes/storybook_shell.tscn")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	_run.call_deferred()


func _run() -> void:
	var shell: StorybookShell = STORYBOOK_SCENE.instantiate()
	root.add_child(shell)
	await process_frame
	var evidence: Dictionary = shell.presentation_evidence()
	var stage_evidence: Dictionary = shell.storybook_stage_evidence()

	test.expect(evidence.get("state") == "cover", "launch opens on the cover")
	test.expect(evidence.get("window_mode") == "windowed", "launch starts windowed")
	test.expect(evidence.get("cover_asset") == "res://assets/storybook-cover.png", "the approved cover is selected")
	test.expect(evidence.get("entry_points") == ["begin", "grown-up-corner"], "both quiet entry points are available")
	test.expect(evidence.get("pack_revision") == ACCEPTANCE_TEST.EXPECTED_PACK_REVISION, "launch evidence retains the Edition Pack revision")
	test.expect(stage_evidence.get("cover_visible") == true, "the real scene displays the approved cover")
	test.expect(stage_evidence.get("entry_points_visible") == true, "the real scene displays both entry points")
	test.expect(stage_evidence.get("essential_content_cropped") == false, "the real scene keeps essentials inside the Stage")

	var stage_rect: Rect2 = shell.storybook_stage_rect(Vector2(1440, 900))
	test.expect(stage_rect == Rect2(0, 45, 1440, 810), "the 16:9 Storybook Stage is centered without cropping")
	test.expect(shell.has_decorative_surroundings(Vector2(1440, 900)), "taller space is identified as decorative surroundings")
	test.expect(not shell.has_decorative_surroundings(Vector2(1280, 720)), "a 16:9 viewport needs no decorative extension")

	shell.queue_free()
	await process_frame
	test.finish(self, "Storybook shell launch acceptance")
