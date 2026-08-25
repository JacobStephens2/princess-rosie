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
	_a_low_passage_rests_and_keeps_its_stars(_fly_to_the_abbey())
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
		and rung_by_rung.get("cloud_rests") == 0,
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


# The bell ropes hang low. Brushing one wobbles Stella, and three in quick succession
# bring the same Cloud Rest every other place brings.
func _a_low_passage_rests_and_keeps_its_stars(shell: StorybookShell) -> void:
	shell.handle_player_action(KEYBOARD_SPACE, false)
	var wobbling: Dictionary = _fly_low_until_bumped(shell, 1)
	test.expect(
		wobbling.get("playful_bump_wobbling") == true
		and wobbling.get("state") == "active_play"
		and wobbling.get("journey_phase") == "place-flight",
		"a brushed bell rope wobbles Stella without ending the journey: %s"
		% JSON.stringify(wobbling),
	)
	var resting: Dictionary = _fly_low_until_bumped(shell, 3)
	test.expect(
		resting.get("journey_phase") == "cloud-rest",
		"three nearby bell ropes settle the child onto the shared Cloud Rest: %s"
		% JSON.stringify(resting),
	)
	test.expect(
		resting.get("birthday_stars") == [
			"birthday-star.rose-garden",
			"birthday-star.lacewood",
		],
		"the Cloud Rest keeps every Birthday Star gathered so far: %s"
		% JSON.stringify(resting.get("birthday_stars")),
	)
	shell.free()


# Flies the Abbey the way a child who never climbs flies it, stopping at the frame the
# named Playful Bump lands so the wobble can be seen while it is still happening.
func _fly_low_until_bumped(shell: StorybookShell, playful_bumps: int) -> Dictionary:
	for _frame: int in 900:
		shell.advance_simulation(1.0 / 60.0)
		shell.advance_journey(1.0 / 60.0)
		var evidence: Dictionary = shell.presentation_evidence()
		if int(evidence.get("playful_bumps", 0)) >= playful_bumps:
			return evidence
	test.expect(false, "the low Abbey passage meets %d Playful Bumps" % playful_bumps)
	return shell.presentation_evidence()


# Reaches the Abbey the way a child reaches it: two places flown high, each turned by
# hand, with no seeded shell state.
func _fly_to_the_abbey() -> StorybookShell:
	var shell := STORYBOOK_SHELL.new()
	var pack_root := ProjectSettings.globalize_path(ACCEPTANCE_TEST.PACK_ROOT)
	test.expect(shell.prepare_launch(pack_root).get("ok") == true, "the Abbey journey prepares")
	DRIVER.launch(shell)
	DRIVER.advance(shell, 0.75)
	for _place: int in 2:
		DRIVER.advance(shell, 24.0)
		DRIVER.turn_the_page(shell)
	var entry: Dictionary = shell.presentation_evidence()
	test.expect(
		entry.get("place") == "abbey"
		and entry.get("place_name") == "Golden Bell Abbey"
		and entry.get("family_guest") == "Pop"
		and entry.get("journey_phase") == "place-flight",
		"the journey crosses into Golden Bell Abbey: %s" % JSON.stringify(entry),
	)
	test.expect(
		_place_entry_ambiences(shell) == ["rose-garden", "lacewood", "abbey"],
		"entering the Abbey crossfades to its own ambience, one place at a time: %s"
		% JSON.stringify(_place_entry_ambiences(shell)),
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


func _place_entry_ambiences(shell: StorybookShell) -> Array:
	var places: Array = []
	for sound_event: Dictionary in shell.sound_event_evidence():
		if sound_event.get("event") == "sound-event.place-entry":
			places.append(sound_event.get("context", {}).get("place"))
	return places
