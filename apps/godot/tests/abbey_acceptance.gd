extends SceneTree

# Golden Bell Abbey is the first place whose delight is finer-grained than high-or-low:
# its four approved bells hang at four heights, and the child rings them by flying
# there. Nothing in the shell knows that; the Abbey declares four rungs of its altitude
# ladder where the Rose Garden and Lacewood declare two.

const STORYBOOK_SHELL := preload("res://scripts/storybook_shell.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")
const DRIVER := preload("res://tests/place_journey_driver.gd")
const KEYBOARD_SPACE: StringName = &"keyboard.space"
const BELLS := [
	"golden-bell-note-high",
	"golden-bell-note-middle",
	"golden-bell-note-low",
	"golden-bell-settle",
]

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	_bells_follow_the_child(_fly_to_the_abbey())
	_a_low_passage_wobbles_and_keeps_its_stars(_fly_to_the_abbey())
	test.finish(self, "Golden Bell Abbey acceptance")


# Every height rings something, and the higher the child flies the higher the bell.
func _bells_follow_the_child(shell: StorybookShell) -> void:
	DRIVER.advance(shell, 2.4)
	test.expect(
		shell.presentation_evidence().get("observed_interactions")
		== ["golden-bell-note-high"],
		"climbing to the bell tower rings the highest golden bell: %s"
		% JSON.stringify(shell.presentation_evidence().get("observed_interactions")),
	)
	DRIVER.hold_near(shell, 0.6, 2.2)
	DRIVER.hold_near(shell, 0.43, 1.8)
	DRIVER.hold_near(shell, 0.25, 1.8)
	var rung_by_rung: Dictionary = shell.presentation_evidence()
	test.expect(
		rung_by_rung.get("observed_interactions") == BELLS,
		"settling rung by rung rings each lower bell in turn: %s"
		% JSON.stringify(rung_by_rung.get("observed_interactions")),
	)
	var cues := _bell_cues(shell)
	test.expect(
		_first_rings(cues) == BELLS,
		"the four approved bell cues first sound in the order the child reached them: %s"
		% JSON.stringify(cues),
	)
	# Guiding Stella back up a rung rings that rung's bell again, so the Abbey answers
	# the child's hand for as long as she keeps moving rather than falling silent once
	# each bell has been found.
	test.expect(
		cues.size() > BELLS.size(),
		"a bell already found rings again when the child returns to its height: %s"
		% JSON.stringify(cues),
	)
	# Eight and a bit seconds of flying, and an authored rest of nine tenths of a second
	# between answers: hovering on a seam cannot turn the bells into a per-frame rattle.
	test.expect(
		cues.size() <= 10,
		"the bells rest between rings rather than chattering: %s" % JSON.stringify(cues),
	)
	test.expect(
		rung_by_rung.get("journey_phase") == "place-flight"
		and rung_by_rung.get("state") == "active_play"
		and not rung_by_rung.has("cloud_rests"),
		"ringing every bell asks nothing of the child but Flight Control: %s"
		% JSON.stringify(rung_by_rung),
	)

	# Climbing back to the tower carries her clear of the swinging bell ropes below.
	shell.handle_player_action(KEYBOARD_SPACE, true)
	DRIVER.advance(shell, 12.0)
	var moment: Dictionary = shell.presentation_evidence()
	test.expect(
		moment.get("state") == "birthday_star_moment"
		and moment.get("place") == "abbey"
		and moment.get("family_guest") == "Pop"
		and moment.get("birthday_stars").has("birthday-star.abbey")
		and moment.get("rainbow_paths").has("rainbow-path.abbey"),
		"Pop's Birthday Star is gathered and his Rainbow Path opens: %s"
		% JSON.stringify(moment),
	)
	test.expect(
		moment.get("birthday_star_moment")
		== "Pop followed the golden bells ringing out of Golden Bell Abbey!",
		"the Abbey's Birthday Star Moment reads Pop's own sentence",
	)
	test.expect(
		moment.get("birthday_stars") == [
			"birthday-star.rose-garden",
			"birthday-star.lacewood",
			"birthday-star.abbey",
		],
		"the Abbey's Star joins the two the child already carries: %s"
		% JSON.stringify(moment.get("birthday_stars")),
	)

	# The journey continues out of the Abbey into the next place rather than stopping
	# inside it.
	DRIVER.turn_the_page(shell)
	test.expect(
		shell.presentation_evidence().get("state") == "active_play"
		and shell.presentation_evidence().get("place") == "cloister",
		"turning the page carries the journey on out of the Abbey without interruption: %s"
		% JSON.stringify(shell.presentation_evidence()),
	)
	shell.free()


# The bell ropes hang low. Brushing one wobbles Stella and nothing follows from it. The
# Abbey is also the place ADR-0013's invariant exists for: its settle bell is the lowest
# rung in the Edition, and the child has to be able to ring it without meeting the floor.
func _a_low_passage_wobbles_and_keeps_its_stars(shell: StorybookShell) -> void:
	var contact := float(
		shell.flight_evidence().get("playful_bump_contact_altitude_stage_heights", 0.0),
	)
	# Near the top of the settle bell's window, which the invariant guarantees is clear
	# of the floor even after the bang-bang way a child holds a height.
	var bumps_before: int = shell.presentation_evidence().get("playful_bumps", 0)
	DRIVER.hold_near(shell, contact + (0.34 - contact) * 0.8, 3.0)
	var settled: Dictionary = shell.presentation_evidence()
	test.expect(
		settled.get("observed_interactions").has("golden-bell-settle")
		and settled.get("playful_bumps") == bumps_before,
		"the settle bell rings from a height clear of the Bump Floor: %s"
		% JSON.stringify(settled),
	)

	shell.handle_player_action(KEYBOARD_SPACE, false)
	var wobbling: Dictionary = DRIVER.fly_low_until_playful_bumps(
		test,
		shell,
		"Abbey",
		bumps_before + 1,
	)
	test.expect(
		wobbling.get("playful_bump_wobbling") == true
		and wobbling.get("state") == "active_play"
		and wobbling.get("journey_phase") == "place-flight",
		"a brushed bell rope wobbles Stella without ending the journey: %s"
		% JSON.stringify(wobbling),
	)
	DRIVER.advance(shell, 2.0)
	var still_flying: Dictionary = shell.presentation_evidence()
	test.expect(
		still_flying.get("playful_bumps") == bumps_before + 1
		and not still_flying.has("cloud_rests"),
		"staying down among the bell ropes adds no second wobble and no Cloud Rest: %s"
		% JSON.stringify(still_flying),
	)
	test.expect(
		still_flying.get("birthday_stars") == [
			"birthday-star.rose-garden",
			"birthday-star.lacewood",
		],
		"the low passage keeps every Birthday Star gathered so far: %s"
		% JSON.stringify(still_flying.get("birthday_stars")),
	)
	shell.free()


# Reaches the Abbey the way a child reaches it: two places flown high, each turned by
# hand, with no seeded shell state.
func _fly_to_the_abbey() -> StorybookShell:
	var shell := STORYBOOK_SHELL.new()
	var pack_root := ProjectSettings.globalize_path(ACCEPTANCE_TEST.PACK_ROOT)
	test.expect(shell.prepare_launch(pack_root).get("ok") == true, "the Abbey journey prepares")
	DRIVER.fly_to_place(shell, 2)
	var entry: Dictionary = shell.presentation_evidence()
	test.expect(
		entry.get("place") == "abbey"
		and entry.get("place_name") == "Golden Bell Abbey"
		and entry.get("family_guest") == "Pop"
		and entry.get("journey_phase") == "place-flight",
		"the journey crosses into Golden Bell Abbey: %s" % JSON.stringify(entry),
	)
	test.expect(
		DRIVER.place_entry_ambiences(shell) == ["rose-garden", "lacewood", "abbey"],
		"entering the Abbey crossfades to its own ambience, one place at a time: %s"
		% JSON.stringify(DRIVER.place_entry_ambiences(shell)),
	)
	test.expect(
		entry.get("observed_interactions") == [],
		"the Abbey starts with none of its bells rung",
	)
	return shell


# The bells in the order they were first reached, so the order of heights is readable
# through the repeats.
func _first_rings(cues: Array) -> Array:
	var first: Array = []
	for cue: Variant in cues:
		if not first.has(cue):
			first.append(cue)
	return first


func _bell_cues(shell: StorybookShell) -> Array:
	var cues: Array = []
	for sound_event: Dictionary in shell.sound_event_evidence():
		var context: Dictionary = sound_event.get("context", {})
		if (
			sound_event.get("event") == "sound-event.vignette-interaction"
			and context.get("place") == "abbey"
		):
			cues.append(context.get("interaction"))
	return cues
