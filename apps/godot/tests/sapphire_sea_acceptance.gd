extends SceneTree

# The Sapphire Sea is the sparkling coastal passage before the Birthday Castle, and the
# sixth place to arrive as data and media alone. Its wave crests high, luminous coves low,
# coastal ambience, wave-crest Playful Bump, and Aunt all come from the Edition Pack; the
# shell and the place presentation module know none of them.

const STORYBOOK_SHELL := preload("res://scripts/storybook_shell.gd")
const STORYBOOK_SCENE := preload("res://scenes/storybook_shell.tscn")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")
const DRIVER := preload("res://tests/place_journey_driver.gd")
const KEYBOARD_SPACE: StringName = &"keyboard.space"
const AUNT_SENTENCE := (
	"Aunt followed the wave crests and luminous coves home across the Sapphire Sea!"
)
const SAPPHIRE_SEA_BACKGROUND := "source-media/sapphire-sea/sapphire-sea-background.png"
const AUNT_CUTOUT := "source-media/journey/family-guest-aunt.png"
const RAINBOW_PATH_TREATMENT := "source-media/journey/rainbow-path.png"
const WAVE_CRESTS_RESPONSE := "wave-crests-sparkle-wide"
const LUMINOUS_COVES_RESPONSE := "shore-coves-glow"
const BETWEEN_THE_RUNGS_ALTITUDE := 0.54

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	_run.call_deferred()


func _run() -> void:
	_the_coast_answers_both_heights(_fly_to_the_sapphire_sea())
	_a_low_passage_wobbles_and_keeps_its_stars(_fly_to_the_sapphire_sea())
	await _the_place_illustration_answers_at_both_heights()
	test.finish(self, "Sapphire Sea acceptance")


# Flying high meets the open water and its wave crests, settling low lights the shore
# coves, and the passage carries on to Aunt's Birthday Star either way.
func _the_coast_answers_both_heights(shell: StorybookShell) -> void:
	DRIVER.advance(shell, 3.1)
	test.expect(
		shell.presentation_evidence().get("observed_interactions")
		== ["open-water-wave-crests"],
		"flying high answers with the open water and its wave crests: %s"
		% JSON.stringify(shell.presentation_evidence().get("observed_interactions")),
	)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	DRIVER.advance(shell, 3.1)
	var both_heights: Dictionary = shell.presentation_evidence()
	test.expect(
		both_heights.get("observed_interactions")
		== ["open-water-wave-crests", "luminous-shore-coves"],
		"settling low answers with the luminous shore coves: %s"
		% JSON.stringify(both_heights.get("observed_interactions")),
	)
	test.expect(
		both_heights.get("journey_phase") == "place-flight"
		and both_heights.get("state") == "active_play"
		and not both_heights.has("cloud_rests"),
		"both heights ask nothing of the child but Flight Control: %s"
		% JSON.stringify(both_heights),
	)

	# The sparkling air between the crests and coves is quiet rather than wrong: a child
	# who lingers there keeps flying, keeps her Stars, and loses nothing she has awakened.
	DRIVER.hold_near(shell, BETWEEN_THE_RUNGS_ALTITUDE, 2.0)
	var between: Dictionary = shell.presentation_evidence()
	test.expect(
		between.get("journey_phase") == "place-flight"
		and between.get("state") == "active_play"
		and not between.has("cloud_rests")
		and between.get("observed_interactions")
		== ["open-water-wave-crests", "luminous-shore-coves"],
		"flying the coast between them is quiet, never a mistake: %s"
		% JSON.stringify(between),
	)

	# Climbing back over the open water carries Stella clear of the wave crests below.
	shell.handle_player_action(KEYBOARD_SPACE, true)
	DRIVER.advance(shell, 12.0)
	var moment: Dictionary = shell.presentation_evidence()
	test.expect(
		moment.get("state") == "birthday_star_moment"
		and moment.get("place") == "sapphire-sea"
		and moment.get("family_guest") == "Aunt"
		and moment.get("birthday_stars").has("birthday-star.sapphire-sea")
		and moment.get("rainbow_paths").has("rainbow-path.sapphire-sea"),
		"Aunt's Birthday Star is gathered and her Rainbow Path opens: %s"
		% JSON.stringify(moment),
	)
	test.expect(
		moment.get("birthday_star_moment") == AUNT_SENTENCE,
		"the Sapphire Sea Birthday Star Moment reads Aunt's own sentence: %s"
		% JSON.stringify(moment.get("birthday_star_moment")),
	)
	test.expect(
		moment.get("birthday_stars") == [
			"birthday-star.rose-garden",
			"birthday-star.lacewood",
			"birthday-star.abbey",
			"birthday-star.cloister",
			"birthday-star.pellegrino-peak",
			"birthday-star.sapphire-sea",
		],
		"the Sapphire Sea Star joins the five the child already carries: %s"
		% JSON.stringify(moment.get("birthday_stars")),
	)

	DRIVER.turn_the_page(shell)
	test.expect(
		shell.presentation_evidence().get("state") == "celebration",
		"turning the page carries the journey into the Birthday Castle without interruption",
	)
	shell.free()


# A child who never climbs brushes one wave crest. It wobbles Stella once, and the low
# passage still ends at the Star, so settling low is another delightful way to fly the
# Sapphire Sea rather than an inferior one.
func _a_low_passage_wobbles_and_keeps_its_stars(shell: StorybookShell) -> void:
	shell.handle_player_action(KEYBOARD_SPACE, false)
	var bumps_before: int = shell.presentation_evidence().get("playful_bumps", 0)
	var wobbling: Dictionary = DRIVER.fly_low_until_playful_bumps(
		test,
		shell,
		"Sapphire Sea",
		bumps_before + 1,
	)
	test.expect(
		wobbling.get("playful_bump_wobbling") == true
		and wobbling.get("state") == "active_play"
		and wobbling.get("journey_phase") == "place-flight",
		"a brushed wave crest wobbles Stella without ending the journey: %s"
		% JSON.stringify(wobbling),
	)
	DRIVER.advance(shell, 2.0)
	var still_flying: Dictionary = shell.presentation_evidence()
	test.expect(
		still_flying.get("playful_bumps") == bumps_before + 1
		and not still_flying.has("cloud_rests"),
		"drifting along the wave crests adds no second wobble and no Cloud Rest: %s"
		% JSON.stringify(still_flying),
	)
	test.expect(
		still_flying.get("birthday_stars") == [
			"birthday-star.rose-garden",
			"birthday-star.lacewood",
			"birthday-star.abbey",
			"birthday-star.cloister",
			"birthday-star.pellegrino-peak",
		],
		"the low passage keeps every Birthday Star gathered so far: %s"
		% JSON.stringify(still_flying.get("birthday_stars")),
	)
	shell.handle_player_action(KEYBOARD_SPACE, true)
	DRIVER.advance(shell, 24.0)
	var moment: Dictionary = shell.presentation_evidence()
	test.expect(
		moment.get("state") == "birthday_star_moment"
		and moment.get("birthday_stars").has("birthday-star.sapphire-sea"),
		"the low passage reaches Aunt's Birthday Star all the same: %s"
		% JSON.stringify(moment),
	)
	shell.free()


# What the child actually sees: the shared place presentation holds the Sapphire Sea's
# own painting and paints each data-declared response at the height she is holding.
func _the_place_illustration_answers_at_both_heights() -> void:
	var shell: StorybookShell = STORYBOOK_SCENE.instantiate()
	root.add_child(shell)
	await process_frame
	var pack_root := ProjectSettings.globalize_path(ACCEPTANCE_TEST.PACK_ROOT)
	test.expect(
		shell.prepare_launch(pack_root).get("ok") == true,
		"the painted Sapphire Sea passage prepares",
	)
	DRIVER.fly_to_place(shell, 5)
	DRIVER.advance(shell, 3.1)
	await process_frame
	var high: Dictionary = shell.storybook_stage_evidence()
	var high_composition: Dictionary = high.get("place_composition", {})
	test.expect(
		high.get("place_background_visible") == true
		and high_composition.get("place") == "sapphire-sea"
		and high_composition.get("tint") == "#c8ecff"
		and high_composition.get("place_tint_applied") == true,
		"the Sapphire Sea presents through the same module in its own coastal light: %s"
		% JSON.stringify(high_composition),
	)
	test.expect(
		high_composition.get("observed_visual_responses") == [WAVE_CRESTS_RESPONSE],
		"flying high paints the sparkling wave crests: %s"
		% JSON.stringify(high_composition.get("observed_visual_responses")),
	)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	DRIVER.advance(shell, 3.1)
	await process_frame
	var low_composition: Dictionary = (
		shell.storybook_stage_evidence().get("place_composition", {})
	)
	test.expect(
		low_composition.get("observed_visual_responses")
		== [WAVE_CRESTS_RESPONSE, LUMINOUS_COVES_RESPONSE],
		"settling low paints the luminous shore coves: %s"
		% JSON.stringify(low_composition.get("observed_visual_responses")),
	)
	shell.handle_player_action(KEYBOARD_SPACE, true)
	DRIVER.advance(shell, 12.0)
	await process_frame
	var moment: Dictionary = shell.storybook_stage_evidence().get(
		"birthday_star_moment_composition",
		{},
	)
	test.expect(
		moment.get("place_illustration") == SAPPHIRE_SEA_BACKGROUND
		and moment.get("place_illustration_dimmed") == true
		and moment.get("family_guest") == "Aunt"
		and moment.get("family_guest_cutout") == AUNT_CUTOUT
		and moment.get("family_guest_visible") == true
		and moment.get("rainbow_path_treatment") == RAINBOW_PATH_TREATMENT
		and moment.get("rainbow_path_visible") == true
		and moment.get("sentence") == AUNT_SENTENCE,
		"Aunt's moment visibly holds the Sapphire Sea, her cutout, Rainbow Path, and sentence: %s"
		% JSON.stringify(moment),
	)
	shell.queue_free()
	await process_frame


# Reaches the Sapphire Sea the way a child reaches it: five places flown high, each
# turned by hand, with no seeded shell state.
func _fly_to_the_sapphire_sea() -> StorybookShell:
	var shell := STORYBOOK_SHELL.new()
	var pack_root := ProjectSettings.globalize_path(ACCEPTANCE_TEST.PACK_ROOT)
	test.expect(
		shell.prepare_launch(pack_root).get("ok") == true,
		"the Sapphire Sea journey prepares",
	)
	DRIVER.fly_to_place(shell, 5)
	var entry: Dictionary = shell.presentation_evidence()
	test.expect(
		entry.get("place") == "sapphire-sea"
		and entry.get("place_name") == "Sapphire Sea"
		and entry.get("family_guest") == "Aunt"
		and entry.get("journey_phase") == "place-flight",
		"the journey crosses into the Sapphire Sea: %s" % JSON.stringify(entry),
	)
	test.expect(
		DRIVER.place_entry_ambiences(shell) == [
			"rose-garden",
			"lacewood",
			"abbey",
			"cloister",
			"pellegrino-peak",
			"sapphire-sea",
		],
		"entering the Sapphire Sea crossfades to its own ambience, one place at a time: %s"
		% JSON.stringify(DRIVER.place_entry_ambiences(shell)),
	)
	test.expect(
		entry.get("observed_interactions") == [],
		"the Sapphire Sea starts with neither its wave crests nor its coves awakened",
	)
	return shell
