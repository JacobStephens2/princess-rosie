extends SceneTree

# The journey ends at the Birthday Castle, on the celebration the family already knows
# from the Phaser Edition. One authored ending, reached the same way every journey, with
# Fly Again as the only thing left to press.

const STORYBOOK_SCENE := preload("res://scenes/storybook_shell.tscn")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")
const DRIVER := preload("res://tests/place_journey_driver.gd")
const KEYBOARD_SPACE: StringName = &"keyboard.space"
const CELEBRATION_ILLUSTRATION := "source-media/celebration/birthday-castle-celebration.png"

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
	_fly_to_the_castle(shell)
	await process_frame
	test.expect(
		shell.presentation_evidence().get("state") == "celebration"
		and shell.presentation_evidence().get("journey_phase") == "celebration",
		"the journey arrives at the Birthday Castle: %s"
		% JSON.stringify(shell.presentation_evidence().get("state")),
	)

	var stage := shell.storybook_stage_evidence()
	test.expect(
		stage.get("celebration_illustration") == CELEBRATION_ILLUSTRATION
		and stage.get("celebration_illustration_visible") == true,
		"the celebration shows the approved Birthday Castle illustration: %s"
		% JSON.stringify(stage.get("celebration_illustration")),
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
		and flying_again.get("cloud_rests") == 0
		and flying_again.get("playful_bumps") == 0
		and flying_again.get("observed_interactions") == [],
		"the fresh journey starts with every Birthday Star still to be found: %s"
		% JSON.stringify(flying_again),
	)
	test.expect(
		shell.storybook_stage_evidence().get("celebration_illustration_visible") == false,
		"the Birthday Castle gives way to the first place again",
	)

	# The ending is authored, not a reflection of the journey: flying it again arrives
	# at exactly the same celebration.
	_fly_to_the_castle(shell)
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


# Flies every realized place through to its Birthday Star Moment and turns the page,
# however many places the Edition Pack currently carries.
func _fly_to_the_castle(shell: StorybookShell) -> void:
	var declared_places: int = shell.presentation_evidence().get("places", []).size()
	for _place: int in declared_places + 1:
		if shell.presentation_evidence().get("state") == "celebration":
			return
		for _step: int in 200:
			if shell.presentation_evidence().get("state") == "birthday_star_moment":
				break
			DRIVER.advance(shell, 0.2)
		DRIVER.turn_the_page(shell)
		shell.handle_player_action(KEYBOARD_SPACE, false)
