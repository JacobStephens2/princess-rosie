extends SceneTree

# Gathering a Birthday Star has to mean helping someone. A Family Guest waits beside the
# Star in every place, and the Birthday Star Moment that follows is composed at runtime
# from the place's own illustration and the shared journey media — one presentation,
# one data row per place.

const STORYBOOK_SCENE := preload("res://scenes/storybook_shell.tscn")
const EDITION_PACK_ADAPTER := preload("res://scripts/edition_pack_adapter.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")
const DRIVER := preload("res://tests/place_journey_driver.gd")
const KEYBOARD_SPACE: StringName = &"keyboard.space"
const POINTER_PRIMARY: StringName = &"pointer.primary"
const ROSE_GARDEN_BACKGROUND := "source-media/flight/rose-garden-background.png"
const LACEWOOD_BACKGROUND := "source-media/lacewood/lacewood-single-route-background.png"
const MOM_CUTOUT := "source-media/journey/family-guest-mom.png"
const GRAM_CUTOUT := "source-media/journey/family-guest-gram.png"
const POP_CUTOUT := "source-media/journey/family-guest-pop.png"
const BIRTHDAY_STAR_SPRITE := "source-media/journey/birthday-star.png"
const RAINBOW_PATH_TREATMENT := "source-media/journey/rainbow-path.png"
const ROSE_GARDEN_SENTENCE := (
	"Mom followed the waking roses and drifting petals out of Rosalia’s Rose Garden!"
)
const LACEWOOD_SENTENCE := (
	"Gram followed the silver ribbons and glowing roses through Zélie’s Lacewood!"
)
# The whole pack's painted illustrations: three that open the story and one that ends it.
# Every place's Birthday Star Moment is composed instead, so none of these belongs to one.
const PAINTED_ILLUSTRATIONS := [
	"opening.celebration-preparations",
	"opening.scattered-stars",
	"opening.rosie-stella-departure",
	"celebration.birthday-castle",
]

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	_run.call_deferred()


func _run() -> void:
	var pack_root := ProjectSettings.globalize_path(ACCEPTANCE_TEST.PACK_ROOT)
	_expect_no_painted_moments(pack_root)

	var shell: StorybookShell = STORYBOOK_SCENE.instantiate()
	root.add_child(shell)
	await process_frame
	test.expect(
		shell.prepare_launch(pack_root).get("ok") == true,
		"the Birthday Star journey prepares from the current Edition Pack",
	)
	test.expect(
		shell.presentation_evidence().get("journey_media_paths") == {
			"family-guest.mom": MOM_CUTOUT,
			"family-guest.gram": GRAM_CUTOUT,
			"family-guest.pop": POP_CUTOUT,
			"journey.birthday-star": BIRTHDAY_STAR_SPRITE,
			"journey.rainbow-path": RAINBOW_PATH_TREATMENT,
		},
		"one Family Guest cutout per place joins the one Birthday Star and one Rainbow Path: %s"
		% JSON.stringify(shell.presentation_evidence().get("journey_media_paths")),
	)

	DRIVER.launch(shell)
	await _fly_to_birthday_star(shell)
	await _expect_guest_waiting_beside_star(shell, "Mom")
	await _expect_gathering_opens_the_rainbow_path(shell, "birthday-star.rose-garden")
	await _expect_moment_composed(shell, "Mom", ROSE_GARDEN_BACKGROUND, ROSE_GARDEN_SENTENCE)
	_expect_moment_waits_indefinitely(shell)

	DRIVER.turn_the_page(shell)
	test.expect(
		shell.presentation_evidence().get("place") == "lacewood"
		and shell.presentation_evidence().get("state") == "active_play",
		"dismissing the moment carries the journey straight into the next place",
	)
	test.expect(
		shell.presentation_evidence().get("birthday_stars") == ["birthday-star.rose-garden"],
		"the gathered Birthday Star travels into the next place",
	)

	_rest_on_a_cloud(shell)
	test.expect(
		shell.presentation_evidence().get("journey_phase") == "cloud-rest"
		and shell.presentation_evidence().get("birthday_stars")
		== ["birthday-star.rose-garden"],
		"every gathered Birthday Star survives a Cloud Rest",
	)
	DRIVER.advance(shell, 1.25)
	shell.handle_player_action(KEYBOARD_SPACE, true)

	await _fly_to_birthday_star(shell)
	await _expect_guest_waiting_beside_star(shell, "Gram")
	await _expect_gathering_opens_the_rainbow_path(shell, "birthday-star.lacewood")
	await _expect_moment_composed(shell, "Gram", LACEWOOD_BACKGROUND, LACEWOOD_SENTENCE)
	test.expect(
		shell.presentation_evidence().get("birthday_stars")
		== ["birthday-star.rose-garden", "birthday-star.lacewood"]
		and shell.presentation_evidence().get("rainbow_paths")
		== ["rainbow-path.rose-garden", "rainbow-path.lacewood"],
		"both places gather their Star and open their guest's Rainbow Path",
	)

	shell.queue_free()
	await process_frame
	test.finish(self, "birthday star moment acceptance")


# The moment is punctuation inside a place the child is already looking at, so the pack
# carries no illustration beyond the three that open the story.
func _expect_no_painted_moments(pack_root: String) -> void:
	var adapter := EDITION_PACK_ADAPTER.new()
	var prepared: Dictionary = adapter.prepare(pack_root)
	var media_result: Dictionary = adapter.load_media(pack_root, prepared)
	var illustrations: Array[String] = []
	for media_value: Variant in media_result.get("value", {}).get("media", []):
		if media_value is Dictionary and media_value.get("role") == "illustration":
			illustrations.append(str(media_value.get("id")))
	test.expect(
		illustrations == PAINTED_ILLUSTRATIONS,
		"only the story's opening and its ending carry a painted illustration: %s"
		% JSON.stringify(illustrations),
	)



func _fly_to_birthday_star(shell: StorybookShell) -> void:
	for _step: int in 240:
		if shell.presentation_evidence().get("journey_phase") == "birthday-star-approach":
			break
		DRIVER.advance(shell, 0.2)
	await process_frame


func _expect_guest_waiting_beside_star(shell: StorybookShell, guest: String) -> void:
	var approach: Dictionary = shell.storybook_stage_evidence().get("birthday_star_approach", {})
	test.expect(
		approach.get("birthday_star_visible") == true
		and approach.get("family_guest_visible") == true
		and approach.get("family_guest") == guest,
		"%s waits with the Birthday Star still to be gathered: %s"
		% [guest, JSON.stringify(approach)],
	)
	test.expect(
		approach.get("rainbow_path_visible") == false,
		"%s's Rainbow Path stays closed until the Star is gathered" % guest,
	)
	test.expect(
		approach.get("birthday_star_within_reach") == true,
		"the Birthday Star hangs within reach beside %s: %s"
		% [guest, JSON.stringify(approach)],
	)
	await process_frame


func _expect_gathering_opens_the_rainbow_path(
	shell: StorybookShell,
	birthday_star: String,
) -> void:
	DRIVER.advance(shell, 1.1)
	test.expect(
		shell.presentation_evidence().get("birthday_stars").has(birthday_star)
		and _last_sound_event(shell, "sound-event.birthday-star-gathered").get("context", {})
		== {"birthdayStar": birthday_star},
		"gathering %s plays the gather cue every place shares" % birthday_star,
	)
	DRIVER.advance(shell, 1.5)
	await process_frame
	var approach: Dictionary = shell.storybook_stage_evidence().get("birthday_star_approach", {})
	test.expect(
		approach.get("rainbow_path_visible") == true
		and approach.get("birthday_star_visible") == false,
		"the gathered Star becomes the guest's open Rainbow Path: %s" % JSON.stringify(approach),
	)


func _expect_moment_composed(
	shell: StorybookShell,
	guest: String,
	place_illustration: String,
	sentence: String,
) -> void:
	DRIVER.advance(shell, 2.6)
	await process_frame
	test.expect(
		shell.presentation_evidence().get("state") == "birthday_star_moment",
		"the story pauses on %s's Birthday Star Moment" % guest,
	)
	var composition: Dictionary = shell.storybook_stage_evidence().get(
		"birthday_star_moment_composition",
		{},
	)
	test.expect(
		composition == {
			"place_illustration": place_illustration,
			"place_illustration_dimmed": true,
			"family_guest": guest,
			"family_guest_cutout": MOM_CUTOUT if guest == "Mom" else GRAM_CUTOUT,
			"family_guest_visible": true,
			"rainbow_path_treatment": RAINBOW_PATH_TREATMENT,
			"rainbow_path_visible": true,
			"sentence": sentence,
		},
		"%s's moment is composed from the place the child is in and the shared media: %s"
		% [guest, JSON.stringify(composition)],
	)


func _expect_moment_waits_indefinitely(shell: StorybookShell) -> void:
	DRIVER.advance(shell, 30.0)
	test.expect(
		shell.presentation_evidence().get("state") == "birthday_star_moment",
		"the Birthday Star Moment waits for the Grown-up Helper however long it takes",
	)


# Zélie's Lacewood can bump, so three nearby Playful Bumps settle Stella onto a cloud.
func _rest_on_a_cloud(shell: StorybookShell) -> void:
	DRIVER.advance(shell, 3.1)
	shell.handle_player_action(KEYBOARD_SPACE, false)
	DRIVER.advance(shell, 3.1)
	for source: StringName in [KEYBOARD_SPACE, POINTER_PRIMARY]:
		shell.handle_player_action(source, true)
		DRIVER.advance(shell, 0.1)
		shell.handle_player_action(source, false)
	DRIVER.advance(shell, 7.7)


func _last_sound_event(shell: StorybookShell, event_id: String) -> Dictionary:
	var found: Dictionary = {}
	for event_value: Variant in shell.sound_event_evidence():
		if event_value is Dictionary and event_value.get("event") == event_id:
			found = event_value
	return found
