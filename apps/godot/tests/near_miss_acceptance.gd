extends SceneTree

# The Near Miss is the journey's one answer earned by flying well: Stella comes close to
# the Bump Floor and rises away without touching it. It sounds on the way back up, never
# on the way down, and it answers in every place — including one whose floor does not
# bump at all.

const STORYBOOK_SHELL := preload("res://scripts/storybook_shell.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")
const DRIVER := preload("res://tests/place_journey_driver.gd")
const KEYBOARD_SPACE: StringName = &"keyboard.space"

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	var shell := DRIVER.prepared_shell(test)
	DRIVER.fly_to_place(shell, 1)
	var flight: Dictionary = shell.flight_evidence()
	var ceiling := float(flight.get("near_miss_ceiling_stage_heights", 0.0))
	var contact := float(flight.get("playful_bump_contact_altitude_stage_heights", 0.0))
	test.expect(ceiling > contact, "the Near Miss band sits above the Bump Floor")

	# On the way down the miss has not happened yet, so nothing is announced.
	DRIVER.glide_until(shell, ceiling - 0.01)
	test.expect(
		shell.presentation_evidence().get("near_misses") == 0,
		"entering the band announces nothing, because the miss is not a fact yet",
	)
	DRIVER.hold_until(shell, ceiling + 0.08)
	var missed: Dictionary = shell.presentation_evidence()
	test.expect(
		missed.get("near_misses") == 1,
		"rising back out of the band without touching the floor earns one Near Miss",
	)
	test.expect(
		missed.get("playful_bumps") == 0,
		"the earned Near Miss cost no Playful Bump",
	)
	shell.free()

	# A swoop that touches the floor is not a miss, however close it came on the way out.
	var touched := DRIVER.prepared_shell(test)
	DRIVER.fly_to_place(touched, 1)
	DRIVER.glide_until(touched, contact)
	DRIVER.hold_until(touched, ceiling + 0.08)
	var spoiled: Dictionary = touched.presentation_evidence()
	test.expect(
		spoiled.get("playful_bumps") == 1 and spoiled.get("near_misses") == 0,
		"touching the Bump Floor spends the Near Miss rather than earning it",
	)
	touched.free()

	# Rosalia's Rose Garden suppresses its bump. It still answers a good swoop.
	var garden := DRIVER.prepared_shell(test)
	DRIVER.fly_to_place(garden, 0)
	DRIVER.glide_until(garden, ceiling - 0.01)
	DRIVER.hold_until(garden, ceiling + 0.08)
	var garden_evidence: Dictionary = garden.presentation_evidence()
	test.expect(
		garden_evidence.get("near_misses") == 1 and garden_evidence.get("playful_bumps") == 0,
		"a place whose floor does not bump still answers a Near Miss",
	)
	garden.free()

	# A child hovering on the seam hears one answer, not a rattle.
	var hovering := DRIVER.prepared_shell(test)
	DRIVER.fly_to_place(hovering, 1)
	DRIVER.glide_until(hovering, ceiling - 0.01)
	DRIVER.hold_until(hovering, ceiling + 0.04)
	DRIVER.glide_until(hovering, ceiling - 0.01)
	DRIVER.hold_until(hovering, ceiling + 0.04)
	test.expect(
		hovering.presentation_evidence().get("near_misses") == 1,
		"two crossings inside the rest are one Near Miss, not two",
	)
	var rest_seconds := float(hovering.near_miss_evidence().get("rest_seconds", 0.0))
	DRIVER.advance(hovering, rest_seconds + 0.1)
	DRIVER.glide_until(hovering, ceiling - 0.01)
	DRIVER.hold_until(hovering, ceiling + 0.04)
	test.expect(
		hovering.presentation_evidence().get("near_misses") == 2,
		"a crossing after the rest answers again",
	)
	hovering.free()

	test.finish(self, "Near Miss acceptance")
