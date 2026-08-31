extends SceneTree

# A scattered Birthday Star notices Stella nearby and joyfully flies to her. Gathering
# happens on arrival, never on a timer, and Flight Control stays live while it travels.
# Six Stars scatter; Dad keeps the Castle Star safe at the Birthday Castle.

const STORYBOOK_SCENE := preload("res://scenes/storybook_shell.tscn")
const EDITION_PACK_ADAPTER := preload("res://scripts/edition_pack_adapter.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")
const DRIVER := preload("res://tests/place_journey_driver.gd")
const KEYBOARD_SPACE: StringName = &"keyboard.space"
const STAR_REST := Vector2(1064.0, 298.0)

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	_run.call_deferred()


func _run() -> void:
	_opening_tells_the_six_and_the_castle_star()
	await _a_star_flies_to_stella_and_gathers_on_arrival()
	await _the_same_attraction_gathers_the_next_place()
	await _a_low_flight_cannot_miss_the_star()
	await _the_sixth_star_settles_longer_and_the_castle_star_waits()
	test.finish(self, "birthday star flight acceptance")


func _opening_tells_the_six_and_the_castle_star() -> void:
	var adapter := EDITION_PACK_ADAPTER.new()
	var pack_root := ProjectSettings.globalize_path(ACCEPTANCE_TEST.PACK_ROOT)
	var prepared: Dictionary = adapter.prepare(pack_root)
	var content: Dictionary = adapter.load_content(pack_root, prepared).get("value", {})
	var scattered: Dictionary = {}
	for moment_value: Variant in content.get("openingMoments", []):
		if moment_value is Dictionary and moment_value.get("id") == "opening.scattered-stars":
			scattered = moment_value
	var copy := str(scattered.get("copy", "")).to_lower()
	test.expect(
		copy.contains("six")
		and copy.contains("dad")
		and copy.contains("castle star"),
		"the opening copy names six scattered Stars and Dad's Castle Star: %s"
		% scattered.get("copy", ""),
	)
	var checkpoint: Dictionary = scattered.get("semanticCheckpoint", {})
	test.expect(
		int(checkpoint.get("scatteredBirthdayStarCount", 0)) == 6
		and str(checkpoint.get("castleStarKeeper", "")) == "Dad",
		"the opening checkpoint distinguishes the six scattered Stars from Dad's Castle Star: %s"
		% JSON.stringify(checkpoint),
	)
	var celebration: Dictionary = content.get("celebration", {})
	test.expect(
		int(celebration.get("returningRainbowPathCount", 0)) == 6
		and str(celebration.get("castleStar", "")) == "birthday-star.castle"
		and str(celebration.get("castleStarKeeper", "")) == "Dad",
		"the celebration names six returning Paths and Dad's Castle Star: %s"
		% JSON.stringify(celebration),
	)

	var shell: StorybookShell = STORYBOOK_SCENE.instantiate()
	root.add_child(shell)
	await process_frame
	shell.prepare_launch(pack_root)
	DRIVER.launch(shell)
	var recorded: Dictionary = shell.presentation_evidence().get(
		"observed_opening_checkpoints",
		[],
	)[1]
	var recorded_facts: Dictionary = recorded.get("facts", {})
	test.expect(
		recorded.get("moment") == "opening.scattered-stars"
		and int(recorded_facts.get("scatteredBirthdayStarCount", 0)) == 6
		and str(recorded_facts.get("castleStarKeeper", "")) == "Dad",
		"the journey records the six scattered Stars and Dad's Castle Star: %s"
		% JSON.stringify(shell.presentation_evidence().get("observed_opening_checkpoints")),
	)
	shell.queue_free()
	await process_frame


func _a_star_flies_to_stella_and_gathers_on_arrival() -> void:
	var shell := await _prepared_scene()
	DRIVER.launch(shell)
	await _fly_to_star_approach(shell)
	var start: Dictionary = _star_approach(shell)
	test.expect(
		start.get("birthday_star_visible") == true
		and start.get("attracted") == true
		and start.get("arrived") == false
		and start.get("flying_to_stella") == true
		and start.get("rainbow_path_visible") == false,
		"the Star notices Stella and begins flying toward her before it is gathered: %s"
		% JSON.stringify(start),
	)
	test.expect(
		shell.presentation_evidence().get("birthday_stars") == [],
		"the gather waits for arrival rather than firing as soon as the Star is near",
	)
	test.expect(
		_last_sound_event(shell, "sound-event.birthday-star-proximity").get("context", {})
		== {"birthdayStar": "birthday-star.rose-garden"}
		and _events_named(shell, "sound-event.birthday-star-gathered").is_empty(),
		"proximity sounds when the Star notices Stella, and the gather cue waits",
	)

	var altitude_before := float(shell.flight_evidence().get("altitude_stage_heights", 0.0))
	shell.handle_player_action(KEYBOARD_SPACE, false)
	DRIVER.advance(shell, 0.35)
	var mid_flight: Dictionary = _star_approach(shell)
	var star_mid: Vector2 = mid_flight.get("star_center", STAR_REST)
	var stella_mid: Vector2 = mid_flight.get("stella_center", Vector2.ZERO)
	test.expect(
		star_mid.distance_to(STAR_REST) > 24.0
		and star_mid.distance_to(stella_mid) < STAR_REST.distance_to(stella_mid),
		"the Star leaves its rest and travels toward the moving Stella: %s"
		% JSON.stringify(mid_flight),
	)
	test.expect(
		float(shell.flight_evidence().get("altitude_stage_heights", altitude_before))
		< altitude_before
		and shell.presentation_evidence().get("state") == "active_play"
		and shell.presentation_evidence().get("journey_phase") == "birthday-star-approach"
		and shell.presentation_evidence().get("birthday_stars") == [],
		"hold and release still steer Stella while the Star is on its way: %s"
		% JSON.stringify(shell.flight_evidence()),
	)

	await _wait_until_gathered(shell, "birthday-star.rose-garden")
	var arrived: Dictionary = _star_approach(shell)
	test.expect(
		arrived.get("arrived") == true
		and arrived.get("star_center").distance_to(arrived.get("stella_center")) <= 64.0
		and shell.presentation_evidence().get("birthday_stars")
		== ["birthday-star.rose-garden"]
		and _last_sound_event(shell, "sound-event.birthday-star-gathered").get("context", {})
		== {"birthdayStar": "birthday-star.rose-garden"},
		"the Star is gathered only once it has reached Stella: %s" % JSON.stringify(arrived),
	)
	test.expect(
		_event_ids_since_proximity(shell, "birthday-star.rose-garden").slice(0, 2)
		== [
			"sound-event.birthday-star-proximity",
			"sound-event.birthday-star-gathered",
		],
		"arrival is what fires the gather, not the approach itself",
	)

	DRIVER.advance(shell, 1.5)
	await process_frame
	test.expect(
		_star_approach(shell).get("rainbow_path_visible") == true
		and _last_sound_event(shell, "sound-event.rainbow-path-opened").get("context", {})
		== {"familyGuest": "Mom", "rainbowPath": "rainbow-path.rose-garden"},
		"the existing Rainbow Path treatment opens after the gather",
	)
	DRIVER.advance(shell, 2.6)
	await process_frame
	test.expect(
		shell.presentation_evidence().get("state") == "birthday_star_moment"
		and _event_ids_since_proximity(shell, "birthday-star.rose-garden")
		== [
			"sound-event.birthday-star-proximity",
			"sound-event.birthday-star-gathered",
			"sound-event.rainbow-path-opened",
			"sound-event.birthday-star-moment",
		],
		"the Birthday Star Moment follows the gather and the open Path, in that order",
	)
	shell.queue_free()
	await process_frame


func _the_same_attraction_gathers_the_next_place() -> void:
	var shell := await _prepared_scene()
	DRIVER.launch(shell)
	await _fly_to_star_approach(shell)
	await _wait_until_gathered(shell, "birthday-star.rose-garden")
	DRIVER.advance(shell, 4.2)
	DRIVER.turn_the_page(shell)
	await _fly_to_star_approach(shell)
	var lacewood: Dictionary = _star_approach(shell)
	test.expect(
		lacewood.get("attracted") == true
		and lacewood.get("flying_to_stella") == true
		and lacewood.get("family_guest") == "Gram"
		and shell.presentation_evidence().get("place") == "lacewood",
		"every Place uses the same attraction rule, with no per-place branch: %s"
		% JSON.stringify(lacewood),
	)
	await _wait_until_gathered(shell, "birthday-star.lacewood")
	test.expect(
		shell.presentation_evidence().get("birthday_stars")
		== ["birthday-star.rose-garden", "birthday-star.lacewood"],
		"the second Star gathers on arrival the same way the first did",
	)
	shell.queue_free()
	await process_frame


func _a_low_flight_cannot_miss_the_star() -> void:
	var shell := await _prepared_scene()
	DRIVER.launch(shell)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	await _fly_to_star_approach(shell)
	var floor_altitude := float(
		shell.flight_evidence().get("minimum_altitude_stage_heights", 0.0),
	)
	test.expect(
		float(shell.flight_evidence().get("altitude_stage_heights", 1.0))
		<= floor_altitude + 0.08
		and _star_approach(shell).get("attracted") == true
		and shell.presentation_evidence().get("birthday_stars") == [],
		"a Star still notices Stella on the Bump Floor, so the child cannot miss it: %s"
		% JSON.stringify(shell.flight_evidence()),
	)
	await _wait_until_gathered(shell, "birthday-star.rose-garden")
	test.expect(
		shell.presentation_evidence().get("birthday_stars") == ["birthday-star.rose-garden"],
		"the Star reaches Stella even when she never climbs",
	)
	shell.queue_free()
	await process_frame


func _the_sixth_star_settles_longer_and_the_castle_star_waits() -> void:
	var shell := await _prepared_scene()
	DRIVER.launch(shell)
	await _fly_to_star_approach(shell)
	await _wait_until_gathered(shell, "birthday-star.rose-garden")
	var first_glow: Dictionary = _star_approach(shell)
	test.expect(
		first_glow.get("settling_glow") == true
		and first_glow.get("final_recovered") == false,
		"an ordinary recovered Star shines a shared settling glow: %s"
		% JSON.stringify(first_glow),
	)
	DRIVER.advance(shell, 1.55)
	test.expect(
		not _star_approach(shell).get("settling_glow", true),
		"the shared glow has settled before the Rainbow Path opens on an ordinary Star",
	)

	for _place: int in 5:
		DRIVER.advance(shell, 4.2)
		DRIVER.turn_the_page(shell)
		await _fly_to_star_approach(shell)
		await _wait_until_gathered(shell, "")

	test.expect(
		shell.presentation_evidence().get("birthday_stars").size() == 6
		and shell.presentation_evidence().get("place") == "sapphire-sea",
		"the sixth recovered Star is the Sapphire Sea's: %s"
		% JSON.stringify(shell.presentation_evidence().get("birthday_stars")),
	)
	var sixth: Dictionary = _star_approach(shell)
	test.expect(
		sixth.get("final_recovered") == true
		and sixth.get("settling_glow") == true
		and sixth.get("flying_to_stella") == false,
		"the last recovered Star uses the shared flight and a longer settling glow: %s"
		% JSON.stringify(sixth),
	)
	DRIVER.advance(shell, 1.55)
	test.expect(
		_star_approach(shell).get("settling_glow") == true,
		"the final cadence keeps the sixth Star glowing after an ordinary glow would have ended",
	)

	DRIVER.advance(shell, 4.2)
	DRIVER.turn_the_page(shell)
	await process_frame
	var approach_stage: Dictionary = shell.storybook_stage_evidence()
	test.expect(
		shell.presentation_evidence().get("journey_phase") == "birthday-castle-approach"
		and approach_stage.get("birthday_castle_approach", {}).get("rainbow_path_count") == 6
		and approach_stage.get("celebration_stars", {}).get("castle_star_visible") == true
		and int(approach_stage.get("celebration_stars", {}).get("united_star_count", 0)) == 1,
		"six returning Rainbow Paths accompany Dad's already-shining Castle Star: %s"
		% JSON.stringify({
			"approach": approach_stage.get("birthday_castle_approach"),
			"stars": approach_stage.get("celebration_stars"),
		}),
	)
	DRIVER.advance(shell, 5.2)
	await process_frame
	var celebration_stage: Dictionary = shell.storybook_stage_evidence()
	test.expect(
		shell.presentation_evidence().get("state") == "celebration"
		and celebration_stage.get("celebration_stars", {}).get("castle_star_visible") == true
		and int(celebration_stage.get("celebration_stars", {}).get("gathered_star_count", 0))
		== 6
		and int(celebration_stage.get("celebration_stars", {}).get("united_star_count", 0))
		== 7
		and celebration_stage.get("celebration_stars", {}).get("constellation") == true,
		"the six recovered Stars join the Castle Star in a visible seven-Star constellation: %s"
		% JSON.stringify(celebration_stage.get("celebration_stars")),
	)

	shell.handle_player_action(KEYBOARD_SPACE, false)
	test.expect(
		shell.handle_player_action(KEYBOARD_SPACE, true),
		"the celebration answers a fresh press to fly again",
	)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	test.expect(
		shell.presentation_evidence().get("place") == "rose-garden"
		and shell.presentation_evidence().get("birthday_stars") == []
		and shell.presentation_evidence().get("rainbow_paths") == []
		and int(
			shell.storybook_stage_evidence().get("celebration_stars", {}).get(
				"united_star_count",
				-1,
			),
		)
		== 0,
		"Fly Again leaves every scattered Star to be found again",
	)
	shell.queue_free()
	await process_frame


func _prepared_scene() -> StorybookShell:
	var shell: StorybookShell = STORYBOOK_SCENE.instantiate()
	root.add_child(shell)
	await process_frame
	var pack_root := ProjectSettings.globalize_path(ACCEPTANCE_TEST.PACK_ROOT)
	test.expect(
		shell.prepare_launch(pack_root).get("ok") == true,
		"the Birthday Star journey prepares from the current Edition Pack",
	)
	return shell


func _fly_to_star_approach(shell: StorybookShell) -> void:
	for _step: int in 240:
		if shell.presentation_evidence().get("journey_phase") == "birthday-star-approach":
			break
		DRIVER.advance(shell, 0.2)
	await process_frame


func _wait_until_gathered(shell: StorybookShell, birthday_star: String) -> void:
	var gathered_before: int = shell.presentation_evidence().get("birthday_stars", []).size()
	for _step: int in 180:
		var stars: Array = shell.presentation_evidence().get("birthday_stars", [])
		var arrived: bool = _star_approach(shell).get("arrived") == true
		var named_star_arrived: bool = (
			not birthday_star.is_empty() and stars.has(birthday_star) and arrived
		)
		var next_star_arrived: bool = (
			birthday_star.is_empty() and stars.size() > gathered_before and arrived
		)
		if named_star_arrived or next_star_arrived:
			await process_frame
			return
		DRIVER.advance(shell, 0.05)
	await process_frame


func _star_approach(shell: StorybookShell) -> Dictionary:
	return shell.storybook_stage_evidence().get("birthday_star_approach", {})


func _last_sound_event(shell: StorybookShell, event_id: String) -> Dictionary:
	var found: Dictionary = {}
	for event_value: Variant in shell.sound_event_evidence():
		if event_value is Dictionary and event_value.get("event") == event_id:
			found = event_value
	return found


func _events_named(shell: StorybookShell, event_id: String) -> Array[Dictionary]:
	var matches: Array[Dictionary] = []
	for sound_event: Dictionary in shell.sound_event_evidence():
		if sound_event.get("event") == event_id:
			matches.append(sound_event)
	return matches


func _event_ids_since_proximity(shell: StorybookShell, birthday_star: String) -> Array[String]:
	var event_ids: Array[String] = []
	var recording := false
	for sound_event: Dictionary in shell.sound_event_evidence():
		var event_id := str(sound_event.get("event", ""))
		var context: Dictionary = sound_event.get("context", {})
		if (
			event_id == "sound-event.birthday-star-proximity"
			and str(context.get("birthdayStar", "")) == birthday_star
		):
			recording = true
		if not recording:
			continue
		if event_id in [
			"sound-event.birthday-star-proximity",
			"sound-event.birthday-star-gathered",
			"sound-event.rainbow-path-opened",
			"sound-event.birthday-star-moment",
		]:
			event_ids.append(event_id)
		if event_id == "sound-event.birthday-star-moment":
			break
	return event_ids
