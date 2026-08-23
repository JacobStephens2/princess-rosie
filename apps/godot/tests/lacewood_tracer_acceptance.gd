extends SceneTree

const STORYBOOK_SHELL := preload("res://scripts/storybook_shell.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	var shell := STORYBOOK_SHELL.new()
	var pack_root := ProjectSettings.globalize_path("res://../../shared/edition")
	test.expect(shell.prepare_launch(pack_root).get("ok") == true, "the Lacewood tracer prepares offline")
	_start_journey(shell)
	shell._birthday_stars = ["birthday-star.rose-garden"]

	shell.advance_journey(0.75)
	test.expect(
		shell.presentation_evidence().get("journey_phase") == "lacewood-path-choice",
		"the opening flight reaches Zélie's Lacewood and offers its Path Choice",
	)
	test.expect(shell.handle_player_intent("action-pressed"), "holding chooses the airy route")
	shell.advance_journey(1.25)
	test.expect(shell.handle_player_intent("action-released"), "the one action may be released after choosing")
	shell.advance_journey(1.8)
	var canopy_rest: Dictionary = shell.presentation_evidence()
	test.expect(
		canopy_rest.get("journey_phase") == "cloud-rest"
		and canopy_rest.get("chosen_route") == "lacewood.canopy"
		and canopy_rest.get("playful_bumps") == 3
		and canopy_rest.get("cloud_rests") == 1,
		"the silver-ribbon route reaches one forced Cloud Rest after three gentle Playful Bumps",
	)
	test.expect(
		canopy_rest.get("path_choices") == {
			"path-choice.lacewood": "lacewood.canopy",
		}
		and canopy_rest.get("birthday_stars") == ["birthday-star.rose-garden"],
		"Cloud Rest preserves a chosen route and an already gathered Birthday Star",
	)
	test.expect(shell.handle_player_intent("action-pressed"), "Cloud Rest can resume immediately")
	shell.advance_journey(0.45)
	test.expect(
		shell.presentation_evidence().get("state") == "active_play"
		and shell.sound_event_evidence().back().get("event")
		== "sound-event.birthday-star-proximity",
		"the nearby Birthday Star shimmer is its own first stage",
	)
	shell.advance_journey(0.55)
	test.expect(
		shell.presentation_evidence().get("state") == "active_play"
		and shell.sound_event_evidence().back().get("event")
		== "sound-event.birthday-star-gathered",
		"the immediate gather cue is its own second stage",
	)
	shell.advance_journey(1.4)
	test.expect(
		shell.presentation_evidence().get("state") == "active_play"
		and shell.sound_event_evidence().back().get("event")
		== "sound-event.rainbow-path-opened",
		"Rainbow Path and Gram travel can resolve before the place-specific moment",
	)
	shell.advance_journey(2.5)
	var canopy_moment: Dictionary = shell.presentation_evidence()
	test.expect(
		canopy_moment.get("state") == "birthday_star_moment"
		and canopy_moment.get("journey_phase") == "birthday-star-moment"
		and canopy_moment.get("birthday_stars") == [
			"birthday-star.rose-garden",
			"birthday-star.lacewood",
		],
		"the nearby Star response progresses through gathering to Gram's Birthday Star Moment",
	)
	test.expect(
		shell.sound_event_evidence().slice(5) == _lacewood_events(
			"lacewood.canopy",
			"silver-ribbon-canopy",
			false,
		),
		"the canopy route emits the complete staged Lacewood, Cloud Rest, and Birthday Star sequence",
	)
	test.expect(shell.handle_player_intent("continue"), "Gram's Birthday Star Moment can continue")
	var onward: Dictionary = shell.presentation_evidence()
	test.expect(
		onward.get("state") == "active_play"
		and onward.get("place") == "cloister"
		and onward.get("journey_phase") == "cloister-path-choice"
		and onward.get("journey_history") == {"lacewood.canopy": true},
		"the completed canopy route enters Journey History and the flight carries on to the Cloister of Clouds",
	)
	_fly_cloister(shell, true)
	test.expect(shell.handle_player_intent("continue"), "Beasley's Birthday Star Moment can continue")
	test.expect(
		shell.presentation_evidence().get("state") == "celebration"
		and shell.presentation_evidence().get("journey_phase") == "celebration"
		and shell.presentation_evidence().get("journey_history") == {
			"lacewood.canopy": true,
			"cloister.arches": true,
		},
		"both completed routes enter Journey History and the journey reaches the celebration",
	)
	test.expect(shell.handle_player_intent("action-pressed"), "the one action starts Dance Again")
	test.expect(shell.handle_player_intent("action-released"), "the celebration action can release")
	test.expect(
		shell.sound_event_evidence().slice(-2) == [
			{"event": "sound-event.birthday-castle-arrival", "context": {}},
			{
				"event": "sound-event.celebration-interaction",
				"context": {"action": "dance-again"},
			},
		],
		"the native tracer completes at the Birthday Castle celebration",
	)

	test.expect(shell.handle_player_intent("escape"), "the completed tracer can open the Grown-up Corner")
	test.expect(shell.handle_player_intent("replay"), "the tracer can replay from the cover")
	_start_journey(shell)
	var second_lacewood_event_start := shell.sound_event_evidence().size()
	shell.advance_journey(0.75)
	shell.advance_journey(1.25)
	shell.advance_journey(1.8)
	var floor_rest: Dictionary = shell.presentation_evidence()
	test.expect(
		floor_rest.get("chosen_route") == "lacewood.floor"
		and floor_rest.get("path_choices") == {
			"path-choice.lacewood": "lacewood.floor",
		},
		"release selects the equally safe rose-lit woodland floor on replay",
	)
	test.expect(shell.handle_player_intent("action-pressed"), "the floor route resumes from Cloud Rest")
	shell.advance_journey(4.9)
	test.expect(
		shell.sound_event_evidence().slice(second_lacewood_event_start) == _lacewood_events(
			"lacewood.floor",
			"rose-lit-floor",
			true,
		),
		"replay gives the unexplored route one restrained shimmer and its distinct response",
	)
	test.expect(shell.handle_player_intent("continue"), "the floor-route Birthday Star Moment continues")
	_fly_cloister(shell, false)
	test.expect(shell.handle_player_intent("continue"), "the replayed Cloister Moment continues")
	test.expect(shell.handle_player_intent("action-pressed"), "the replay reaches Dance Again")
	test.expect(shell.handle_player_intent("action-released"), "the replay dance action can release")
	test.expect(
		shell.presentation_evidence().get("journey_history") == {
			"lacewood.canopy": true,
			"lacewood.floor": true,
			"cloister.arches": true,
			"cloister.clouds": true,
		},
		"both equally safe Path Choices in each place complete without score, loss, or failure progression",
	)

	shell.free()
	test.finish(self, "Lacewood tracer acceptance")


func _fly_cloister(shell: StorybookShell, hold_for_arches: bool) -> void:
	if hold_for_arches:
		test.expect(
			shell.handle_player_intent("action-pressed"),
			"holding chooses the sunlit arch route onward",
		)
	shell.advance_journey(1.25)
	test.expect(
		shell.handle_player_intent("action-released"),
		"the one action may be released along the Cloister route",
	)
	shell.advance_journey(2.25)
	shell.advance_journey(4.9)


func _start_journey(shell: StorybookShell) -> void:
	test.expect(shell.handle_player_intent("begin"), "the journey begins from the cover")
	for _opening_moment: int in 3:
		test.expect(shell.handle_player_intent("continue"), "the Opening Storybook Moment continues")


func _lacewood_events(route: String, interaction: String, includes_shimmer: bool) -> Array:
	var events := [
		{"event": "sound-event.place-entry", "context": {"place": "lacewood"}},
		{
			"event": "sound-event.path-choice-available",
			"context": {"pathChoice": "path-choice.lacewood"},
		},
	]
	if includes_shimmer:
		events.append({
			"event": "sound-event.journey-history-shimmer",
			"context": {
				"pathChoice": "path-choice.lacewood",
				"route": "lacewood.floor",
			},
		})
	events.append_array([
		{
			"event": "sound-event.path-choice-selected",
			"context": {"pathChoice": "path-choice.lacewood", "route": route},
		},
		{
			"event": "sound-event.vignette-interaction",
			"context": {"place": "lacewood", "interaction": interaction},
		},
		{
			"event": "sound-event.near-miss",
			"context": {"place": "lacewood", "kind": "silver-ribbon"},
		},
		{
			"event": "sound-event.playful-bump",
			"context": {"place": "lacewood", "kind": "silver-ribbon"},
		},
		{
			"event": "sound-event.playful-bump",
			"context": {"place": "lacewood", "kind": "silver-ribbon"},
		},
		{
			"event": "sound-event.playful-bump",
			"context": {"place": "lacewood", "kind": "silver-ribbon"},
		},
		{"event": "sound-event.cloud-rest-entered", "context": {"place": "lacewood"}},
		{"event": "sound-event.cloud-rest-exited", "context": {"place": "lacewood"}},
		{"event": "sound-event.movement-state", "context": {"state": "flight"}},
		{
			"event": "sound-event.birthday-star-proximity",
			"context": {"birthdayStar": "birthday-star.lacewood"},
		},
		{
			"event": "sound-event.birthday-star-gathered",
			"context": {"birthdayStar": "birthday-star.lacewood"},
		},
		{
			"event": "sound-event.rainbow-path-opened",
			"context": {"rainbowPath": "rainbow-path.lacewood", "familyGuest": "Gram"},
		},
		{
			"event": "sound-event.birthday-star-moment",
			"context": {"place": "lacewood", "familyGuest": "Gram"},
		},
	])
	return events
