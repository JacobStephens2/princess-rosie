extends SceneTree

const STORYBOOK_SHELL := preload("res://scripts/storybook_shell.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")
const SCENARIO_PATH := "res://../../shared/edition/parity/pellegrino-peak.json"

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	var scenario_value: Variant = JSON.parse_string(FileAccess.get_file_as_string(SCENARIO_PATH))
	test.expect(scenario_value is Dictionary, "the shared Pellegrino Peak scenario parses")
	if not scenario_value is Dictionary:
		test.finish(self, "Pellegrino Peak tracer acceptance")
		return
	var scenario: Dictionary = scenario_value
	var shell := STORYBOOK_SHELL.new()
	var pack_root := ProjectSettings.globalize_path("res://../../shared/edition")
	test.expect(
		shell.prepare_launch(pack_root).get("ok") == true,
		"the Pellegrino Peak tracer prepares offline",
	)
	_reach_pellegrino_peak(shell)

	var peak_event_start := shell.sound_event_evidence().size() - 1
	var entry: Dictionary = shell.presentation_evidence()
	test.expect(
		entry.get("place") == "pellegrino-peak"
		and entry.get("journey_phase") == "pellegrino-peak-updraft"
		and entry.get("state") == "active_play",
		"Gram's Birthday Star Moment carries the journey onward into Pellegrino Peak",
	)
	test.expect(
		shell.sound_event_evidence().back() == {
			"event": "sound-event.place-entry",
			"context": {"place": "pellegrino-peak"},
		},
		"entering the Peak asks for its own place ambience so the one slot crossfades",
	)
	test.expect(
		entry.get("birthday_stars") == ["birthday-star.lacewood"]
		and entry.get("rainbow_paths") == ["rainbow-path.lacewood"],
		"the place transition preserves every earlier Birthday Star and Rainbow Path",
	)

	shell.advance_journey(0.5)
	test.expect(
		shell.sound_event_evidence().back() == {
			"event": "sound-event.near-miss",
			"context": {"place": "pellegrino-peak", "kind": "flower-petal"},
		},
		"the Peak near miss is its own place-specific encounter",
	)
	test.expect(shell.handle_player_intent("action-pressed"), "the one button rides an updraft")
	test.expect(
		shell.sound_event_evidence().slice(-2) == [
			{"event": "sound-event.movement-state", "context": {"state": "rise"}},
			{
				"event": "sound-event.vignette-interaction",
				"context": {
					"place": "pellegrino-peak",
					"interaction": "flower-petal-updraft",
				},
			},
		],
		"the flower-petal updraft answers the one-button rise edge",
	)
	var events_before_repeated_press := shell.sound_event_evidence().size()
	test.expect(
		not shell.handle_player_intent("action-pressed"),
		"holding the one button cannot re-fire the updraft per particle",
	)
	test.expect(
		shell.sound_event_evidence().size() == events_before_repeated_press,
		"a repeated hold emits no further updraft response",
	)
	shell.advance_journey(0.6)
	test.expect(shell.handle_player_intent("action-released"), "the updraft ride can release")
	shell.advance_journey(1.7)
	var updraft: Dictionary = shell.presentation_evidence()
	test.expect(
		updraft.get("playful_bumps") == 5 and updraft.get("cloud_rests") == 1,
		"two gentle local Peak bumps stay short of another Cloud Rest",
	)
	test.expect(
		updraft.get("journey_phase") == "birthday-star-approach",
		"the Peak vignette gives way to its Birthday Star approach",
	)

	shell.advance_journey(0.45)
	test.expect(
		shell.sound_event_evidence().back() == {
			"event": "sound-event.birthday-star-proximity",
			"context": {"birthdayStar": "birthday-star.pellegrino-peak"},
		},
		"the Peak Birthday Star shimmer is its own first stage",
	)
	shell.advance_journey(0.55)
	test.expect(
		shell.sound_event_evidence().back() == {
			"event": "sound-event.birthday-star-gathered",
			"context": {"birthdayStar": "birthday-star.pellegrino-peak"},
		},
		"the shared gather identity is its own second stage at the Peak",
	)
	shell.advance_journey(1.4)
	test.expect(
		shell.sound_event_evidence().back() == {
			"event": "sound-event.rainbow-path-opened",
			"context": {
				"rainbowPath": "rainbow-path.pellegrino-peak",
				"familyGuest": "Aunt",
			},
		},
		"Aunt's Rainbow Path travel resolves before her Birthday Star Moment",
	)
	shell.advance_journey(2.5)
	var moment: Dictionary = shell.presentation_evidence()
	test.expect(
		moment.get("state") == "birthday_star_moment"
		and moment.get("birthday_stars") == [
			"birthday-star.lacewood",
			"birthday-star.pellegrino-peak",
		]
		and moment.get("rainbow_paths") == [
			"rainbow-path.lacewood",
			"rainbow-path.pellegrino-peak",
		],
		"Aunt's open-air Birthday Star Moment closes the Peak with progress preserved",
	)
	test.expect(
		shell.handle_player_intent("continue"),
		"Aunt's Birthday Star Moment carries the journey onward",
	)
	test.expect(
		shell.presentation_evidence().get("state") == "celebration",
		"the last sounded place reaches the Birthday Castle celebration",
	)
	test.expect(shell.handle_player_intent("action-pressed"), "the celebration dances again")
	test.expect(shell.handle_player_intent("action-released"), "the celebration action releases")
	test.expect(
		shell.sound_event_evidence().slice(peak_event_start)
		== scenario.get("requiredSoundEvents", []),
		"actual Peak semantic evidence exactly matches the shared Peak scenario",
	)

	# A journey that never presses at the Peak keeps every core stage intact.
	test.expect(shell.handle_player_intent("escape"), "the completed Peak can pause")
	test.expect(shell.handle_player_intent("replay"), "the Peak tracer can replay")
	_reach_pellegrino_peak(shell)
	var quiet_event_start := shell.sound_event_evidence().size() - 1
	shell.advance_journey(2.8)
	shell.advance_journey(4.9)
	var quiet_events := shell.sound_event_evidence().slice(quiet_event_start)
	var quiet_event_ids: Array[String] = []
	for quiet_event: Dictionary in quiet_events:
		quiet_event_ids.append(str(quiet_event.get("event")))
	test.expect(
		not quiet_event_ids.has("sound-event.vignette-interaction"),
		"an unridden updraft simply never sounds",
	)
	test.expect(
		quiet_event_ids.has("sound-event.birthday-star-gathered")
		and quiet_event_ids.has("sound-event.rainbow-path-opened")
		and quiet_event_ids.has("sound-event.birthday-star-moment"),
		"a missing optional Peak interaction never blocks the Birthday Star stages",
	)
	test.expect(
		shell.handle_player_intent("continue"),
		"the quiet Peak visit still reaches the celebration",
	)

	shell.free()
	test.finish(self, "Pellegrino Peak tracer acceptance")


func _reach_pellegrino_peak(shell: StorybookShell) -> void:
	test.expect(shell.handle_player_intent("begin"), "the journey begins from the cover")
	for _opening_moment: int in 3:
		test.expect(shell.handle_player_intent("continue"), "the Opening Storybook Moment continues")
	shell.advance_journey(0.75)
	test.expect(shell.handle_player_intent("action-pressed"), "the Lacewood canopy route is held")
	shell.advance_journey(1.25)
	test.expect(shell.handle_player_intent("action-released"), "the canopy hold releases")
	shell.advance_journey(1.8)
	test.expect(shell.handle_player_intent("action-pressed"), "the Lacewood Cloud Rest resumes")
	shell.advance_journey(4.9)
	test.expect(
		shell.handle_player_intent("continue"),
		"Gram's Birthday Star Moment continues onward",
	)
