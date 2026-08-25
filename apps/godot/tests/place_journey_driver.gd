extends RefCounted

# Shared way for the acceptance scripts to fly the journey through the shell's own
# player intents, so every script observes only presentation evidence.

const STORYBOOK_SHELL := preload("res://scripts/storybook_shell.gd")
const KEYBOARD_SPACE: StringName = &"keyboard.space"


# Turns the Opening Storybook Moments and launches with the action still held, exactly
# as a child who never lets go would.
static func launch(shell: StorybookShell) -> void:
	shell.handle_player_intent("begin")
	for _moment: int in 2:
		shell.handle_player_action(KEYBOARD_SPACE, true)
		shell.handle_player_action(KEYBOARD_SPACE, false)
	shell.handle_player_action(KEYBOARD_SPACE, true)


# Reaches a place the way a child reaches it: the Opening Storybook Moments turned, the
# places ahead of it flown high, each turned by hand, and no seeded shell state. The
# script that calls it has already prepared the shell from the Edition Pack.
static func fly_to_place(shell: StorybookShell, places_before: int) -> void:
	launch(shell)
	advance(shell, 0.75)
	for _place: int in places_before:
		advance(shell, 24.0)
		turn_the_page(shell)


static func advance(shell: StorybookShell, seconds: float) -> void:
	var frame_count := ceili(seconds * 60.0)
	for _frame: int in frame_count:
		shell.advance_simulation(1.0 / 60.0)
		shell.advance_journey(1.0 / 60.0)


# Keeps Stella around one height the way a child does: hold while she is below it,
# let go while she is above it. Places whose delight is finer-grained than high-or-low
# are flown this way, because the child guiding them flies them this way.
static func hold_near(shell: StorybookShell, altitude: float, seconds: float) -> void:
	var frame_count := ceili(seconds * 60.0)
	for _frame: int in frame_count:
		var below := (
			float(shell.flight_evidence().get("altitude_stage_heights", 0.0)) < altitude
		)
		shell.handle_player_action(KEYBOARD_SPACE, below)
		shell.advance_simulation(1.0 / 60.0)
		shell.advance_journey(1.0 / 60.0)


# Dismisses a Birthday Star Moment with the deliberate release and new press it asks
# for, leaving that press held so it carries into the next place.
static func turn_the_page(shell: StorybookShell) -> void:
	shell.handle_player_action(KEYBOARD_SPACE, false)
	shell.handle_player_action(KEYBOARD_SPACE, true)


# Flies whatever remains of the current place and its Birthday Star Moment, turns the
# page into the next place, and leaves Stella gliding at its start.
static func cross_into_next_place(shell: StorybookShell) -> void:
	advance(shell, 24.0)
	turn_the_page(shell)
	shell.handle_player_action(KEYBOARD_SPACE, false)


# The low passage of the named place flown to its next Playful Bump, recorded against
# the calling script's own expectations so a place that never meets one is named in the
# failure rather than only missing from the evidence.
static func fly_low_until_playful_bumps(
	test: RefCounted,
	shell: StorybookShell,
	place_name: String,
	playful_bumps: int,
) -> Dictionary:
	var evidence := fly_until_playful_bumps(shell, playful_bumps)
	test.expect(
		not evidence.is_empty(),
		"the low %s passage meets %d Playful Bumps" % [place_name, playful_bumps],
	)
	return evidence


# Flies the current place the way a child who never climbs flies it, stopping at the
# frame the named Playful Bump lands so the wobble can be seen while it is still
# happening. Returns an empty dictionary if the passage never meets that many, leaving
# the calling script to say which place fell short.
static func fly_until_playful_bumps(shell: StorybookShell, playful_bumps: int) -> Dictionary:
	for _frame: int in 900:
		shell.advance_simulation(1.0 / 60.0)
		shell.advance_journey(1.0 / 60.0)
		var evidence: Dictionary = shell.presentation_evidence()
		if int(evidence.get("playful_bumps", 0)) >= playful_bumps:
			return evidence
	return {}


# The places the journey has crossed into so far, in order, as the soundscape heard it.
# Exactly one ambience is active at a time, so this is also the ambience the child is
# listening to at each point of the journey.
static func place_entry_ambiences(shell: StorybookShell) -> Array:
	var places: Array = []
	for sound_event: Dictionary in shell.sound_event_evidence():
		if sound_event.get("event") == "sound-event.place-entry":
			places.append(sound_event.get("context", {}).get("place"))
	return places
