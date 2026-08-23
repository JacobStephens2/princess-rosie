extends SceneTree

const STORYBOOK_SHELL := preload("res://scripts/storybook_shell.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	var shell := STORYBOOK_SHELL.new()
	var pack_root := ProjectSettings.globalize_path("res://../../shared/edition")
	test.expect(shell.prepare_launch(pack_root).get("ok") == true, "the Sapphire Sea prepares offline")

	_start_journey(shell)
	_fly_through_lacewood(shell, true)
	var sea_event_start := shell.sound_event_evidence().size()
	shell.advance_journey(0.75)
	var arrival: Dictionary = shell.presentation_evidence()
	test.expect(
		arrival.get("place") == "sapphire-sea"
		and arrival.get("journey_phase") == "sapphire-sea-path-choice",
		"the flight reaches the Sapphire Sea and offers its Path Choice",
	)
	test.expect(
		arrival.get("birthday_stars") == ["birthday-star.lacewood"]
		and arrival.get("rainbow_paths") == ["rainbow-path.lacewood"],
		"the coastal passage preserves every Birthday Star gathered before it",
	)

	test.expect(shell.handle_player_intent("action-pressed"), "holding chooses the shell-lined shore")
	shell.advance_journey(1.25)
	test.expect(shell.handle_player_intent("action-released"), "the one action may release after choosing")
	shell.advance_journey(1.8)
	var shore_rest: Dictionary = shell.presentation_evidence()
	test.expect(
		shore_rest.get("journey_phase") == "cloud-rest"
		and shore_rest.get("chosen_route") == "sapphire-sea.shore"
		and shore_rest.get("cloud_rests") == 2,
		"the shore route reaches its own Cloud Rest after three gentle Playful Bumps",
	)
	test.expect(
		shore_rest.get("path_choices") == {
			"path-choice.lacewood": "lacewood.canopy",
			"path-choice.sapphire-sea": "sapphire-sea.shore",
		},
		"Cloud Rest at sea preserves every route already chosen",
	)
	test.expect(shell.handle_player_intent("action-pressed"), "the sea Cloud Rest resumes immediately")
	shell.advance_journey(0.45)
	test.expect(
		shell.sound_event_evidence().back().get("event")
		== "sound-event.birthday-star-proximity",
		"the Sapphire Sea Birthday Star shimmer is its own first stage",
	)
	shell.advance_journey(4.45)
	var shore_moment: Dictionary = shell.presentation_evidence()
	test.expect(
		shore_moment.get("state") == "birthday_star_moment"
		and shore_moment.get("birthday_stars") == [
			"birthday-star.lacewood",
			"birthday-star.sapphire-sea",
		]
		and shore_moment.get("rainbow_paths") == [
			"rainbow-path.lacewood",
			"rainbow-path.sapphire-sea",
		],
		"the sea Star response progresses through gathering to Uncle's Birthday Star Moment",
	)
	test.expect(
		shell.sound_event_evidence().slice(sea_event_start) == _sea_events(
			"sapphire-sea.shore",
			"shell-lined-shore",
			"",
		),
		"the shore route emits the complete staged Sapphire Sea and Birthday Star sequence",
	)

	test.expect(shell.handle_player_intent("continue"), "Uncle's Birthday Star Moment can continue")
	var celebration: Dictionary = shell.presentation_evidence()
	test.expect(
		celebration.get("state") == "celebration"
		and celebration.get("journey_phase") == "celebration"
		and celebration.get("journey_history") == {
			"lacewood.canopy": true,
			"sapphire-sea.shore": true,
		},
		"the last place before the castle enters Journey History and reaches the celebration",
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
		"the Sapphire Sea transitions to the Birthday Castle celebration",
	)

	test.expect(shell.handle_player_intent("escape"), "the completed journey can open the Grown-up Corner")
	test.expect(shell.handle_player_intent("replay"), "the journey can replay from the cover")
	_start_journey(shell)
	_fly_through_lacewood(shell, false)
	var replay_event_start := shell.sound_event_evidence().size()
	shell.advance_journey(0.75)
	shell.advance_journey(1.25)
	shell.advance_journey(1.8)
	test.expect(
		shell.presentation_evidence().get("chosen_route") == "sapphire-sea.open-water",
		"release selects the equally safe open sparkling water on replay",
	)
	test.expect(shell.handle_player_intent("action-pressed"), "the open-water route resumes from Cloud Rest")
	shell.advance_journey(4.9)
	test.expect(
		shell.sound_event_evidence().slice(replay_event_start) == _sea_events(
			"sapphire-sea.open-water",
			"open-sparkling-water",
			"sapphire-sea.open-water",
		),
		"replay gives the unexplored sea route one restrained shimmer and its distinct response",
	)
	test.expect(shell.handle_player_intent("continue"), "the open-water Birthday Star Moment continues")
	test.expect(
		shell.presentation_evidence().get("journey_history") == {
			"lacewood.canopy": true,
			"lacewood.floor": true,
			"sapphire-sea.shore": true,
			"sapphire-sea.open-water": true,
		},
		"both equally safe sea routes complete without score, loss, or failure progression",
	)

	shell.free()
	test.finish(self, "Sapphire Sea tracer acceptance")


func _start_journey(shell: StorybookShell) -> void:
	test.expect(shell.handle_player_intent("begin"), "the journey begins from the cover")
	for _opening_moment: int in 3:
		test.expect(shell.handle_player_intent("continue"), "the Opening Storybook Moment continues")


func _fly_through_lacewood(shell: StorybookShell, choose_canopy: bool) -> void:
	shell.advance_journey(0.75)
	if choose_canopy:
		test.expect(shell.handle_player_intent("action-pressed"), "the canopy route is held")
	shell.advance_journey(1.25)
	if choose_canopy:
		test.expect(shell.handle_player_intent("action-released"), "the canopy hold releases")
	shell.advance_journey(1.8)
	test.expect(shell.handle_player_intent("action-pressed"), "the Lacewood Cloud Rest resumes")
	shell.advance_journey(4.9)
	test.expect(shell.handle_player_intent("continue"), "Gram's Birthday Star Moment flies on")


func _sea_events(route: String, interaction: String, shimmer_route: String) -> Array:
	var events := [
		{"event": "sound-event.place-entry", "context": {"place": "sapphire-sea"}},
		{
			"event": "sound-event.path-choice-available",
			"context": {"pathChoice": "path-choice.sapphire-sea"},
		},
	]
	if not shimmer_route.is_empty():
		events.append({
			"event": "sound-event.journey-history-shimmer",
			"context": {
				"pathChoice": "path-choice.sapphire-sea",
				"route": shimmer_route,
			},
		})
	events.append_array([
		{
			"event": "sound-event.path-choice-selected",
			"context": {"pathChoice": "path-choice.sapphire-sea", "route": route},
		},
		{
			"event": "sound-event.vignette-interaction",
			"context": {"place": "sapphire-sea", "interaction": interaction},
		},
		{
			"event": "sound-event.near-miss",
			"context": {"place": "sapphire-sea", "kind": "sea-spray"},
		},
		{
			"event": "sound-event.playful-bump",
			"context": {"place": "sapphire-sea", "kind": "sparkling-wave"},
		},
		{
			"event": "sound-event.playful-bump",
			"context": {"place": "sapphire-sea", "kind": "sparkling-wave"},
		},
		{
			"event": "sound-event.playful-bump",
			"context": {"place": "sapphire-sea", "kind": "sparkling-wave"},
		},
		{"event": "sound-event.cloud-rest-entered", "context": {"place": "sapphire-sea"}},
		{"event": "sound-event.cloud-rest-exited", "context": {"place": "sapphire-sea"}},
		{"event": "sound-event.movement-state", "context": {"state": "flight"}},
		{
			"event": "sound-event.birthday-star-proximity",
			"context": {"birthdayStar": "birthday-star.sapphire-sea"},
		},
		{
			"event": "sound-event.birthday-star-gathered",
			"context": {"birthdayStar": "birthday-star.sapphire-sea"},
		},
		{
			"event": "sound-event.rainbow-path-opened",
			"context": {
				"rainbowPath": "rainbow-path.sapphire-sea",
				"familyGuest": "Uncle",
			},
		},
		{
			"event": "sound-event.birthday-star-moment",
			"context": {"place": "sapphire-sea", "familyGuest": "Uncle"},
		},
	])
	return events
