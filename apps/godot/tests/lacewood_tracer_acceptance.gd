extends SceneTree

const STORYBOOK_SHELL := preload("res://scripts/storybook_shell.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")
const REQUIRED_SOUND_EVENTS := [
	{
		"event": "sound-event.opening-storybook-moment",
		"context": {"moment": "opening.celebration-preparations"},
	},
	{
		"event": "sound-event.opening-storybook-moment",
		"context": {"moment": "opening.scattered-stars"},
	},
	{"event": "sound-event.opening-storybook-moment", "context": {"moment": "opening.departure"}},
	{"event": "sound-event.flight-launch", "context": {}},
	{"event": "sound-event.movement-state", "context": {"state": "flight"}},
	{"event": "sound-event.movement-state", "context": {"state": "rise"}},
	{"event": "sound-event.place-entry", "context": {"place": "lacewood"}},
	{
		"event": "sound-event.vignette-interaction",
		"context": {"place": "lacewood", "interaction": "silver-ribbons"},
	},
	{"event": "sound-event.movement-state", "context": {"state": "glide"}},
	{
		"event": "sound-event.vignette-interaction",
		"context": {"place": "lacewood", "interaction": "rose-lights"},
	},
	{"event": "sound-event.movement-state", "context": {"state": "rise"}},
	{"event": "sound-event.movement-state", "context": {"state": "glide"}},
	{"event": "sound-event.movement-state", "context": {"state": "rise"}},
	{"event": "sound-event.movement-state", "context": {"state": "glide"}},
	{"event": "sound-event.near-miss", "context": {"place": "lacewood", "kind": "silver-ribbon"}},
	{"event": "sound-event.playful-bump", "context": {"place": "lacewood", "kind": "silver-ribbon"}},
	{"event": "sound-event.playful-bump", "context": {"place": "lacewood", "kind": "silver-ribbon"}},
	{"event": "sound-event.playful-bump", "context": {"place": "lacewood", "kind": "silver-ribbon"}},
	{"event": "sound-event.cloud-rest-entered", "context": {"place": "lacewood"}},
	{"event": "sound-event.cloud-rest-exited", "context": {"place": "lacewood"}},
	{"event": "sound-event.movement-state", "context": {"state": "flight"}},
	{"event": "sound-event.movement-state", "context": {"state": "rise"}},
	{
		"event": "sound-event.birthday-star-proximity",
		"context": {"birthdayStar": "birthday-star.lacewood"},
	},
	{
		"event": "sound-event.birthday-star-gathered",
		"context": {"birthdayStar": "birthday-star.lacewood"},
	},
	{
		"event": "sound-event.rainbow-path-opened",
		"context": {"rainbowPath": "rainbow-path.lacewood", "familyGuest": "Gram"},
	},
	{
		"event": "sound-event.birthday-star-moment",
		"context": {"place": "lacewood", "familyGuest": "Gram"},
	},
	{"event": "sound-event.birthday-castle-arrival", "context": {}},
]
const KEYBOARD_SPACE: StringName = &"keyboard.space"
const POINTER_PRIMARY: StringName = &"pointer.primary"

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	var shell := STORYBOOK_SHELL.new()
	var pack_root := ProjectSettings.globalize_path(ACCEPTANCE_TEST.PACK_ROOT)
	test.expect(shell.prepare_launch(pack_root).get("ok") == true, "the Lacewood tracer prepares")
	test.expect(shell.handle_player_intent("begin"), "the Lacewood tracer begins")
	for _moment: int in 2:
		shell.handle_player_action(KEYBOARD_SPACE, true)
		shell.handle_player_action(KEYBOARD_SPACE, false)

	shell.handle_player_action(KEYBOARD_SPACE, true)
	_advance_controlled(shell, 0.75)
	_advance_controlled(shell, 3.1)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	_advance_controlled(shell, 3.1)
	for source: StringName in [KEYBOARD_SPACE, POINTER_PRIMARY]:
		shell.handle_player_action(source, true)
		_advance_controlled(shell, 0.1)
		shell.handle_player_action(source, false)
	_advance_controlled(shell, 7.7)
	test.expect(
		shell.presentation_evidence().get("journey_phase") == "cloud-rest",
		"three real low-flight contacts reach Cloud Rest",
	)
	_advance_controlled(shell, 1.25)
	test.expect(
		shell.presentation_evidence().get("journey_phase") == "lacewood-flight",
		"Cloud Rest resumes without another player action",
	)

	shell.handle_player_action(KEYBOARD_SPACE, true)
	# Gentle help after the Cloud Rest lengthens the remaining Lacewood travel.
	_advance_controlled(shell, 10.0)
	test.expect(
		shell.presentation_evidence().get("state") == "birthday_star_moment",
		"the guaranteed Birthday Star reaches its self-paced Storybook Moment",
	)
	test.expect(
		not shell.handle_player_action(KEYBOARD_SPACE, true)
		and shell.presentation_evidence().get("state") == "birthday_star_moment",
		"the held flight action cannot skip the Birthday Star Moment",
	)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	test.expect(
		shell.handle_player_action(KEYBOARD_SPACE, true),
		"a release and deliberate new press reaches the celebration",
	)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	test.expect(shell.handle_player_action(KEYBOARD_SPACE, true), "the celebration dances again")
	shell.handle_player_action(KEYBOARD_SPACE, false)

	var evidence: Dictionary = shell.presentation_evidence()
	var single_route: Dictionary = shell.single_route_evidence()
	test.expect(
		evidence.get("state") == "celebration"
		and evidence.get("journey_phase") == "celebration"
		and evidence.get("birthday_stars") == ["birthday-star.lacewood"]
		and evidence.get("rainbow_paths") == ["rainbow-path.lacewood"]
		and evidence.get("playful_bumps") == 3
		and evidence.get("cloud_rests") == 1
		and evidence.get("flight_control_cycles") == 3,
		"one controllable route completes the no-failure Lacewood story: %s"
		% JSON.stringify(evidence),
	)
	test.expect(
		single_route.get("observed_interactions") == ["silver-ribbons", "rose-lights"]
		and single_route.get("canonical_birthday_star_moment")
		== "Gram followed the silver ribbons and glowing roses through Zélie’s Lacewood!"
		and single_route.get("canonical_celebration_echo")
		== "silver-ribbons-and-rose-lights",
		"the combined Lacewood details produce one canonical story and celebration response",
	)
	test.expect(
		not evidence.has("chosen_route")
		and not evidence.has("path_choices")
		and not evidence.has("journey_history")
		and not evidence.has("shimmer_route"),
		"the completed journey records no Path Choice or Journey History state",
	)
	test.expect(
		shell.sound_event_evidence() == REQUIRED_SOUND_EVENTS,
		"the real single-route journey emits the expected sound sequence\nexpected: %s\nactual: %s"
		% [JSON.stringify(REQUIRED_SOUND_EVENTS), JSON.stringify(shell.sound_event_evidence())],
	)

	shell.free()
	test.finish(self, "Lacewood tracer acceptance")


func _advance_controlled(shell: StorybookShell, seconds: float) -> void:
	var frame_count := ceili(seconds * 60.0)
	for _frame: int in frame_count:
		shell.advance_simulation(1.0 / 60.0)
		shell.advance_journey(1.0 / 60.0)
