extends SceneTree

# Pellegrino Peak is the high flowered mountain passage above the coast, and the fifth
# place to arrive as data and media alone. Its flower-petal updrafts high, its flowered
# slopes low, its wide cool ambience, its flower bank, and Uncle all come from the
# Edition Pack; the shell and the place presentation module know none of them.

const STORYBOOK_SHELL := preload("res://scripts/storybook_shell.gd")
const STORYBOOK_SCENE := preload("res://scenes/storybook_shell.tscn")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")
const DRIVER := preload("res://tests/place_journey_driver.gd")
const KEYBOARD_SPACE: StringName = &"keyboard.space"
const UNCLE_SENTENCE := (
	"Uncle followed the flower-petal updrafts and the mountain flowers"
	+ " down from Pellegrino Peak!"
)
const BLOSSOMING_TRAIL := "petals-lift-and-blossom-a-trail"
const BETWEEN_THE_RUNGS_ALTITUDE := 0.54

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	_run.call_deferred()


func _run() -> void:
	_the_mountain_answers_both_heights(_fly_to_the_peak())
	_a_low_passage_wobbles_and_keeps_its_stars(_fly_to_the_peak())
	await _the_updrafts_paint_a_blossoming_trail()
	test.finish(self, "Pellegrino Peak acceptance")


# Flying high rides the flower-petal updrafts, settling low opens the mountain's lower
# flowered slopes, and the passage carries on to Uncle's Birthday Star either way.
func _the_mountain_answers_both_heights(shell: StorybookShell) -> void:
	DRIVER.advance(shell, 3.1)
	test.expect(
		shell.presentation_evidence().get("observed_interactions") == ["flower-petal-updraft"],
		"flying high rides the flower-petal updrafts: %s"
		% JSON.stringify(shell.presentation_evidence().get("observed_interactions")),
	)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	DRIVER.advance(shell, 3.1)
	var both_heights: Dictionary = shell.presentation_evidence()
	test.expect(
		both_heights.get("observed_interactions")
		== ["flower-petal-updraft", "mountain-flowers"],
		"settling low answers with the mountain's lower flowered slopes: %s"
		% JSON.stringify(both_heights.get("observed_interactions")),
	)
	test.expect(
		both_heights.get("journey_phase") == "place-flight"
		and both_heights.get("state") == "active_play"
		and not both_heights.has("cloud_rests"),
		"both heights ask nothing of the child but Flight Control: %s"
		% JSON.stringify(both_heights),
	)

	# The wide cool air between the updrafts and the slopes is quiet rather than wrong: a
	# child who lingers there keeps flying, keeps her Stars, and loses nothing she has
	# awakened. The most a flower bank does to her is wobble her on the way past.
	DRIVER.hold_near(shell, BETWEEN_THE_RUNGS_ALTITUDE, 2.0)
	var between: Dictionary = shell.presentation_evidence()
	test.expect(
		between.get("journey_phase") == "place-flight"
		and between.get("state") == "active_play"
		and not between.has("cloud_rests")
		and between.get("observed_interactions")
		== ["flower-petal-updraft", "mountain-flowers"],
		"flying the open mountain air between them is quiet, never a mistake: %s"
		% JSON.stringify(between),
	)

	# Climbing back into the updrafts carries her clear of the flower banks below.
	shell.handle_player_action(KEYBOARD_SPACE, true)
	DRIVER.advance(shell, 12.0)
	var moment: Dictionary = shell.presentation_evidence()
	test.expect(
		moment.get("state") == "birthday_star_moment"
		and moment.get("place") == "pellegrino-peak"
		and moment.get("family_guest") == "Uncle"
		and moment.get("birthday_stars").has("birthday-star.pellegrino-peak")
		and moment.get("rainbow_paths").has("rainbow-path.pellegrino-peak"),
		"Uncle's Birthday Star is gathered and his Rainbow Path opens: %s"
		% JSON.stringify(moment),
	)
	test.expect(
		moment.get("birthday_star_moment") == UNCLE_SENTENCE,
		"the Peak's Birthday Star Moment reads Uncle's own sentence: %s"
		% JSON.stringify(moment.get("birthday_star_moment")),
	)
	test.expect(
		moment.get("birthday_stars") == [
			"birthday-star.rose-garden",
			"birthday-star.lacewood",
			"birthday-star.abbey",
			"birthday-star.cloister",
			"birthday-star.pellegrino-peak",
		],
		"the Peak's Star joins the four the child already carries: %s"
		% JSON.stringify(moment.get("birthday_stars")),
	)

	# The journey continues out of the Peak into the next place rather than stopping
	# inside it.
	DRIVER.turn_the_page(shell)
	test.expect(
		shell.presentation_evidence().get("state") == "active_play"
		and shell.presentation_evidence().get("place") == "sapphire-sea",
		"turning the page carries the journey on out of the Peak without interruption: %s"
		% JSON.stringify(shell.presentation_evidence()),
	)
	shell.free()


# A child who never climbs drifts down onto the mountain's flower banks. They wobble her
# once, and the low passage still ends at the Star — so settling low is another way to
# fly the Peak, not a worse one. This is the passage #75 was reported against.
func _a_low_passage_wobbles_and_keeps_its_stars(shell: StorybookShell) -> void:
	shell.handle_player_action(KEYBOARD_SPACE, false)
	var bumps_before: int = shell.presentation_evidence().get("playful_bumps", 0)
	var wobbling: Dictionary = DRIVER.fly_low_until_playful_bumps(
		test,
		shell,
		"Peak",
		bumps_before + 1,
	)
	test.expect(
		wobbling.get("playful_bump_wobbling") == true
		and wobbling.get("state") == "active_play"
		and wobbling.get("journey_phase") == "place-flight",
		"a brushed flower bank wobbles Stella without ending the journey: %s"
		% JSON.stringify(wobbling),
	)
	DRIVER.advance(shell, 2.0)
	var still_flying: Dictionary = shell.presentation_evidence()
	test.expect(
		still_flying.get("playful_bumps") == bumps_before + 1
		and not still_flying.has("cloud_rests"),
		"drifting along the flower banks adds no second wobble and no Cloud Rest: %s"
		% JSON.stringify(still_flying),
	)
	test.expect(
		still_flying.get("birthday_stars") == [
			"birthday-star.rose-garden",
			"birthday-star.lacewood",
			"birthday-star.abbey",
			"birthday-star.cloister",
		],
		"the low passage keeps every Birthday Star gathered so far: %s"
		% JSON.stringify(still_flying.get("birthday_stars")),
	)
	shell.handle_player_action(KEYBOARD_SPACE, true)
	DRIVER.advance(shell, 24.0)
	var moment: Dictionary = shell.presentation_evidence()
	test.expect(
		moment.get("state") == "birthday_star_moment"
		and moment.get("birthday_stars").has("birthday-star.pellegrino-peak"),
		"the low passage reaches Uncle's Birthday Star all the same: %s"
		% JSON.stringify(moment),
	)
	shell.free()


# What the child actually sees of the updrafts: the place presentation module paints
# the Peak's own blossoming trail as the response to the height she is holding.
func _the_updrafts_paint_a_blossoming_trail() -> void:
	var shell: StorybookShell = STORYBOOK_SCENE.instantiate()
	root.add_child(shell)
	await process_frame
	var pack_root := ProjectSettings.globalize_path(ACCEPTANCE_TEST.PACK_ROOT)
	test.expect(
		shell.prepare_launch(pack_root).get("ok") == true,
		"the painted Peak passage prepares",
	)
	DRIVER.fly_to_place(shell, 4)
	DRIVER.advance(shell, 3.1)
	await process_frame
	var composition: Dictionary = shell.storybook_stage_evidence().get("place_composition", {})
	test.expect(
		composition.get("place") == "pellegrino-peak"
		and composition.get("tint") == "#ffe0c2"
		and composition.get("place_tint_applied") == true,
		"the Peak presents through the same module in its own mountain light: %s"
		% JSON.stringify(composition),
	)
	test.expect(
		composition.get("observed_visual_responses") == [BLOSSOMING_TRAIL],
		"riding the updrafts paints the Peak's blossoming trail: %s"
		% JSON.stringify(composition.get("observed_visual_responses")),
	)
	shell.queue_free()
	await process_frame


# Reaches the Peak the way a child reaches it: four places flown high, each turned by
# hand, with no seeded shell state.
func _fly_to_the_peak() -> StorybookShell:
	var shell := STORYBOOK_SHELL.new()
	var pack_root := ProjectSettings.globalize_path(ACCEPTANCE_TEST.PACK_ROOT)
	test.expect(
		shell.prepare_launch(pack_root).get("ok") == true,
		"the Peak journey prepares",
	)
	DRIVER.fly_to_place(shell, 4)
	var entry: Dictionary = shell.presentation_evidence()
	test.expect(
		entry.get("place") == "pellegrino-peak"
		and entry.get("place_name") == "Pellegrino Peak"
		and entry.get("family_guest") == "Uncle"
		and entry.get("journey_phase") == "place-flight",
		"the journey crosses into Pellegrino Peak: %s" % JSON.stringify(entry),
	)
	test.expect(
		DRIVER.place_entry_ambiences(shell)
		== ["rose-garden", "lacewood", "abbey", "cloister", "pellegrino-peak"],
		"entering the Peak crossfades to its own ambience, one place at a time: %s"
		% JSON.stringify(DRIVER.place_entry_ambiences(shell)),
	)
	test.expect(
		entry.get("observed_interactions") == [],
		"the Peak starts with neither its updrafts nor its flowers awakened",
	)
	return shell
