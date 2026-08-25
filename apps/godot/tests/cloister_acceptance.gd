extends SceneTree

# The Cloister of Clouds is the journey's fourth place and the plainest proof that a
# place is data and media: it declares the same two rungs the Rose Garden and Lacewood
# declare, and everything that makes it the Cloister — its sunlit arches high, its soft
# clouds low, its ambience, its Playful Bump, Beasley — arrives from the Edition Pack.

const STORYBOOK_SHELL := preload("res://scripts/storybook_shell.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")
const DRIVER := preload("res://tests/place_journey_driver.gd")
const KEYBOARD_SPACE: StringName = &"keyboard.space"
const BEASLEY_SENTENCE := (
	"Beasley followed the sunlit arches and the soft clouds through the Cloister of Clouds!"
)

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	_the_sky_answers_both_heights(_fly_to_the_cloister())
	_a_low_passage_rests_and_keeps_its_stars(_fly_to_the_cloister())
	test.finish(self, "Cloister of Clouds acceptance")


# Flying high catches the arches, settling low parts the clouds, and the passage carries
# on to Beasley's Birthday Star either way.
func _the_sky_answers_both_heights(shell: StorybookShell) -> void:
	DRIVER.advance(shell, 3.1)
	test.expect(
		shell.presentation_evidence().get("observed_interactions") == ["sunlit-arches"],
		"flying high answers with the sunlit arches: %s"
		% JSON.stringify(shell.presentation_evidence().get("observed_interactions")),
	)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	DRIVER.advance(shell, 3.1)
	var both: Dictionary = shell.presentation_evidence()
	test.expect(
		both.get("observed_interactions") == ["sunlit-arches", "soft-clouds"],
		"settling low answers with the soft clouds on the same passage: %s"
		% JSON.stringify(both.get("observed_interactions")),
	)
	test.expect(
		both.get("journey_phase") == "place-flight"
		and both.get("state") == "active_play"
		and both.get("cloud_rests") == 0,
		"both heights ask nothing of the child but Flight Control: %s" % JSON.stringify(both),
	)

	# Climbing back into the arches carries her clear of the drifting clouds below.
	shell.handle_player_action(KEYBOARD_SPACE, true)
	DRIVER.advance(shell, 12.0)
	var moment: Dictionary = shell.presentation_evidence()
	test.expect(
		moment.get("state") == "birthday_star_moment"
		and moment.get("place") == "cloister"
		and moment.get("family_guest") == "Beasley"
		and moment.get("birthday_stars").has("birthday-star.cloister")
		and moment.get("rainbow_paths").has("rainbow-path.cloister"),
		"Beasley's Birthday Star is gathered and his Rainbow Path opens: %s"
		% JSON.stringify(moment),
	)
	test.expect(
		moment.get("birthday_star_moment") == BEASLEY_SENTENCE,
		"the Cloister's Birthday Star Moment reads Beasley's own sentence: %s"
		% JSON.stringify(moment.get("birthday_star_moment")),
	)
	test.expect(
		moment.get("birthday_stars") == [
			"birthday-star.rose-garden",
			"birthday-star.lacewood",
			"birthday-star.abbey",
			"birthday-star.cloister",
		],
		"the Cloister's Star joins the three the child already carries: %s"
		% JSON.stringify(moment.get("birthday_stars")),
	)

	# The Cloister is the last place carrying an approved Place Illustration, so the
	# journey continues out of it rather than stopping inside it.
	DRIVER.turn_the_page(shell)
	test.expect(
		shell.presentation_evidence().get("state") == "celebration",
		"turning the page carries the journey on out of the Cloister without interruption",
	)
	shell.free()


# A child who never climbs drifts into the soft clouds. They wobble her, three in quick
# succession bring the shared Cloud Rest, and the low passage still ends at the Star —
# so settling low is another way to fly the Cloister, not a worse one.
func _a_low_passage_rests_and_keeps_its_stars(shell: StorybookShell) -> void:
	shell.handle_player_action(KEYBOARD_SPACE, false)
	var wobbling: Dictionary = _fly_low_until_bumped(shell, 1)
	test.expect(
		wobbling.get("playful_bump_wobbling") == true
		and wobbling.get("state") == "active_play"
		and wobbling.get("journey_phase") == "place-flight",
		"a brushed soft cloud wobbles Stella without ending the journey: %s"
		% JSON.stringify(wobbling),
	)
	var resting: Dictionary = _fly_low_until_bumped(shell, 3)
	test.expect(
		resting.get("journey_phase") == "cloud-rest",
		"three nearby soft clouds settle the child onto the shared Cloud Rest: %s"
		% JSON.stringify(resting),
	)
	test.expect(
		resting.get("birthday_stars") == [
			"birthday-star.rose-garden",
			"birthday-star.lacewood",
			"birthday-star.abbey",
		],
		"the Cloud Rest keeps every Birthday Star gathered so far: %s"
		% JSON.stringify(resting.get("birthday_stars")),
	)
	shell.handle_player_action(KEYBOARD_SPACE, true)
	DRIVER.advance(shell, 24.0)
	var moment: Dictionary = shell.presentation_evidence()
	test.expect(
		moment.get("state") == "birthday_star_moment"
		and moment.get("birthday_stars").has("birthday-star.cloister"),
		"the rested passage reaches Beasley's Birthday Star all the same: %s"
		% JSON.stringify(moment),
	)
	shell.free()


# Flies the Cloister the way a child who never climbs flies it, stopping at the frame the
# named Playful Bump lands so the wobble can be seen while it is still happening.
func _fly_low_until_bumped(shell: StorybookShell, playful_bumps: int) -> Dictionary:
	for _frame: int in 900:
		shell.advance_simulation(1.0 / 60.0)
		shell.advance_journey(1.0 / 60.0)
		var evidence: Dictionary = shell.presentation_evidence()
		if int(evidence.get("playful_bumps", 0)) >= playful_bumps:
			return evidence
	test.expect(false, "the low Cloister passage meets %d Playful Bumps" % playful_bumps)
	return shell.presentation_evidence()


# Reaches the Cloister the way a child reaches it: three places flown high, each turned
# by hand, with no seeded shell state.
func _fly_to_the_cloister() -> StorybookShell:
	var shell := STORYBOOK_SHELL.new()
	var pack_root := ProjectSettings.globalize_path(ACCEPTANCE_TEST.PACK_ROOT)
	test.expect(
		shell.prepare_launch(pack_root).get("ok") == true,
		"the Cloister journey prepares",
	)
	DRIVER.launch(shell)
	DRIVER.advance(shell, 0.75)
	for _place: int in 3:
		DRIVER.advance(shell, 24.0)
		DRIVER.turn_the_page(shell)
	var entry: Dictionary = shell.presentation_evidence()
	test.expect(
		entry.get("place") == "cloister"
		and entry.get("place_name") == "Cloister of Clouds"
		and entry.get("family_guest") == "Beasley"
		and entry.get("journey_phase") == "place-flight",
		"the journey crosses into the Cloister of Clouds: %s" % JSON.stringify(entry),
	)
	test.expect(
		_place_entry_ambiences(shell) == ["rose-garden", "lacewood", "abbey", "cloister"],
		"entering the Cloister crossfades to its own ambience, one place at a time: %s"
		% JSON.stringify(_place_entry_ambiences(shell)),
	)
	test.expect(
		entry.get("observed_interactions") == [],
		"the Cloister starts with neither its arches nor its clouds awakened",
	)
	return shell


func _place_entry_ambiences(shell: StorybookShell) -> Array:
	var places: Array = []
	for sound_event: Dictionary in shell.sound_event_evidence():
		if sound_event.get("event") == "sound-event.place-entry":
			places.append(sound_event.get("context", {}).get("place"))
	return places
