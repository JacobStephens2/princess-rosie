extends SceneTree

const STORYBOOK_SHELL := preload("res://scripts/storybook_shell.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")
const DRIVER := preload("res://tests/place_journey_driver.gd")
const KEYBOARD_SPACE: StringName = &"keyboard.space"
const POINTER_PRIMARY: StringName = &"pointer.primary"
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
	{"event": "sound-event.place-entry", "context": {"place": "rose-garden"}},
	{
		"event": "sound-event.vignette-interaction",
		"context": {"place": "rose-garden", "interaction": "awakening-roses"},
	},
	{"event": "sound-event.movement-state", "context": {"state": "glide"}},
	{
		"event": "sound-event.vignette-interaction",
		"context": {"place": "rose-garden", "interaction": "petal-drift"},
	},
	{
		"event": "sound-event.birthday-star-proximity",
		"context": {"birthdayStar": "birthday-star.rose-garden"},
	},
	{
		"event": "sound-event.birthday-star-gathered",
		"context": {"birthdayStar": "birthday-star.rose-garden"},
	},
	{
		"event": "sound-event.rainbow-path-opened",
		"context": {"rainbowPath": "rainbow-path.rose-garden", "familyGuest": "Mom"},
	},
	{
		"event": "sound-event.birthday-star-moment",
		"context": {"place": "rose-garden", "familyGuest": "Mom"},
	},
	{"event": "sound-event.place-entry", "context": {"place": "lacewood"}},
	{"event": "sound-event.movement-state", "context": {"state": "flight"}},
	{"event": "sound-event.movement-state", "context": {"state": "rise"}},
	{
		"event": "sound-event.vignette-interaction",
		"context": {"place": "lacewood", "interaction": "silver-ribbons"},
	},
	{"event": "sound-event.movement-state", "context": {"state": "glide"}},
	{
		"event": "sound-event.vignette-interaction",
		"context": {"place": "lacewood", "interaction": "rose-lights"},
	},
	{"event": "sound-event.near-miss", "context": {"place": "lacewood", "kind": "silver-ribbon"}},
	{"event": "sound-event.movement-state", "context": {"state": "rise"}},
	{"event": "sound-event.movement-state", "context": {"state": "glide"}},
	{"event": "sound-event.movement-state", "context": {"state": "rise"}},
	{"event": "sound-event.movement-state", "context": {"state": "glide"}},
	{"event": "sound-event.playful-bump", "context": {"place": "lacewood", "kind": "silver-ribbon"}},
	{"event": "sound-event.playful-bump", "context": {"place": "lacewood", "kind": "silver-ribbon"}},
	{"event": "sound-event.playful-bump", "context": {"place": "lacewood", "kind": "silver-ribbon"}},
	{"event": "sound-event.cloud-rest-entered", "context": {}},
	{"event": "sound-event.cloud-rest-exited", "context": {}},
	# The child never let go, so the rest resumes straight back into a rise.
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
	{"event": "sound-event.place-entry", "context": {"place": "abbey"}},
	{"event": "sound-event.movement-state", "context": {"state": "flight"}},
	{"event": "sound-event.movement-state", "context": {"state": "rise"}},
	{
		"event": "sound-event.vignette-interaction",
		"context": {"place": "abbey", "interaction": "golden-bell-note-high"},
	},
	{"event": "sound-event.movement-state", "context": {"state": "glide"}},
	# Settling through the Abbey rings its way down the bells, and climbing back rings
	# the rung she crosses on the way up: the place answers the hand, not a script.
	{
		"event": "sound-event.vignette-interaction",
		"context": {"place": "abbey", "interaction": "golden-bell-note-middle"},
	},
	{
		"event": "sound-event.vignette-interaction",
		"context": {"place": "abbey", "interaction": "golden-bell-settle"},
	},
	{"event": "sound-event.movement-state", "context": {"state": "rise"}},
	{
		"event": "sound-event.vignette-interaction",
		"context": {"place": "abbey", "interaction": "golden-bell-note-low"},
	},
	{"event": "sound-event.near-miss", "context": {"place": "abbey", "kind": "golden-bell-rope"}},
	{
		"event": "sound-event.birthday-star-proximity",
		"context": {"birthdayStar": "birthday-star.abbey"},
	},
	{
		"event": "sound-event.birthday-star-gathered",
		"context": {"birthdayStar": "birthday-star.abbey"},
	},
	{
		"event": "sound-event.rainbow-path-opened",
		"context": {"rainbowPath": "rainbow-path.abbey", "familyGuest": "Pop"},
	},
	{
		"event": "sound-event.birthday-star-moment",
		"context": {"place": "abbey", "familyGuest": "Pop"},
	},
	{"event": "sound-event.place-entry", "context": {"place": "cloister"}},
	{"event": "sound-event.movement-state", "context": {"state": "flight"}},
	{"event": "sound-event.movement-state", "context": {"state": "rise"}},
	{
		"event": "sound-event.vignette-interaction",
		"context": {"place": "cloister", "interaction": "sunlit-arches"},
	},
	{"event": "sound-event.movement-state", "context": {"state": "glide"}},
	{
		"event": "sound-event.vignette-interaction",
		"context": {"place": "cloister", "interaction": "soft-clouds"},
	},
	{"event": "sound-event.near-miss", "context": {"place": "cloister", "kind": "soft-cloud"}},
	{"event": "sound-event.movement-state", "context": {"state": "rise"}},
	{
		"event": "sound-event.birthday-star-proximity",
		"context": {"birthdayStar": "birthday-star.cloister"},
	},
	{
		"event": "sound-event.birthday-star-gathered",
		"context": {"birthdayStar": "birthday-star.cloister"},
	},
	{
		"event": "sound-event.rainbow-path-opened",
		"context": {"rainbowPath": "rainbow-path.cloister", "familyGuest": "Beasley"},
	},
	{
		"event": "sound-event.birthday-star-moment",
		"context": {"place": "cloister", "familyGuest": "Beasley"},
	},
	{"event": "sound-event.birthday-castle-arrival", "context": {}},
]

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	var shell := STORYBOOK_SHELL.new()
	var pack_root := ProjectSettings.globalize_path(ACCEPTANCE_TEST.PACK_ROOT)
	test.expect(
		shell.prepare_launch(pack_root).get("ok") == true,
		"the four-place journey prepares",
	)
	test.expect(
		shell.presentation_evidence().get("places") == [
			"rose-garden",
			"lacewood",
			"abbey",
			"cloister",
			"pellegrino-peak",
			"sapphire-sea",
		],
		"the Edition Pack declares the journey's places in order: %s"
		% JSON.stringify(shell.presentation_evidence().get("places")),
	)
	test.expect(
		shell.presentation_evidence().get("realized_places") == 4,
		"four of the declared places carry an approved Place Illustration so far",
	)

	DRIVER.launch(shell)
	DRIVER.advance(shell, 0.75)
	var rose_garden_entry: Dictionary = shell.presentation_evidence()
	test.expect(
		rose_garden_entry.get("place") == "rose-garden"
		and rose_garden_entry.get("place_name") == "Rosalia’s Rose Garden"
		and rose_garden_entry.get("family_guest") == "Mom"
		and rose_garden_entry.get("playful_bumps_suppressed") == true,
		"the journey begins in a Rose Garden that cannot bump the child",
	)

	# Rosalia's Rose Garden: fly high, settle low, then linger low for the whole route.
	DRIVER.advance(shell, 3.1)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	DRIVER.advance(shell, 3.1)
	test.expect(
		shell.presentation_evidence().get("observed_interactions")
		== ["awakening-roses", "petal-drift"],
		"both altitude bands answer in the first place",
	)
	DRIVER.advance(shell, 18.0)
	var rose_garden_moment: Dictionary = shell.presentation_evidence()
	test.expect(
		rose_garden_moment.get("state") == "birthday_star_moment"
		and rose_garden_moment.get("playful_bumps") == 0
		and rose_garden_moment.get("cloud_rests") == 0
		and rose_garden_moment.get("birthday_stars") == ["birthday-star.rose-garden"],
		"the whole Rose Garden passage produces a Birthday Star and no Playful Bump: %s"
		% JSON.stringify(rose_garden_moment),
	)
	test.expect(
		rose_garden_moment.get("birthday_star_moment")
		== "Mom followed the waking roses and drifting petals out of Rosalia’s Rose Garden!",
		"the Rose Garden's own Birthday Star Moment sentence names its Family Guest",
	)

	DRIVER.turn_the_page(shell)
	var lacewood_entry: Dictionary = shell.presentation_evidence()
	test.expect(
		lacewood_entry.get("place") == "lacewood"
		and lacewood_entry.get("place_name") == "Zélie’s Lacewood"
		and lacewood_entry.get("family_guest") == "Gram"
		and lacewood_entry.get("playful_bumps_suppressed") == false
		and lacewood_entry.get("state") == "active_play"
		and lacewood_entry.get("movement_state") == "rise",
		"turning the page crosses straight into Lacewood with Flight Control still live",
	)
	test.expect(
		lacewood_entry.get("birthday_stars") == ["birthday-star.rose-garden"],
		"crossing into the next place keeps the gathered Birthday Star",
	)

	# Zélie's Lacewood: the same two bands, then the low lacework it alone carries.
	DRIVER.advance(shell, 3.1)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	DRIVER.advance(shell, 3.1)
	test.expect(
		shell.presentation_evidence().get("observed_interactions")
		== ["silver-ribbons", "rose-lights"],
		"the same two bands awaken this place's own silver ribbons and rose lights",
	)
	for source: StringName in [KEYBOARD_SPACE, POINTER_PRIMARY]:
		shell.handle_player_action(source, true)
		DRIVER.advance(shell, 0.1)
		shell.handle_player_action(source, false)
	DRIVER.advance(shell, 3.9)
	var resting: Dictionary = shell.presentation_evidence()
	test.expect(
		resting.get("journey_phase") == "cloud-rest"
		and resting.get("birthday_stars") == ["birthday-star.rose-garden"],
		"three nearby Playful Bumps reach a Cloud Rest that keeps every gathered Star",
	)
	# A child who is still holding on rides the rest out and climbs away as it releases.
	shell.handle_player_action(KEYBOARD_SPACE, true)
	DRIVER.advance(shell, 1.25)
	test.expect(
		shell.presentation_evidence().get("journey_phase") == "place-flight"
		and shell.presentation_evidence().get("place") == "lacewood",
		"Cloud Rest resumes into the place it happened in, without another player action",
	)

	# Gentle Help after the Cloud Rest lengthens the remaining travel.
	DRIVER.advance(shell, 10.0)
	test.expect(
		shell.presentation_evidence().get("state") == "birthday_star_moment",
		"the second place reaches its own self-paced Birthday Star Moment",
	)
	test.expect(
		not shell.handle_player_action(KEYBOARD_SPACE, true)
		and shell.presentation_evidence().get("state") == "birthday_star_moment",
		"the held flight action cannot skip the Birthday Star Moment",
	)
	DRIVER.turn_the_page(shell)
	var abbey_entry: Dictionary = shell.presentation_evidence()
	test.expect(
		abbey_entry.get("place") == "abbey"
		and abbey_entry.get("place_name") == "Golden Bell Abbey"
		and abbey_entry.get("family_guest") == "Pop"
		and abbey_entry.get("birthday_stars")
		== ["birthday-star.rose-garden", "birthday-star.lacewood"],
		"the journey carries both gathered Stars on into Golden Bell Abbey: %s"
		% JSON.stringify(abbey_entry),
	)

	# Golden Bell Abbey: the same rhythm over four rungs instead of two, so the tower
	# bell answers the climb and the settling bell answers the descent.
	DRIVER.advance(shell, 2.4)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	DRIVER.advance(shell, 2.4)
	test.expect(
		shell.presentation_evidence().get("observed_interactions")
		== ["golden-bell-note-high", "golden-bell-note-middle", "golden-bell-settle"],
		"one settling descent rings its way down the Abbey's bells: %s"
		% JSON.stringify(shell.presentation_evidence().get("observed_interactions")),
	)
	shell.handle_player_action(KEYBOARD_SPACE, true)
	DRIVER.advance(shell, 14.5)
	test.expect(
		shell.presentation_evidence().get("state") == "birthday_star_moment",
		"the third place reaches its own self-paced Birthday Star Moment",
	)

	DRIVER.turn_the_page(shell)
	var cloister_entry: Dictionary = shell.presentation_evidence()
	test.expect(
		cloister_entry.get("place") == "cloister"
		and cloister_entry.get("place_name") == "Cloister of Clouds"
		and cloister_entry.get("family_guest") == "Beasley"
		and cloister_entry.get("birthday_stars") == [
			"birthday-star.rose-garden",
			"birthday-star.lacewood",
			"birthday-star.abbey",
		],
		"the journey carries all three gathered Stars on into the Cloister of Clouds: %s"
		% JSON.stringify(cloister_entry),
	)

	# The Cloister of Clouds: two rungs again, in a place made only of data and media.
	DRIVER.advance(shell, 3.1)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	DRIVER.advance(shell, 3.1)
	test.expect(
		shell.presentation_evidence().get("observed_interactions")
		== ["sunlit-arches", "soft-clouds"],
		"the same two bands answer with the Cloister's own arches and clouds: %s"
		% JSON.stringify(shell.presentation_evidence().get("observed_interactions")),
	)
	shell.handle_player_action(KEYBOARD_SPACE, true)
	DRIVER.advance(shell, 14.5)
	test.expect(
		shell.presentation_evidence().get("state") == "birthday_star_moment",
		"the fourth place reaches its own self-paced Birthday Star Moment",
	)

	shell.handle_player_action(KEYBOARD_SPACE, false)
	test.expect(
		shell.handle_player_action(KEYBOARD_SPACE, true),
		"a release and deliberate new press leaves the last realized place",
	)
	shell.handle_player_action(KEYBOARD_SPACE, false)

	var evidence: Dictionary = shell.presentation_evidence()
	test.expect(
		evidence.get("state") == "celebration"
		and evidence.get("journey_phase") == "celebration"
		and evidence.get("birthday_stars") == [
			"birthday-star.rose-garden",
			"birthday-star.lacewood",
			"birthday-star.abbey",
			"birthday-star.cloister",
		]
		and evidence.get("rainbow_paths") == [
			"rainbow-path.rose-garden",
			"rainbow-path.lacewood",
			"rainbow-path.abbey",
			"rainbow-path.cloister",
		]
		and evidence.get("playful_bumps") == 3
		and evidence.get("cloud_rests") == 1
		and evidence.get("flight_control_cycles") >= 3,
		"four data-driven places complete one no-failure journey: %s" % JSON.stringify(evidence),
	)
	test.expect(
		not evidence.has("chosen_route")
		and not evidence.has("path_choices")
		and not evidence.has("journey_history")
		and evidence.get("journey_progress_persisted") == false,
		"the completed journey records no Path Choice or Journey History state",
	)
	test.expect(
		not shell.has_method("single_route_evidence"),
		"the single-route accessor has folded into the presentation evidence dictionary",
	)
	test.expect(
		shell.sound_event_evidence() == REQUIRED_SOUND_EVENTS,
		"the four-place journey emits the expected sound sequence\nexpected: %s\nactual: %s"
		% [JSON.stringify(REQUIRED_SOUND_EVENTS), JSON.stringify(shell.sound_event_evidence())],
	)

	shell.free()
	test.finish(self, "journey acceptance")
