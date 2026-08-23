extends SceneTree

const STORYBOOK_SHELL := preload("res://scripts/storybook_shell.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")
const SCENARIO_PATH := "res://../../shared/edition/parity/pellegrino-peak.json"
const KEYBOARD_SPACE: StringName = &"keyboard.space"

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

	var peak_event_start := _peak_entry_index(shell)
	var entry: Dictionary = shell.presentation_evidence()
	test.expect(
		entry.get("place") == "pellegrino-peak"
		and entry.get("journey_phase") == "pellegrino-peak-flight"
		and entry.get("state") == "active_play",
		"Gram's Birthday Star Moment carries the journey onward into Pellegrino Peak",
	)
	test.expect(
		shell.sound_event_evidence()[peak_event_start] == {
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

	# A sustained rise carries Stella into the flower-petal updrafts.
	shell.handle_player_action(KEYBOARD_SPACE, true)
	_advance_controlled(shell, 3.4)
	test.expect(
		shell.presentation_evidence().get("observed_interactions") == ["flower-petal-updraft"],
		"holding to rise answers with the Peak's buoyant flower-petal updraft",
	)
	var events_after_updraft := shell.sound_event_evidence().size()
	_advance_controlled(shell, 1.0)
	test.expect(
		shell.sound_event_evidence().size() == events_after_updraft,
		"a continued hold cannot re-fire the updraft per petal",
	)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	_advance_controlled(shell, 9.0)
	var corridor: Dictionary = shell.presentation_evidence()
	test.expect(
		corridor.get("playful_bumps") == 5 and corridor.get("cloud_rests") == 1,
		"two gentle local Peak bumps stay short of another Cloud Rest",
	)
	test.expect(
		corridor.get("journey_phase") == "birthday-star-approach",
		"the Peak corridor completes into its Birthday Star approach",
	)

	_advance_controlled(shell, 5.2)
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
		shell.handle_player_action(KEYBOARD_SPACE, true),
		"a deliberate press carries Aunt's Birthday Star Moment onward",
	)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	test.expect(
		shell.presentation_evidence().get("state") == "celebration",
		"the last sounded place reaches the Birthday Castle celebration",
	)
	test.expect(shell.handle_player_action(KEYBOARD_SPACE, true), "the celebration dances again")
	shell.handle_player_action(KEYBOARD_SPACE, false)
	test.expect(
		shell.sound_event_evidence().slice(peak_event_start)
		== scenario.get("requiredSoundEvents", []),
		"actual Peak semantic evidence exactly matches the shared Peak scenario\nexpected: %s\nactual: %s"
		% [
			JSON.stringify(scenario.get("requiredSoundEvents", [])),
			JSON.stringify(shell.sound_event_evidence().slice(peak_event_start)),
		],
	)

	shell.free()
	test.finish(self, "Pellegrino Peak tracer acceptance")


# A journey that never rises at the Peak keeps every core Birthday Star stage.
func _quiet_peak_visit() -> void:
	var shell := STORYBOOK_SHELL.new()
	var pack_root := ProjectSettings.globalize_path("res://../../shared/edition")
	shell.prepare_launch(pack_root)
	_reach_pellegrino_peak(shell)
	var quiet_start := shell.sound_event_evidence().size()
	_advance_controlled(shell, 12.4)
	_advance_controlled(shell, 5.2)
	var quiet_event_ids: Array[String] = []
	for quiet_event: Dictionary in shell.sound_event_evidence().slice(quiet_start):
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
	shell.free()


func _peak_entry_index(shell: StorybookShell) -> int:
	var events := shell.sound_event_evidence()
	for index: int in events.size():
		var event: Dictionary = events[index]
		if (
			event.get("event") == "sound-event.place-entry"
			and event.get("context", {}).get("place") == "pellegrino-peak"
		):
			return index
	return events.size()


func _reach_pellegrino_peak(shell: StorybookShell) -> void:
	test.expect(shell.handle_player_intent("begin"), "the journey begins from the cover")
	for _moment: int in 2:
		shell.handle_player_action(KEYBOARD_SPACE, true)
		shell.handle_player_action(KEYBOARD_SPACE, false)
	shell.handle_player_action(KEYBOARD_SPACE, true)
	_advance_controlled(shell, 3.85)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	_advance_controlled(shell, 3.1)
	_advance_controlled(shell, 7.7)
	_advance_controlled(shell, 1.25)
	shell.handle_player_action(KEYBOARD_SPACE, true)
	_advance_controlled(shell, 9.0)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	test.expect(
		shell.handle_player_action(KEYBOARD_SPACE, true),
		"Gram's Birthday Star Moment continues onward",
	)
	shell.handle_player_action(KEYBOARD_SPACE, false)


func _advance_controlled(shell: StorybookShell, seconds: float) -> void:
	var frame_count := ceili(seconds * 60.0)
	for _frame: int in frame_count:
		shell.advance_simulation(1.0 / 60.0)
		shell.advance_journey(1.0 / 60.0)
