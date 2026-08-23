extends SceneTree

const STORYBOOK_SHELL := preload("res://scripts/storybook_shell.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	var shell := STORYBOOK_SHELL.new()
	var pack_root := ProjectSettings.globalize_path("res://../../shared/edition")
	test.expect(shell.prepare_launch(pack_root).get("ok") == true, "the Abbey tracer prepares offline")
	_reach_golden_bell_abbey(shell)

	var arrival: Dictionary = shell.presentation_evidence()
	test.expect(
		arrival.get("state") == "active_play"
		and arrival.get("journey_phase") == "abbey-bell-play"
		and arrival.get("place") == "abbey",
		"Gram's Birthday Star Moment continues onward into Golden Bell Abbey",
	)
	test.expect(
		arrival.get("birthday_stars") == ["birthday-star.lacewood"]
		and arrival.get("journey_history") == {"lacewood.canopy": true},
		"the Abbey preserves every gathered Birthday Star and the completed Lacewood route",
	)
	var abbey_event_start := shell.sound_event_evidence().size() - 1
	test.expect(
		shell.sound_event_evidence().back() == {
			"event": "sound-event.place-entry",
			"context": {"place": "abbey"},
		},
		"entering the Abbey crossfades to its own place ambience",
	)

	test.expect(shell.handle_player_intent("action-pressed"), "holding plays a golden bell note")
	test.expect(
		not shell.handle_player_intent("action-pressed"),
		"a held action cannot ring the same bell note again without releasing",
	)
	test.expect(shell.handle_player_intent("action-released"), "releasing lets the bell note settle")
	test.expect(
		not shell.handle_player_intent("action-released"),
		"a released action cannot repeat the settling response",
	)
	test.expect(shell.handle_player_intent("action-pressed"), "the bell can be played again at once")
	test.expect(shell.handle_player_intent("action-released"), "the second bell note may settle")
	test.expect(
		shell.presentation_evidence().get("state") == "active_play"
		and shell.presentation_evidence().get("playful_bumps") == 0,
		"bell play has no timing skill, scoring, or failure",
	)

	shell.advance_journey(1.9)
	var bell_play: Dictionary = shell.presentation_evidence()
	test.expect(
		bell_play.get("journey_phase") == "abbey-bell-play"
		and bell_play.get("playful_bumps") == 2
		and bell_play.get("cloud_rests") == 1,
		"gentle local Abbey Playful Bumps add no further forced Cloud Rest",
	)
	shell.advance_journey(0.6)
	test.expect(
		shell.presentation_evidence().get("journey_phase") == "birthday-star-approach"
		and shell.presentation_evidence().get("place") == "abbey",
		"the Abbey vignette leads on to its Birthday Star",
	)
	shell.advance_journey(0.5)
	test.expect(
		shell.sound_event_evidence().back().get("event")
		== "sound-event.birthday-star-proximity",
		"the Abbey Birthday Star shimmer is its own first stage",
	)
	shell.advance_journey(0.6)
	test.expect(
		shell.sound_event_evidence().back().get("event")
		== "sound-event.birthday-star-gathered",
		"the shared immediate gather cue is its own second stage",
	)
	shell.advance_journey(1.4)
	test.expect(
		shell.sound_event_evidence().back().get("event")
		== "sound-event.rainbow-path-opened",
		"Rainbow Path and Pop's travel resolve before the place-specific moment",
	)
	shell.advance_journey(2.5)
	var abbey_moment: Dictionary = shell.presentation_evidence()
	test.expect(
		abbey_moment.get("state") == "birthday_star_moment"
		and abbey_moment.get("journey_phase") == "birthday-star-moment"
		and abbey_moment.get("birthday_stars") == [
			"birthday-star.lacewood",
			"birthday-star.abbey",
		]
		and abbey_moment.get("rainbow_paths") == [
			"rainbow-path.lacewood",
			"rainbow-path.abbey",
		],
		"the Abbey Birthday Star progresses to Pop's Birthday Star Moment",
	)
	test.expect(
		shell.sound_event_evidence().slice(abbey_event_start) == _abbey_events(),
		"the Abbey emits its complete place-specific staged sequence",
	)

	test.expect(shell.handle_player_intent("continue"), "Pop's Birthday Star Moment can continue")
	var celebration: Dictionary = shell.presentation_evidence()
	test.expect(
		celebration.get("state") == "celebration"
		and celebration.get("journey_phase") == "celebration"
		and celebration.get("journey_history") == {"lacewood.canopy": true},
		"the Abbey transitions onward to the celebration without adding a Path Choice",
	)
	test.expect(
		shell.sound_event_evidence().back() == {
			"event": "sound-event.birthday-castle-arrival",
			"context": {},
		},
		"the Abbey hands the journey to the Birthday Castle arrival",
	)

	var muted_shell: StorybookShell = STORYBOOK_SHELL.new()
	test.expect(
		muted_shell.prepare_launch(pack_root).get("ok") == true,
		"a second Abbey journey prepares offline",
	)
	_reach_golden_bell_abbey(muted_shell)
	test.expect(muted_shell.handle_player_intent("escape"), "the Abbey can open the Grown-up Corner")
	test.expect(muted_shell.handle_player_intent("toggle-sound"), "the Abbey journey turns Sound off")
	test.expect(muted_shell.handle_player_intent("resume"), "the Abbey journey resumes")
	test.expect(
		muted_shell.handle_player_intent("action-pressed"),
		"bell play continues while Sound is off",
	)
	test.expect(
		muted_shell.presentation_evidence().get("sound_enabled") == false
		and muted_shell.presentation_evidence().get("journey_phase") == "abbey-bell-play",
		"a missing or silenced Abbey response never blocks play",
	)

	shell.free()
	muted_shell.free()
	test.finish(self, "Golden Bell Abbey tracer acceptance")


func _reach_golden_bell_abbey(shell: StorybookShell) -> void:
	test.expect(shell.handle_player_intent("begin"), "the journey begins from the cover")
	for _opening_moment: int in 3:
		test.expect(shell.handle_player_intent("continue"), "the Opening Storybook Moment continues")
	shell.advance_journey(0.75)
	test.expect(shell.handle_player_intent("action-pressed"), "the canopy route is held")
	shell.advance_journey(1.25)
	test.expect(shell.handle_player_intent("action-released"), "the canopy hold releases")
	shell.advance_journey(1.8)
	test.expect(shell.handle_player_intent("action-pressed"), "Cloud Rest resumes immediately")
	shell.advance_journey(4.9)
	test.expect(
		shell.handle_player_intent("continue"),
		"Gram's Birthday Star Moment continues",
	)


func _abbey_events() -> Array:
	return [
		{"event": "sound-event.place-entry", "context": {"place": "abbey"}},
		{
			"event": "sound-event.vignette-interaction",
			"context": {"place": "abbey", "interaction": "golden-bell-note"},
		},
		{
			"event": "sound-event.vignette-interaction",
			"context": {"place": "abbey", "interaction": "golden-bell-settle"},
		},
		{
			"event": "sound-event.vignette-interaction",
			"context": {"place": "abbey", "interaction": "golden-bell-note"},
		},
		{
			"event": "sound-event.vignette-interaction",
			"context": {"place": "abbey", "interaction": "golden-bell-settle"},
		},
		{
			"event": "sound-event.near-miss",
			"context": {"place": "abbey", "kind": "bell-rope"},
		},
		{
			"event": "sound-event.playful-bump",
			"context": {"place": "abbey", "kind": "bell-rope"},
		},
		{
			"event": "sound-event.playful-bump",
			"context": {"place": "abbey", "kind": "bell-rope"},
		},
		{
			"event": "sound-event.birthday-star-proximity",
			"context": {"birthdayStar": "birthday-star.abbey"},
		},
		{
			"event": "sound-event.birthday-star-gathered",
			"context": {"birthdayStar": "birthday-star.abbey"},
		},
		{
			"event": "sound-event.rainbow-path-opened",
			"context": {"rainbowPath": "rainbow-path.abbey", "familyGuest": "Pop"},
		},
		{
			"event": "sound-event.birthday-star-moment",
			"context": {"place": "abbey", "familyGuest": "Pop"},
		},
	]
