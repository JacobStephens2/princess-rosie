extends SceneTree

const STORYBOOK_SHELL := preload("res://scripts/storybook_shell.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	var shell := STORYBOOK_SHELL.new()
	var pack_root := ProjectSettings.globalize_path("res://../../shared/edition")
	test.expect(
		shell.prepare_launch(pack_root).get("ok") == true,
		"the Cloister of Clouds tracer prepares offline",
	)

	var arches_event_start := _reach_cloister(shell, true)
	var arches_entry: Dictionary = shell.presentation_evidence()
	test.expect(
		arches_entry.get("state") == "active_play"
		and arches_entry.get("place") == "cloister"
		and arches_entry.get("journey_phase") == "cloister-path-choice"
		and arches_entry.get("playful_bumps") == 0,
		"the Lacewood hands the flight onward to a fresh Cloister of Clouds Path Choice",
	)
	test.expect(
		shell.handle_player_intent("action-pressed"),
		"holding chooses the sunlit arch colonnade",
	)
	shell.advance_journey(1.25)
	var arches_route: Dictionary = shell.presentation_evidence()
	test.expect(
		arches_route.get("chosen_route") == "cloister.arches"
		and arches_route.get("journey_phase") == "cloister-route"
		and arches_route.get("path_choices") == {
			"path-choice.lacewood": "lacewood.canopy",
			"path-choice.cloister": "cloister.arches",
		},
		"the sunlit arch route is recorded beside the earlier Lacewood Path Choice",
	)
	test.expect(
		shell.handle_player_intent("action-released"),
		"the one action may be released after choosing an equally safe Cloister route",
	)

	shell.advance_journey(2.25)
	shell.advance_journey(4.9)
	var arches_moment: Dictionary = shell.presentation_evidence()
	test.expect(
		arches_moment.get("state") == "birthday_star_moment"
		and arches_moment.get("playful_bumps") == 2
		and arches_moment.get("cloud_rests") == 1
		and arches_moment.get("birthday_stars") == [
			"birthday-star.lacewood",
			"birthday-star.cloister",
		]
		and arches_moment.get("rainbow_paths") == [
			"rainbow-path.lacewood",
			"rainbow-path.cloister",
		],
		"gentle Cloister Playful Bumps carry on to Beasley's Birthday Star and Rainbow Path",
	)
	test.expect(
		shell.sound_event_evidence().slice(arches_event_start) == _cloister_events(
			"cloister.arches",
			"sunlit-arch-glide",
			false,
		),
		"the sunlit arch route emits the complete staged Cloister and Birthday Star sequence",
	)
	test.expect(
		shell.handle_player_intent("continue"),
		"Beasley's Birthday Star Moment can continue to the celebration",
	)
	test.expect(
		shell.presentation_evidence().get("state") == "celebration"
		and shell.sound_event_evidence().back() == {
			"event": "sound-event.birthday-castle-arrival",
			"context": {},
		},
		"the last place exits into the Birthday Castle arrival",
	)

	test.expect(shell.handle_player_intent("escape"), "the completed tracer can pause")
	test.expect(shell.handle_player_intent("replay"), "the tracer can replay from the cover")
	var clouds_event_start := _reach_cloister(shell, false)
	shell.advance_journey(1.25)
	shell.advance_journey(2.25)
	shell.advance_journey(4.9)
	var clouds_moment: Dictionary = shell.presentation_evidence()
	test.expect(
		clouds_moment.get("state") == "birthday_star_moment"
		and clouds_moment.get("chosen_route") == "cloister.clouds",
		"release selects the equally safe soft cloud drift on replay",
	)
	test.expect(
		shell.sound_event_evidence().slice(clouds_event_start) == _cloister_events(
			"cloister.clouds",
			"soft-cloud-drift",
			true,
		),
		"the unexplored Cloister route receives one restrained shimmer and its own airy response",
	)
	test.expect(
		shell.handle_player_intent("continue")
		and shell.presentation_evidence().get("journey_history").has("cloister.arches")
		and shell.presentation_evidence().get("journey_history").has("cloister.clouds"),
		"both equally safe Cloister routes complete without a correctness or reward signal",
	)

	shell.free()
	_prove_aggregated_cloud_contacts()
	test.finish(self, "Cloister of Clouds tracer acceptance")


func _prove_aggregated_cloud_contacts() -> void:
	var shell := STORYBOOK_SHELL.new()
	var pack_root := ProjectSettings.globalize_path("res://../../shared/edition")
	test.expect(
		shell.prepare_launch(pack_root).get("ok") == true,
		"the cloud contact probe prepares offline",
	)
	_reach_cloister(shell, true)
	shell.handle_player_intent("action-pressed")
	shell.advance_journey(1.25)
	test.expect(
		shell.presentation_evidence().get("journey_phase") == "cloister-route",
		"the cloud contact probe flies the sunlit arch route",
	)

	var held_start := shell.sound_event_evidence().size()
	for _visual_update: int in 30:
		shell.note_place_contact(&"near-miss", true)
	test.expect(
		shell.sound_event_evidence().slice(held_start) == [
			{
				"event": "sound-event.near-miss",
				"context": {"place": "cloister", "kind": "cloud-bound"},
			},
		],
		"a held cloud bound sounds once on its edge instead of once per visual update",
	)
	shell.note_place_contact(&"near-miss", false)
	test.expect(
		not shell.note_place_contact(&"near-miss", true),
		"a flickering cloud bound stays silent inside its cooldown",
	)
	shell.advance_journey(0.44)
	shell.note_place_contact(&"near-miss", false)
	test.expect(
		shell.note_place_contact(&"near-miss", true),
		"a later cloud bound edge may sound after its cooldown",
	)

	var cloud_start := shell.sound_event_evidence().size()
	shell.note_place_contact(&"interaction", false)
	test.expect(
		shell.note_place_contact(&"interaction", true),
		"a soft cloud interaction sounds on its own edge",
	)
	for _visual_update: int in 20:
		shell.note_place_contact(&"interaction", true)
	test.expect(
		shell.sound_event_evidence().slice(cloud_start) == [
			{
				"event": "sound-event.vignette-interaction",
				"context": {"place": "cloister", "interaction": "sunlit-arch-glide"},
			},
		],
		"a continuing soft cloud interaction keeps one aggregated airy response",
	)
	test.expect(
		not shell.note_place_contact(&"playful-bump", true)
		or shell.presentation_evidence().get("playful_bumps") == 1,
		"contact reports never accumulate more than one Playful Bump per edge",
	)
	shell.free()


func _reach_cloister(shell: StorybookShell, hold_in_lacewood: bool) -> int:
	test.expect(shell.handle_player_intent("begin"), "the journey begins from the cover")
	for _opening_moment: int in 3:
		test.expect(shell.handle_player_intent("continue"), "the Opening Storybook Moment continues")
	shell.advance_journey(0.75)
	if hold_in_lacewood:
		shell.handle_player_intent("action-pressed")
	shell.advance_journey(1.25)
	shell.handle_player_intent("action-released")
	shell.advance_journey(1.8)
	test.expect(
		shell.handle_player_intent("action-pressed"),
		"the Lacewood Cloud Rest resumes on the way to the Cloister",
	)
	shell.advance_journey(4.9)
	var cloister_event_start := shell.sound_event_evidence().size()
	test.expect(
		shell.handle_player_intent("continue"),
		"Gram's Birthday Star Moment continues onward",
	)
	return cloister_event_start


func _cloister_events(route: String, interaction: String, includes_shimmer: bool) -> Array:
	var events := [
		{"event": "sound-event.place-entry", "context": {"place": "cloister"}},
		{
			"event": "sound-event.path-choice-available",
			"context": {"pathChoice": "path-choice.cloister"},
		},
	]
	if includes_shimmer:
		events.append({
			"event": "sound-event.journey-history-shimmer",
			"context": {"pathChoice": "path-choice.cloister", "route": route},
		})
	events.append_array([
		{
			"event": "sound-event.path-choice-selected",
			"context": {"pathChoice": "path-choice.cloister", "route": route},
		},
		{
			"event": "sound-event.vignette-interaction",
			"context": {"place": "cloister", "interaction": interaction},
		},
		{
			"event": "sound-event.vignette-interaction",
			"context": {"place": "cloister", "interaction": interaction},
		},
		{
			"event": "sound-event.near-miss",
			"context": {"place": "cloister", "kind": "cloud-bound"},
		},
		{
			"event": "sound-event.playful-bump",
			"context": {"place": "cloister", "kind": "soft-cloud"},
		},
		{
			"event": "sound-event.playful-bump",
			"context": {"place": "cloister", "kind": "soft-cloud"},
		},
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
			"context": {
				"rainbowPath": "rainbow-path.cloister",
				"familyGuest": "Beasley",
			},
		},
		{
			"event": "sound-event.birthday-star-moment",
			"context": {"place": "cloister", "familyGuest": "Beasley"},
		},
	])
	return events
