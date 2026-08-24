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


static func advance(shell: StorybookShell, seconds: float) -> void:
	var frame_count := ceili(seconds * 60.0)
	for _frame: int in frame_count:
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
