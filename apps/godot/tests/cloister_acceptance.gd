extends SceneTree

# The Cloister of Clouds is the journey's fourth place and the plainest proof that a
# place is data and media: it declares the same two rungs the Rose Garden and Lacewood
# declare, and everything that makes it the Cloister — its sunlit arches high, its soft
# clouds low, its ambience, its Playful Bump, Beasley — arrives from the Edition Pack.

const STORYBOOK_SHELL := preload("res://scripts/storybook_shell.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")
const DRIVER := preload("res://tests/place_journey_driver.gd")
const KEYBOARD_SPACE: StringName = &"keyboard.space"
const BETWEEN_THE_RUNGS_ALTITUDE := 0.54
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
	var both_heights: Dictionary = shell.presentation_evidence()
	test.expect(
		both_heights.get("observed_interactions") == ["sunlit-arches", "soft-clouds"],
		"settling low answers with the soft clouds on the same passage: %s"
		% JSON.stringify(both_heights.get("observed_interactions")),
	)
	test.expect(
		both_heights.get("journey_phase") == "place-flight"
		and both_heights.get("state") == "active_play"
		and both_heights.get("cloud_rests") == 0,
		"both heights ask nothing of the child but Flight Control: %s"
		% JSON.stringify(both_heights),
	)

	# The open sky between the arches and the clouds is quiet rather than wrong: a child
	# who lingers there keeps flying, keeps her Stars, and loses nothing she has awakened.
	# The most a soft cloud does to her is wobble her on the way past.
	DRIVER.hold_near(shell, BETWEEN_THE_RUNGS_ALTITUDE, 2.0)
	var between: Dictionary = shell.presentation_evidence()
	test.expect(
		between.get("journey_phase") == "place-flight"
		and between.get("state") == "active_play"
		and between.get("cloud_rests") == 0
		and between.get("observed_interactions") == ["sunlit-arches", "soft-clouds"],
		"flying between the arches and the clouds is quiet, never a mistake: %s"
		% JSON.stringify(between),
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

	# The journey continues out of the Cloister into the next place rather than stopping
	# inside it.
	DRIVER.turn_the_page(shell)
	test.expect(
		shell.presentation_evidence().get("state") == "active_play"
		and shell.presentation_evidence().get("place") == "pellegrino-peak",
		"turning the page carries the journey on out of the Cloister without interruption: %s"
		% JSON.stringify(shell.presentation_evidence()),
	)
	shell.free()


# A child who never climbs drifts into the soft clouds. They wobble her, three in quick
# succession bring the shared Cloud Rest, and the low passage still ends at the Star —
# so settling low is another way to fly the Cloister, not a worse one.
func _a_low_passage_rests_and_keeps_its_stars(shell: StorybookShell) -> void:
	shell.handle_player_action(KEYBOARD_SPACE, false)
	var wobbling: Dictionary = DRIVER.fly_low_until_playful_bumps(test, shell, "Cloister", 1)
	test.expect(
		wobbling.get("playful_bump_wobbling") == true
		and wobbling.get("state") == "active_play"
		and wobbling.get("journey_phase") == "place-flight",
		"a brushed soft cloud wobbles Stella without ending the journey: %s"
		% JSON.stringify(wobbling),
	)
	var resting: Dictionary = DRIVER.fly_low_until_playful_bumps(test, shell, "Cloister", 3)
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


# Reaches the Cloister the way a child reaches it: three places flown high, each turned
# by hand, with no seeded shell state.
func _fly_to_the_cloister() -> StorybookShell:
	var shell := STORYBOOK_SHELL.new()
	var pack_root := ProjectSettings.globalize_path(ACCEPTANCE_TEST.PACK_ROOT)
	test.expect(
		shell.prepare_launch(pack_root).get("ok") == true,
		"the Cloister journey prepares",
	)
	DRIVER.fly_to_place(shell, 3)
	var entry: Dictionary = shell.presentation_evidence()
	test.expect(
		entry.get("place") == "cloister"
		and entry.get("place_name") == "Cloister of Clouds"
		and entry.get("family_guest") == "Beasley"
		and entry.get("journey_phase") == "place-flight",
		"the journey crosses into the Cloister of Clouds: %s" % JSON.stringify(entry),
	)
	test.expect(
		DRIVER.place_entry_ambiences(shell) == ["rose-garden", "lacewood", "abbey", "cloister"],
		"entering the Cloister crossfades to its own ambience, one place at a time: %s"
		% JSON.stringify(DRIVER.place_entry_ambiences(shell)),
	)
	test.expect(
		entry.get("observed_interactions") == [],
		"the Cloister starts with neither its arches nor its clouds awakened",
	)
	return shell
