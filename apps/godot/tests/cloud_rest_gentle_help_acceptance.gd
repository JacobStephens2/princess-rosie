extends SceneTree

const STORYBOOK_SCENE := preload("res://scenes/storybook_shell.tscn")
const STORYBOOK_SHELL := preload("res://scripts/storybook_shell.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")
const DRIVER := preload("res://tests/place_journey_driver.gd")
const KEYBOARD_SPACE: StringName = &"keyboard.space"
const CHILD_FACING_LABELS := ["%FlightTitle", "%FlightInstruction"]
const HELP_WORDS := ["level", "difficulty", "easy", "easier", "assist", "mode", "1", "2", "3"]
const HIGH_BAND_ALTITUDE_MINIMUM := 0.56
const LOW_BAND_ALTITUDE_MAXIMUM := 0.52

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	_run.call_deferred()


func _run() -> void:
	_prove_playful_bumps_stay_playful()
	_prove_isolated_bumps_age_out()
	_prove_one_cycle_preserves_everything()
	_prove_both_help_levels_arrive_quietly()
	_prove_every_help_level_reaches_the_whole_route()
	await _prove_cloud_rest_lands_stella_on_a_visible_cloud()
	test.finish(self, "Cloud Rest gentle help acceptance")


func _prove_playful_bumps_stay_playful() -> void:
	var shell := _start_bumpable_flight()
	_advance_controlled(shell, 8.6)
	var before: Dictionary = shell.presentation_evidence()
	_advance_controlled(shell, 1.0)
	var bumped: Dictionary = shell.presentation_evidence()
	test.expect(
		bumped.get("playful_bumps") == 1 and bumped.get("playful_bump_wobbling") == true,
		"a Playful Bump answers with a soft wobble",
	)
	test.expect(
		bumped.get("state") == "active_play"
		and bumped.get("journey_phase") == "place-flight"
		and float(bumped.get("place_progress", 0.0))
		> float(before.get("place_progress", 0.0))
		and bumped.get("birthday_stars") == before.get("birthday_stars")
		and bumped.get("observed_interactions") == before.get("observed_interactions"),
		"the wobble costs no progress, no Birthday Star, and no forward motion",
	)
	test.expect(
		shell.cloud_rest_evidence().get("progress_lost") == false
		and bumped.get("cloud_rests") == 0,
		"a lone Playful Bump costs nothing and calls for no rest",
	)
	shell.free()


func _prove_isolated_bumps_age_out() -> void:
	var shell := _start_bumpable_flight()
	# Low through the first low-lacework brush, high over the second, low again for the third.
	_advance_controlled(shell, 9.6)
	test.expect(
		shell.presentation_evidence().get("nearby_playful_bumps") == 1,
		"one lone Playful Bump waits for a companion",
	)
	shell.handle_player_action(KEYBOARD_SPACE, true)
	_advance_controlled(shell, 3.0)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	test.expect(
		shell.presentation_evidence().get("nearby_playful_bumps") == 0,
		"the lone Playful Bump ages out instead of accumulating forever",
	)
	_advance_controlled(shell, 1.6)
	var late: Dictionary = shell.presentation_evidence()
	test.expect(
		late.get("playful_bumps") == 2
		and late.get("nearby_playful_bumps") == 1
		and late.get("cloud_rests") == 0
		and late.get("journey_phase") == "place-flight",
		"two Playful Bumps far apart never add up to a Cloud Rest: %s" % JSON.stringify(late),
	)
	shell.free()


func _prove_one_cycle_preserves_everything() -> void:
	var shell := _start_bumpable_flight()
	_advance_controlled(shell, 13.4)
	var before_rest: Dictionary = shell.presentation_evidence()
	var route_before_rest: Dictionary = shell.presentation_evidence()
	_advance_controlled(shell, 0.7)
	var resting: Dictionary = shell.presentation_evidence()
	test.expect(
		resting.get("journey_phase") == "cloud-rest"
		and resting.get("cloud_rests") == 1
		and resting.get("nearby_playful_bumps") == 0,
		"three nearby Playful Bumps reach exactly one Cloud Rest: %s" % JSON.stringify(resting),
	)
	test.expect(
		before_rest.get("nearby_playful_bumps") == 2,
		"two nearby Playful Bumps are not enough on their own",
	)

	test.expect(
		shell.sound_event_evidence().back() == {
			"event": "sound-event.cloud-rest-entered",
			"context": {},
		},
		"Cloud Rest calls for the approved reassuring cue: %s"
		% JSON.stringify(shell.sound_event_evidence().back()),
	)
	var altitude_before_landing := float(
		shell.cloud_rest_evidence().get("resume_altitude_stage_heights", -1.0),
	)
	_advance_controlled(shell, 0.6)
	test.expect(
		shell.cloud_rest_evidence().get("stella_landed_safely") == true,
		"Cloud Rest settles Stella onto her resting height: %s"
		% JSON.stringify(shell.cloud_rest_evidence()),
	)

	_advance_controlled(shell, 0.7)
	var resumed: Dictionary = shell.presentation_evidence()
	var route_after_rest: Dictionary = shell.presentation_evidence()
	test.expect(
		resumed.get("journey_phase") == "place-flight"
		and resumed.get("state") == "active_play"
		and resumed.get("movement_state") == "flight",
		"Cloud Rest resumes the same place's presentation and movement nearby",
	)
	test.expect(
		is_equal_approx(
			float(shell.flight_evidence().get("altitude_stage_heights", 0.0)),
			altitude_before_landing,
		),
		"the cloud lifts Stella back to the height she left",
	)
	test.expect(
		not route_before_rest.get("observed_interactions", []).is_empty(),
		"the place's details answered before the rest, so preserving them means something",
	)
	test.expect(
		resumed.get("birthday_stars") == before_rest.get("birthday_stars")
		and resumed.get("rainbow_paths") == before_rest.get("rainbow_paths")
		and route_after_rest.get("observed_interactions")
		== route_before_rest.get("observed_interactions")
		and route_after_rest.get("place") == route_before_rest.get("place")
		and float(route_after_rest.get("place_progress", 0.0))
		>= float(route_before_rest.get("place_progress", 0.0)),
		"Birthday Stars, Rainbow Paths, and active place progress survive unchanged",
	)
	test.expect(
		resumed.get("nearby_playful_bumps") == 0
		and resumed.get("playful_bump_wobbling") == false
		and shell.cloud_rest_evidence().get("progress_lost") == false,
		"resume leaves no stale Playful Bump state and no lost progress behind",
	)

	var resume_events := _sound_events_after(shell, "sound-event.cloud-rest-exited")
	test.expect(
		resume_events == [
			{"event": "sound-event.movement-state", "context": {"state": "flight"}},
		],
		"resume restarts one movement layer and no duplicate place loop: %s"
		% JSON.stringify(resume_events),
	)
	shell.free()


func _prove_both_help_levels_arrive_quietly() -> void:
	var shell := _start_bumpable_flight()
	var unhelped: Dictionary = shell.gentle_help_evidence()
	test.expect(
		unhelped.get("help_level") == 0 and unhelped.get("maximum_help_level") == 2,
		"the journey starts with no hidden help",
	)

	_advance_controlled(shell, 14.2)
	var helped_once: Dictionary = shell.gentle_help_evidence()
	test.expect(
		shell.presentation_evidence().get("cloud_rests") == 1
		and helped_once.get("help_level") == 1,
		"the first Cloud Rest adds one hidden level",
	)
	_expect_gentler(unhelped, helped_once, "the first Cloud Rest")

	# Staying low through the rest of the low lacework reaches the second Cloud Rest.
	_advance_controlled(shell, 5.2)
	var helped_twice: Dictionary = shell.gentle_help_evidence()
	test.expect(
		shell.presentation_evidence().get("cloud_rests") == 2
		and helped_twice.get("help_level") == 2,
		"the second Cloud Rest adds the last hidden level: %s"
		% JSON.stringify(shell.presentation_evidence()),
	)
	_expect_gentler(helped_once, helped_twice, "the second Cloud Rest")
	test.expect(
		helped_twice.get("help_level") == helped_twice.get("maximum_help_level"),
		"hidden help stops at two levels",
	)
	shell.free()


func _prove_every_help_level_reaches_the_whole_route() -> void:
	_prove_route_reachable_after_cloud_rests(1, 0.0)
	_prove_route_reachable_after_cloud_rests(2, 5.2)


# Every hidden level must leave both altitude bands and the whole route in reach.
func _prove_route_reachable_after_cloud_rests(
	expected_help_level: int,
	extra_low_seconds: float,
) -> void:
	var shell := _start_bumpable_flight()
	shell.handle_player_action(KEYBOARD_SPACE, true)
	_advance_controlled(shell, 3.4)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	_advance_controlled(shell, 10.8 + extra_low_seconds)
	var help: Dictionary = shell.gentle_help_evidence()
	test.expect(
		shell.presentation_evidence().get("cloud_rests") == expected_help_level
		and help.get("help_level") == expected_help_level,
		"help level %d is reached by resting after nearby Playful Bumps: %s"
		% [expected_help_level, JSON.stringify(shell.presentation_evidence())],
	)
	test.expect(
		str(help.get("visible_help_label", "missing")).is_empty(),
		"help level %d shows the child no label" % expected_help_level,
	)
	test.expect(
		shell.presentation_evidence().get("observed_interactions")
		== ["silver-ribbons", "rose-lights"],
		"both place heights answered before help level %d" % expected_help_level,
	)

	_advance_past_cloud_rest(shell)
	shell.handle_player_action(KEYBOARD_SPACE, true)
	_advance_controlled(shell, 1.6)
	test.expect(
		float(shell.flight_evidence().get("altitude_stage_heights", 0.0))
		>= HIGH_BAND_ALTITUDE_MINIMUM,
		"the high band height stays in reach at help level %d" % expected_help_level,
	)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	_advance_controlled(shell, 1.6)
	test.expect(
		float(shell.flight_evidence().get("altitude_stage_heights", 1.0))
		<= LOW_BAND_ALTITUDE_MAXIMUM,
		"the low band height stays in reach at help level %d" % expected_help_level,
	)

	shell.handle_player_action(KEYBOARD_SPACE, true)
	_advance_controlled(shell, 30.0)
	var finished: Dictionary = shell.presentation_evidence()
	test.expect(
		finished.get("state") == "birthday_star_moment"
		and finished.get("birthday_stars")
		== ["birthday-star.rose-garden", "birthday-star.lacewood"]
		and finished.get("rainbow_paths")
		== ["rainbow-path.rose-garden", "rainbow-path.lacewood"]
		and finished.get("gentle_help", {}).get("help_level") == expected_help_level,
		"help level %d still completes the whole route to the guaranteed Birthday Star: %s"
		% [expected_help_level, JSON.stringify(finished)],
	)
	shell.free()


func _prove_cloud_rest_lands_stella_on_a_visible_cloud() -> void:
	var shell: StorybookShell = STORYBOOK_SCENE.instantiate()
	root.add_child(shell)
	await process_frame
	var pack_root := ProjectSettings.globalize_path("res://../../shared/edition")
	shell.prepare_launch(pack_root)
	DRIVER.launch(shell)
	_advance_controlled(shell, 0.75)
	DRIVER.cross_into_next_place(shell)
	_advance_controlled(shell, 8.8)
	while shell.presentation_evidence().get("playful_bumps") == 0:
		_advance_controlled(shell, 1.0 / 60.0)
	await process_frame
	test.expect(
		shell.storybook_stage_evidence()
			.get("place_composition", {})
			.get("playful_bump_wobble_visible") == true,
		"a Playful Bump is visible as a soft wobble on the Storybook Stage",
	)

	while shell.presentation_evidence().get("journey_phase") != "cloud-rest":
		_advance_controlled(shell, 1.0 / 60.0)
	_advance_controlled(shell, 0.6)
	await process_frame
	var stage := shell.storybook_stage_evidence()
	test.expect(
		stage.get("place_composition", {}).get("resting_cloud_visible") == true
		and stage.get("essential_content_cropped") == false
		and stage.get("flight_character_visible") == true,
		"Cloud Rest shows Stella safe on a cloud inside the Storybook Stage: %s"
		% JSON.stringify(stage),
	)
	for label_path: String in CHILD_FACING_LABELS:
		var label := shell.get_node(label_path) as Label
		var text := label.text.to_lower()
		for help_word: String in HELP_WORDS:
			test.expect(
				not text.contains(help_word),
				"%s never shows the child \"%s\": %s" % [label_path, help_word, label.text],
			)

	shell.queue_free()
	await process_frame


func _expect_gentler(before: Dictionary, after: Dictionary, occasion: String) -> void:
	test.expect(
		float(after.get("route_duration_seconds", 0.0))
		> float(before.get("route_duration_seconds", 0.0))
		and float(after.get("forward_speed_stage_widths_per_second", 0.0))
		< float(before.get("forward_speed_stage_widths_per_second", 0.0)),
		"%s makes travel slower" % occasion,
	)
	test.expect(
		float(after.get("rise_acceleration_stage_heights_per_second_squared", 0.0))
		< float(before.get("rise_acceleration_stage_heights_per_second_squared", 0.0))
		and absf(float(after.get("glide_acceleration_stage_heights_per_second_squared", 0.0)))
		< absf(float(before.get("glide_acceleration_stage_heights_per_second_squared", 0.0))),
		"%s softens acceleration" % occasion,
	)
	test.expect(
		float(after.get("safe_corridor_altitude_stage_heights", 0.0))
		> float(before.get("safe_corridor_altitude_stage_heights", 0.0)),
		"%s widens the safe corridor" % occasion,
	)
	test.expect(
		float(after.get("collision_half_height_stage_heights", 1.0))
		< float(before.get("collision_half_height_stage_heights", 1.0))
		and float(after.get("playful_bump_contact_altitude_stage_heights", 1.0))
		< float(before.get("playful_bump_contact_altitude_stage_heights", 1.0)),
		"%s forgives more of Stella's shape" % occasion,
	)


func _advance_past_cloud_rest(shell: StorybookShell) -> void:
	while shell.presentation_evidence().get("journey_phase") == "cloud-rest":
		_advance_controlled(shell, 1.0 / 60.0)


func _sound_events_after(shell: StorybookShell, event_id: String) -> Array:
	var events := shell.sound_event_evidence()
	for index: int in range(events.size() - 1, -1, -1):
		if events[index].get("event") == event_id:
			return events.slice(index + 1)
	return []


# Cloud Rest needs a place whose Playful Bump is switched on, so every proof here flies
# the bump-free first place and turns the page into the second one.
func _start_bumpable_flight() -> StorybookShell:
	var shell := STORYBOOK_SHELL.new()
	var pack_root := ProjectSettings.globalize_path("res://../../shared/edition")
	test.expect(
		shell.prepare_launch(pack_root).get("ok") == true,
		"the gentle help journey prepares",
	)
	DRIVER.launch(shell)
	_advance_controlled(shell, 0.75)
	DRIVER.cross_into_next_place(shell)
	test.expect(
		shell.presentation_evidence().get("place") == "lacewood"
		and shell.presentation_evidence().get("playful_bumps_suppressed") == false,
		"the gentle help journey reaches a place that can bump the child",
	)
	return shell


func _advance_controlled(shell: StorybookShell, seconds: float) -> void:
	var frame_count := ceili(seconds * 60.0)
	for _frame: int in frame_count:
		shell.advance_simulation(1.0 / 60.0)
		shell.advance_journey(1.0 / 60.0)
