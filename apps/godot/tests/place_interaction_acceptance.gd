extends SceneTree

const STORYBOOK_SHELL := preload("res://scripts/storybook_shell.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")
const DRIVER := preload("res://tests/place_journey_driver.gd")
const KEYBOARD_SPACE: StringName = &"keyboard.space"

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	# Rosalia's Rose Garden: both bands answer, and nothing can bump the child.
	var rose_garden := _start_journey()
	DRIVER.advance(rose_garden, 3.1)
	test.expect(
		rose_garden.presentation_evidence().get("observed_interactions") == ["awakening-roses"],
		"flying high awakens the first place's high interaction",
	)
	rose_garden.handle_player_action(KEYBOARD_SPACE, false)
	DRIVER.advance(rose_garden, 3.1)
	test.expect(
		rose_garden.presentation_evidence().get("observed_interactions")
		== ["awakening-roses", "petal-drift"],
		"settling low awakens the first place's low interaction on the same route",
	)
	DRIVER.advance(rose_garden, 11.0)
	var settled_low: Dictionary = rose_garden.presentation_evidence()
	test.expect(
		settled_low.get("playful_bumps") == 0
		and not settled_low.has("cloud_rests"),
		"staying low through the whole Rose Garden meets no Playful Bump at any height",
	)
	test.expect(
		not _emitted_events(rose_garden).has("sound-event.playful-bump"),
		"the Rose Garden's floor does not bump, however low the child flies",
	)
	# Suppression narrowed to the bump alone: the Near Miss is not silenced with it. It
	# stays quiet here only because settling onto the floor spends it.
	test.expect(
		not _emitted_events(rose_garden).has("sound-event.near-miss"),
		"a Stella settled onto the Rose Garden's floor earns no Near Miss either",
	)

	# Zélie's Lacewood: the same code path, with its Playful Bump left switched on.
	var responsive := _start_journey()
	_cross_into_lacewood(responsive)
	DRIVER.advance(responsive, 3.1)
	test.expect(
		responsive.presentation_evidence().get("observed_interactions") == ["silver-ribbons"],
		"flying high awakens the silver ribbons",
	)
	responsive.handle_player_action(KEYBOARD_SPACE, false)
	DRIVER.advance(responsive, 3.1)
	test.expect(
		responsive.presentation_evidence().get("observed_interactions")
		== ["silver-ribbons", "rose-lights"],
		"settling low awakens the rose lights on the same route",
	)
	DRIVER.advance(responsive, 4.0)
	test.expect(
		responsive.presentation_evidence().get("playful_bumps") == 1
		and responsive.presentation_evidence().get("journey_phase") == "place-flight",
		"remaining on the low lacework's Bump Floor is one gentle wobble, and the route flies on",
	)

	var avoiding := _start_journey()
	_cross_into_lacewood(avoiding)
	DRIVER.advance(avoiding, 14.0)
	test.expect(
		avoiding.presentation_evidence().get("playful_bumps") == 0,
		"guiding Stella high avoids the low lacework bumps without changing her route",
	)

	rose_garden.free()
	responsive.free()
	avoiding.free()
	test.finish(self, "place interaction acceptance")


func _start_journey() -> StorybookShell:
	var shell := STORYBOOK_SHELL.new()
	var pack_root := ProjectSettings.globalize_path(ACCEPTANCE_TEST.PACK_ROOT)
	test.expect(shell.prepare_launch(pack_root).get("ok") == true, "the interaction journey prepares")
	DRIVER.launch(shell)
	DRIVER.advance(shell, 0.75)
	return shell


# Reaches the second place the way a child reaches it rather than by seeding shell state.
func _cross_into_lacewood(shell: StorybookShell) -> void:
	DRIVER.advance(shell, 24.0)
	DRIVER.turn_the_page(shell)
	test.expect(
		shell.presentation_evidence().get("place") == "lacewood",
		"the journey crosses from the Rose Garden into Lacewood",
	)


func _emitted_events(shell: StorybookShell) -> Array:
	var events: Array = []
	for sound_event: Dictionary in shell.sound_event_evidence():
		events.append(sound_event.get("event"))
	return events
