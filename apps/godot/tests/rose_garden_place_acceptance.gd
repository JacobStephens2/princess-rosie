extends SceneTree

const STORYBOOK_SHELL := preload("res://scripts/storybook_shell.gd")
const SOUNDSCAPE_PLAYER := preload("res://scripts/soundscape_player.gd")
const SOUNDSCAPE_PLAYBACK := preload("res://scripts/soundscape_playback.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")
const SCENARIO_PATH := "res://../../shared/edition/parity/rose-garden.json"
const GARDEN_AMBIENCE := "source-media/soundscape/runtime/place-rose-garden.wav"
const LACEWOOD_AMBIENCE := "source-media/soundscape/runtime/place-lacewood.wav"
const AWAKENING_ROSES := "source-media/soundscape/runtime/vignette-rose-garden-awakening-roses.wav"
const GARDEN_BUMP := "source-media/soundscape/runtime/playful-bump-rose-garden.wav"
const GARDEN_NEAR_MISS := "source-media/soundscape/runtime/near-miss-rose-garden.wav"
const GARDEN_STAR_MOMENT := "source-media/soundscape/runtime/birthday-star-moment-rose-garden.wav"
const BIRTHDAY_STAR_GATHER := "source-media/soundscape/runtime/birthday-star-gather.wav"
const RAINBOW_PATH_OPEN := "source-media/soundscape/runtime/rainbow-path-open.wav"


class FakeEngineAudioAdapter extends RefCounted:
	var missing_paths: Array[String] = []
	var loaded_paths: Array[String] = []
	var played_streams: Array[Variant] = []
	var playback_settings: Array[Dictionary] = []
	var stopped_slots: Array[String] = []
	var faded_slots: Array[Dictionary] = []

	func load_wav(_pack_source: String, relative_path: String) -> Variant:
		loaded_paths.append(relative_path)
		return null if missing_paths.has(relative_path) else relative_path

	func load_mp3(_pack_source: String, _relative_path: String) -> Variant:
		return "birthday-flight"

	func synthesize_music() -> Variant:
		return "synthesized-music"

	func synthesize_confirmation() -> Variant:
		return "synthesized-confirmation"

	func synthesize_birthday_star() -> Variant:
		return "synthesized-birthday-star"

	func synthesize_playful_bump() -> Variant:
		return "synthesized-playful-bump"

	func play(stream: Variant, playback: Variant) -> bool:
		played_streams.append(stream)
		playback_settings.append({
			"bus": playback.bus,
			"category": playback.category,
			"slot": playback.slot,
			"gain_db": playback.gain_db,
			"priority": playback.priority,
			"looping": playback.looping,
			"crossfade_ms": playback.crossfade_ms,
		})
		return true

	func stop_slot(slot: String) -> void:
		stopped_slots.append(slot)

	func fade_out_slot(slot: String, fade_ms: int) -> void:
		faded_slots.append({"slot": slot, "fade_ms": fade_ms})

	func playback_for(relative_path: String) -> Dictionary:
		var index := played_streams.find(relative_path)
		return playback_settings[index] if index >= 0 else {}


class FakeClock extends RefCounted:
	var milliseconds := 1_000

	func now_ms() -> int:
		return milliseconds

	func advance(elapsed_ms: int) -> void:
		milliseconds += elapsed_ms


var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	_prove_place_journey()
	_prove_place_soundscape()
	test.finish(self, "Rosalia's Rose Garden acceptance")


## The Garden's own semantic journey, checked against the shared scenario the
## other Production Edition must reproduce.
func _prove_place_journey() -> void:
	var scenario_value: Variant = JSON.parse_string(FileAccess.get_file_as_string(SCENARIO_PATH))
	test.expect(scenario_value is Dictionary, "the shared Rose Garden scenario parses")
	if not scenario_value is Dictionary:
		return
	var scenario: Dictionary = scenario_value
	var shell := STORYBOOK_SHELL.new()
	var pack_root := ProjectSettings.globalize_path("res://../../shared/edition")
	test.expect(
		shell.prepare_launch(pack_root).get("ok") == true,
		"Rosalia's Rose Garden prepares offline",
	)
	test.expect(shell.handle_player_intent("begin"), "the journey begins from the cover")
	for _opening_moment: int in 3:
		test.expect(shell.handle_player_intent("continue"), "the Opening Storybook Moment continues")

	shell.advance_journey(0.75)
	var entry: Dictionary = shell.presentation_evidence()
	test.expect(
		entry.get("place") == "rose-garden" and entry.get("journey_phase") == "rose-garden-vignette",
		"the opening flight reaches Rosalia's Rose Garden and offers its one-button vignette",
	)
	test.expect(
		shell.handle_player_intent("action-pressed"),
		"the one action wakes the roses",
	)
	var awakened_events := shell.sound_event_evidence().size()
	test.expect(
		shell.sound_event_evidence().back() == {
			"event": "sound-event.vignette-interaction",
			"context": {"place": "rose-garden", "interaction": "awakening-roses"},
		},
		"waking the roses reports one aggregated interaction",
	)
	test.expect(shell.handle_player_intent("action-released"), "the waking action releases")
	shell.advance_journey(1.25)
	test.expect(
		shell.sound_event_evidence().size() == awakened_events,
		"passing the woken roses never fires a second per-flower response",
	)
	test.expect(
		shell.presentation_evidence().get("journey_phase") == "rose-garden-route",
		"the woken roses lead into the Garden's gentle route",
	)

	shell.advance_journey(1.35)
	var garden_route: Dictionary = shell.presentation_evidence()
	test.expect(
		garden_route.get("journey_phase") == "birthday-star-approach"
		and garden_route.get("playful_bumps") == 2
		and garden_route.get("cloud_rests") == 0,
		"the Garden's two Playful Bumps stay well below a forced Cloud Rest",
	)
	shell.advance_journey(0.45)
	test.expect(
		shell.sound_event_evidence().back().get("event") == "sound-event.birthday-star-proximity",
		"the nearby Birthday Star shimmer is its own first stage",
	)
	shell.advance_journey(0.55)
	test.expect(
		shell.sound_event_evidence().back().get("event") == "sound-event.birthday-star-gathered",
		"the shared gather response is its own second stage",
	)
	shell.advance_journey(1.4)
	test.expect(
		shell.sound_event_evidence().back().get("event") == "sound-event.rainbow-path-opened",
		"Rainbow Path and Mom's travel resolve before the place-specific moment",
	)
	shell.advance_journey(2.5)
	var moment: Dictionary = shell.presentation_evidence()
	test.expect(
		moment.get("state") == "birthday_star_moment"
		and moment.get("birthday_stars") == ["birthday-star.rose-garden"]
		and moment.get("rainbow_paths") == ["rainbow-path.rose-garden"],
		"the Garden reaches Mom's Birthday Star Moment with her Star and Rainbow Path",
	)
	test.expect(
		shell.handle_player_intent("continue"),
		"Mom's Birthday Star Moment carries the journey onward",
	)
	var onward: Dictionary = shell.presentation_evidence()
	test.expect(
		onward.get("state") == "active_play"
		and onward.get("journey_phase") == "flight"
		and onward.get("place") == "lacewood",
		"the Garden hands the journey on to the next place rather than the celebration",
	)
	test.expect(
		shell.sound_event_evidence() == scenario.get("requiredSoundEvents", []),
		"the Garden emits exactly the shared scenario's semantic sequence",
	)
	shell.free()


## The Garden's cues at the engine-audio boundary: one crossfaded ambience slot,
## critical Birthday Star stages over optional detail, and safe fallbacks.
func _prove_place_soundscape() -> void:
	var pack_root := ProjectSettings.globalize_path("res://../../shared/edition")
	var audio := FakeEngineAudioAdapter.new()
	var clock := FakeClock.new()
	var soundscape := SOUNDSCAPE_PLAYER.new(pack_root, audio, clock.now_ms)

	test.expect(
		soundscape.report_event(&"sound-event.place-entry", {"place": "rose-garden"}),
		"entering the Garden starts its approved ambience",
	)
	var ambience: Dictionary = audio.playback_for(GARDEN_AMBIENCE)
	test.expect(
		ambience.get("slot") == "ambience"
		and ambience.get("looping") == true
		and ambience.get("crossfade_ms") == 600,
		"the Garden ambience owns the one ambience slot and crossfades into it",
	)
	test.expect(
		soundscape.report_event(
			&"sound-event.vignette-interaction",
			{"place": "rose-garden", "interaction": "awakening-roses"},
		)
		and audio.loaded_paths.back() == AWAKENING_ROSES,
		"the awakening roses resolve their own place-specific response",
	)
	test.expect(
		soundscape.report_event(
			&"sound-event.playful-bump",
			{"place": "rose-garden", "kind": "rose-garland"},
		)
		and audio.loaded_paths.back() == GARDEN_BUMP,
		"a Garden Playful Bump is place-specific rather than shared with the Lacewood",
	)
	var plays_after_bump := audio.played_streams.size()
	test.expect(
		not soundscape.report_event(
			&"sound-event.playful-bump",
			{"place": "rose-garden", "kind": "rose-garland"},
		),
		"a repeated Garden Playful Bump edge stays inside its cooldown",
	)
	test.expect(
		audio.played_streams.size() == plays_after_bump,
		"the suppressed Garden Playful Bump never reaches engine playback",
	)
	clock.advance(450)
	test.expect(
		soundscape.report_event(
			&"sound-event.playful-bump",
			{"place": "rose-garden", "kind": "rose-garland"},
		),
		"the Garden's next Playful Bump sounds once the place has moved on",
	)
	test.expect(
		soundscape.report_event(
			&"sound-event.near-miss",
			{"place": "rose-garden", "kind": "rose-garland"},
		)
		and audio.loaded_paths.back() == GARDEN_NEAR_MISS,
		"a Garden near miss is place-specific too",
	)
	var plays_after_near_miss := audio.played_streams.size()
	test.expect(
		not soundscape.report_event(
			&"sound-event.near-miss",
			{"place": "rose-garden", "kind": "rose-garland"},
		),
		"a repeated Garden near-miss edge stays inside its cooldown",
	)
	test.expect(
		audio.played_streams.size() == plays_after_near_miss,
		"the suppressed Garden near miss never reaches engine playback",
	)
	var near_miss_playback: Dictionary = audio.playback_for(GARDEN_NEAR_MISS)
	test.expect(
		near_miss_playback.get("category") == "optional-detail"
		and near_miss_playback.get("priority") == 20,
		"the optional Garden near miss stays in the detail category",
	)

	for shared_event: Array in [
		[&"sound-event.birthday-star-proximity", {"birthdayStar": "birthday-star.rose-garden"}],
		[&"sound-event.birthday-star-gathered", {"birthdayStar": "birthday-star.rose-garden"}],
		[&"sound-event.rainbow-path-opened", {
			"rainbowPath": "rainbow-path.rose-garden",
			"familyGuest": "Mom",
		}],
		[&"sound-event.birthday-star-moment", {"place": "rose-garden", "familyGuest": "Mom"}],
	]:
		test.expect(
			soundscape.report_event(shared_event[0], shared_event[1]),
			"the Garden's Birthday Star stage plays: %s" % shared_event[0],
		)
	test.expect(
		audio.loaded_paths.slice(-4) == [
			"source-media/soundscape/runtime/birthday-star-proximity.wav",
			BIRTHDAY_STAR_GATHER,
			RAINBOW_PATH_OPEN,
			GARDEN_STAR_MOMENT,
		],
		"gathering and Rainbow Path travel keep one shared identity while Mom's moment is the Garden's own",
	)
	for critical_path: String in [BIRTHDAY_STAR_GATHER, RAINBOW_PATH_OPEN, GARDEN_STAR_MOMENT]:
		var critical: Dictionary = audio.playback_for(critical_path)
		test.expect(
			critical.get("category") == "critical-foreground" and critical.get("priority") == 100,
			"%s preempts optional Garden detail at the global voice ceiling" % critical_path,
		)

	test.expect(
		soundscape.report_event(&"sound-event.place-exit", {"place": "rose-garden"}),
		"leaving the Garden is accepted",
	)
	test.expect(
		audio.faded_slots == [{"slot": "ambience", "fade_ms": 600}],
		"leaving the Garden crossfades its ambience out instead of orphaning the loop",
	)
	var loads_after_exit := audio.loaded_paths.size()
	test.expect(
		not soundscape.report_event(&"sound-event.place-exit", {"place": "rose-garden"}),
		"a place that has already been left cannot be left twice",
	)
	test.expect(
		soundscape.report_event(&"sound-event.place-entry", {"place": "lacewood"}),
		"the next place takes over the one ambience slot",
	)
	test.expect(
		audio.loaded_paths.slice(loads_after_exit) == [LACEWOOD_AMBIENCE],
		"the next place's ambience replaces the Garden's rather than layering over it",
	)

	var silent_audio := FakeEngineAudioAdapter.new()
	silent_audio.missing_paths = [GARDEN_NEAR_MISS, GARDEN_AMBIENCE]
	var silent_soundscape := SOUNDSCAPE_PLAYER.new(pack_root, silent_audio)
	test.expect(
		not silent_soundscape.report_event(&"sound-event.place-entry", {"place": "rose-garden"}),
		"an unavailable optional Garden ambience may remain silent",
	)
	test.expect(
		not silent_soundscape.report_event(
			&"sound-event.near-miss",
			{"place": "rose-garden", "kind": "rose-garland"},
		),
		"an unavailable optional Garden near miss may remain silent",
	)
	test.expect(
		silent_audio.played_streams.is_empty(),
		"optional Garden silence never synthesizes unrelated core feedback",
	)
	test.expect(
		silent_soundscape.report_event(
			&"sound-event.playful-bump",
			{"place": "rose-garden", "kind": "rose-garland"},
		),
		"missing optional Garden detail does not block the required responses",
	)

	var fallback_audio := FakeEngineAudioAdapter.new()
	fallback_audio.missing_paths = [GARDEN_BUMP, GARDEN_STAR_MOMENT]
	var fallback_soundscape := SOUNDSCAPE_PLAYER.new(pack_root, fallback_audio)
	test.expect(
		fallback_soundscape.report_event(
			&"sound-event.playful-bump",
			{"place": "rose-garden", "kind": "rose-garland"},
		)
		and fallback_audio.played_streams.back() == "synthesized-playful-bump",
		"a Garden Playful Bump falls back to the shared core synthesis",
	)
	test.expect(
		fallback_soundscape.report_event(
			&"sound-event.birthday-star-moment",
			{"place": "rose-garden", "familyGuest": "Mom"},
		)
		and fallback_audio.played_streams.back() == "synthesized-birthday-star",
		"Mom's Birthday Star Moment falls back to the shared Birthday Star synthesis",
	)
