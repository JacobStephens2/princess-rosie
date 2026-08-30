extends SceneTree

# The journey ends at the Birthday Castle, on the celebration the family already knows
# from the Phaser Edition. One authored ending, reached the same way every journey, with
# Fly Again as the only thing left to press.

const STORYBOOK_SCENE := preload("res://scenes/storybook_shell.tscn")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")
const DRIVER := preload("res://tests/place_journey_driver.gd")
const KEYBOARD_SPACE: StringName = &"keyboard.space"
const CELEBRATION_ILLUSTRATION := "source-media/celebration/birthday-castle-celebration.png"
const RETURNING_RAINBOW_PATH_COUNT := 7

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	_run.call_deferred()


func _run() -> void:
	var shell: StorybookShell = STORYBOOK_SCENE.instantiate()
	root.add_child(shell)
	await process_frame
	var pack_root := ProjectSettings.globalize_path(ACCEPTANCE_TEST.PACK_ROOT)
	test.expect(
		shell.prepare_launch(pack_root).get("ok") == true,
		"the celebration journey prepares from the current Edition Pack",
	)
	test.expect(
		shell.presentation_evidence().get("celebration_actions") == ["fly-again"],
		"Fly Again is the only thing the ending offers: %s"
		% JSON.stringify(shell.presentation_evidence().get("celebration_actions")),
	)

	DRIVER.launch(shell)
	_fly_to_castle_approach(shell)
	await process_frame
	var approach: Dictionary = shell.presentation_evidence()
	var approach_stage: Dictionary = shell.storybook_stage_evidence()
	test.expect(
		approach.get("state") == "active_play"
		and approach.get("journey_phase") == "birthday-castle-approach",
		"the final Storybook Moment turns into the Birthday Castle approach: %s"
		% JSON.stringify(approach),
	)
	test.expect(
		approach_stage.get("birthday_castle_approach", {}).get("visible") == true
		and (
			approach_stage.get("birthday_castle_approach", {}).get("rainbow_path_count")
			== RETURNING_RAINBOW_PATH_COUNT
		)
		and approach_stage.get("birthday_castle_approach", {}).get("converging") == true,
		"all seven returning Rainbow Paths visibly converge beside Princess Rosie: %s"
		% JSON.stringify(approach_stage.get("birthday_castle_approach")),
	)
	test.expect(
		approach_stage.get("flight_character_visible") == true
		and approach_stage.get("celebration_illustration_visible") == false,
		"Princess Rosie flies the last stretch before the party is revealed",
	)
	var approach_character_center: Vector2 = approach_stage.get(
		"flight_character_center",
		Vector2.ZERO,
	)
	var approach_character_scale: Vector2 = approach_stage.get(
		"flight_character_scale",
		Vector2.ZERO,
	)
	test.expect(
		approach_character_center.x < 450.0
		and is_equal_approx(approach_character_scale.x, 0.65),
		"the rendered frame keeps Rosie at the start of the Castle approach: %s"
		% JSON.stringify({
			"center": approach_character_center,
			"scale": approach_character_scale,
		}),
	)
	test.expect(
		_events_named(shell, "sound-event.birthday-castle-arrival").is_empty(),
		"the arrival fanfare waits until the paths have converged",
	)

	DRIVER.advance(shell, 10.0)
	await process_frame
	test.expect(
		shell.presentation_evidence().get("state") == "celebration"
		and shell.presentation_evidence().get("journey_phase") == "celebration",
		"the journey arrives at the Birthday Castle: %s"
		% JSON.stringify(shell.presentation_evidence().get("state")),
	)
	test.expect(
		_events_named(shell, "sound-event.birthday-castle-arrival").size() == 1,
		"arrival emits one authored fanfare event",
	)

	var stage := shell.storybook_stage_evidence()
	test.expect(
		stage.get("celebration_illustration") == CELEBRATION_ILLUSTRATION
		and stage.get("celebration_illustration_visible") == true,
		"the celebration shows the approved Birthday Castle illustration: %s"
		% JSON.stringify(stage.get("celebration_illustration")),
	)
	var celebration: Dictionary = shell.presentation_evidence()
	test.expect(
		celebration.get("celebration_hosts") == ["Princess Zélie", "Gigi"]
		and celebration.get("celebration_family_guests") == [
			"Mom",
			"Dad",
			"Pop",
			"Gram",
			"Aunt",
			"Uncle",
			"Beasley",
		],
		"Princess Zélie, Gigi, and every Family Guest including Dad await Rosie: %s"
		% JSON.stringify(celebration.get("celebration_family_guests")),
	)
	test.expect(
		stage.get("place_background_visible") == false
		and stage.get("flight_background_visible") == false,
		"the last place gives way to the Birthday Castle rather than lingering behind it",
	)
	test.expect(
		stage.get("essential_content_cropped") == false,
		"the celebration keeps every essential element inside the Storybook Stage",
	)
	# The painting already holds Rosie, Stella, and every guest, so nothing is drawn
	# over it — a second flying Stella above the one in the picture is not a celebration.
	test.expect(
		stage.get("flight_character_visible") == false
		and stage.get("place_composition", {}).get("atmospheric_motion") == false,
		"the authored ending is not overdrawn by the flight presentation: %s"
		% JSON.stringify(stage.get("place_composition")),
	)

	var instruction := str(shell.presentation_evidence().get("flight_instruction", ""))
	test.expect(
		instruction.to_lower().contains("fly again")
		and not instruction.to_lower().contains("dance"),
		"the ending invites the child to fly again and never to dance again: %s" % instruction,
	)

	# Fly Again begins the whole journey afresh, rather than resuming where it ended.
	var sound_events_before_fly_again := shell.sound_event_evidence().size()
	test.expect(
		shell.handle_player_action(KEYBOARD_SPACE, true),
		"the celebration answers a press",
	)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	var flying_again: Dictionary = shell.presentation_evidence()
	test.expect(
		flying_again.get("state") == "active_play"
		and flying_again.get("journey_phase") == "place-flight"
		and flying_again.get("place") == "rose-garden",
		"Fly Again returns to a playable journey in the first place: %s"
		% JSON.stringify(flying_again.get("state")),
	)
	test.expect(
		flying_again.get("birthday_stars") == []
		and flying_again.get("rainbow_paths") == []
		and not flying_again.has("cloud_rests")
		and flying_again.get("playful_bumps") == 0
		and flying_again.get("near_misses") == 0
		and flying_again.get("observed_interactions") == [],
		"the fresh journey starts with every Birthday Star still to be found: %s"
		% JSON.stringify(flying_again),
	)
	var fly_again_audio_events := shell.sound_event_evidence().slice(
		sound_events_before_fly_again,
	)
	test.expect(
		_event_ids(fly_again_audio_events).slice(0, 4) == [
			"sound-event.celebration-interaction",
			"sound-event.replay",
			"sound-event.place-entry",
			"sound-event.movement-state",
		]
		and fly_again_audio_events[1].get("context", {}).get("destination")
		== "fresh-journey",
		"Fly Again resets arrival audio before Rose Garden sound starts: %s"
		% JSON.stringify(fly_again_audio_events),
	)
	test.expect(
		shell.storybook_stage_evidence().get("celebration_illustration_visible") == false,
		"the Birthday Castle gives way to the first place again",
	)

	# The ending is authored, not a reflection of the journey: flying it again arrives
	# at exactly the same celebration.
	_fly_to_castle_approach(shell)
	DRIVER.advance(shell, 10.0)
	await process_frame
	test.expect(
		shell.presentation_evidence().get("state") == "celebration"
		and shell.storybook_stage_evidence().get("celebration_illustration")
		== CELEBRATION_ILLUSTRATION,
		"a second journey reaches the identical authored ending",
	)

	shell.queue_free()
	await process_frame
	test.finish(self, "celebration acceptance")


# Flies every realized place through to its Birthday Star Moment and turns the page into
# the last stretch beside the returning Rainbow Paths.
func _fly_to_castle_approach(shell: StorybookShell) -> void:
	var declared_places: int = shell.presentation_evidence().get("places", []).size()
	for _place: int in declared_places:
		for _step: int in 200:
			if shell.presentation_evidence().get("state") == "birthday_star_moment":
				break
			DRIVER.advance(shell, 0.2)
		DRIVER.turn_the_page(shell)
		shell.handle_player_action(KEYBOARD_SPACE, false)


func _events_named(shell: StorybookShell, event_id: String) -> Array[Dictionary]:
	var matches: Array[Dictionary] = []
	for sound_event: Dictionary in shell.sound_event_evidence():
		if sound_event.get("event") == event_id:
			matches.append(sound_event)
	return matches


func _event_ids(sound_events: Array) -> Array[String]:
	var event_ids: Array[String] = []
	for sound_event: Dictionary in sound_events:
		event_ids.append(str(sound_event.get("event", "")))
	return event_ids
