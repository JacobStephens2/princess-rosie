extends SceneTree

const STORYBOOK_SHELL := preload("res://scripts/storybook_shell.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	var shell := STORYBOOK_SHELL.new()
	var pack_root := ProjectSettings.globalize_path("res://../../shared/edition")
	test.expect(shell.prepare_launch(pack_root).get("ok") == true, "the shell prepares before input")

	test.expect(shell.handle_player_intent("begin"), "Begin is accepted from the cover")
	var begun: Dictionary = shell.presentation_evidence()
	test.expect(begun.get("state") == "opening_storybook_moment", "Begin advances into the story")
	test.expect(begun.get("window_mode") == "fullscreen", "Begin requests fullscreen presentation")
	test.expect(
		begun.get("opening_moment") == "opening.celebration-preparations",
		"the celebration-across-the-sea reveal opens the story",
	)

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

	test.expect(shell.handle_player_intent("continue"), "the first story moment can continue")
	test.expect(
		shell.presentation_evidence().get("opening_moment") == "opening.scattered-stars",
		"the Star-scatter Storybook Moment follows the celebration reveal",
	)
	test.expect(shell.handle_player_intent("continue"), "the Star-scatter moment can continue")
	test.expect(
		shell.presentation_evidence().get("opening_moment") == "opening.departure",
		"Princess Rosi and Stella's readiness follows the Star scatter",
	)
	test.expect(shell.handle_player_intent("continue"), "the ready moment launches the journey")
	test.expect(
		shell.presentation_evidence().get("state") == "active_play",
		"the complete opening advances into active play",
	)
	test.expect(shell.handle_player_intent("action-pressed"), "holding the one action reports rise")
	test.expect(
		not shell.handle_player_intent("action-pressed"),
		"holding across animation frames does not repeat the rise edge",
	)
	test.expect(shell.handle_player_intent("action-released"), "releasing the one action reports glide")
	var sound_events: Array = shell.sound_event_evidence() if shell.has_method("sound_event_evidence") else []
	test.expect(
		sound_events == [
			{
				"event": "sound-event.opening-storybook-moment",
				"context": {"moment": "opening.celebration-preparations"},
			},
			{
				"event": "sound-event.sound-preference-changed",
				"context": {"enabled": false},
			},
			{
				"event": "sound-event.sound-preference-changed",
				"context": {"enabled": true},
			},
			{
				"event": "sound-event.opening-storybook-moment",
				"context": {"moment": "opening.scattered-stars"},
			},
			{
				"event": "sound-event.opening-storybook-moment",
				"context": {"moment": "opening.departure"},
			},
			{"event": "sound-event.flight-launch", "context": {}},
			{"event": "sound-event.movement-state", "context": {"state": "flight"}},
			{"event": "sound-event.movement-state", "context": {"state": "rise"}},
			{"event": "sound-event.movement-state", "context": {"state": "glide"}},
		],
		"the shell emits specific opening, preference, launch, and state-edge events without generic confirmation",
	)
	test.expect(shell.handle_player_intent("escape"), "active play can open the Grown-up Corner")
	test.expect(shell.handle_player_intent("replay"), "replaying the opening is accepted semantically")
	test.expect(
		shell.presentation_evidence().get("state") == "cover",
		"replay returns to the title-cover Storybook Moment",
	)
	test.expect(
		shell.sound_event_evidence().back() == {
			"event": "sound-event.replay",
			"context": {"destination": "opening-storybook"},
		},
		"replay reports its semantic destination without adding a control",
	)

	shell.free()
	test.finish(self, "presentation transition acceptance")
