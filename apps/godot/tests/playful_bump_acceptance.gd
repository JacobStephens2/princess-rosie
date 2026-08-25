extends SceneTree

# ADR-0013 leaves a Playful Bump a lone wobble. Nothing accumulates, nothing follows
# from meeting several, and there is one game mode: nothing about the flight changes
# because of anything that happened earlier in the journey.

const STORYBOOK_SHELL := preload("res://scripts/storybook_shell.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")
const DRIVER := preload("res://tests/place_journey_driver.gd")
const KEYBOARD_SPACE: StringName = &"keyboard.space"

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	# Zélie's Lacewood: the first place whose floor bumps.
	var shell := DRIVER.prepared_shell(test)
	DRIVER.fly_to_place(shell, 1)
	var contact := float(
		shell.flight_evidence().get("playful_bump_contact_altitude_stage_heights", 0.0),
	)

	for _dive: int in 3:
		DRIVER.glide_until(shell, contact)
		DRIVER.hold_until(shell, contact + 0.3)
	var dived: Dictionary = shell.presentation_evidence()
	test.expect(
		dived.get("playful_bumps") == 3,
		"three separate dives into the Bump Floor meet three Playful Bumps, not %s" % [
			dived.get("playful_bumps"),
		],
	)
	test.expect(
		dived.get("journey_phase") == "place-flight",
		"nothing follows from meeting several Playful Bumps",
	)
	test.expect(
		not dived.has("cloud_rests") and not dived.has("gentle_help"),
		"the journey reports no Cloud Rest and no Gentle Help",
	)
	shell.free()

	# A child who settles onto the floor and stays there is not bumped over and over.
	var resting := DRIVER.prepared_shell(test)
	DRIVER.fly_to_place(resting, 1)
	DRIVER.glide_until(resting, contact)
	DRIVER.advance(resting, 3.0)
	test.expect(
		resting.presentation_evidence().get("playful_bumps") == 1,
		"staying down on the Bump Floor is one wobble, not a wobble every frame",
	)
	test.expect(
		bool(resting.flight_evidence().get("touching_bump_floor", false)),
		"a Stella left on the floor is still reported as touching it",
	)
	resting.free()

	# Rosalia's Rose Garden opens the journey, and its floor does not bump.
	var garden := DRIVER.prepared_shell(test)
	DRIVER.fly_to_place(garden, 0)
	DRIVER.glide_until(garden, contact)
	DRIVER.advance(garden, 2.0)
	test.expect(
		garden.presentation_evidence().get("playful_bumps") == 0,
		"the Rose Garden's floor does not bump",
	)
	garden.free()

	test.finish(self, "Playful Bump acceptance")
