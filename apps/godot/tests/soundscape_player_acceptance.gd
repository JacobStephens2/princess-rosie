extends SceneTree

const SOUNDSCAPE_PLAYER := preload("res://scripts/soundscape_player.gd")
const SOUNDSCAPE_PLAYBACK := preload("res://scripts/soundscape_playback.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")


class FakeEngineAudioAdapter extends RefCounted:
	var asset_available := true
	var fail_approved_playback := false
	var fail_music_playback := false
	var music_asset_available := true
	var missing_paths: Array[String] = []
	var loaded_paths: Array[String] = []
	var played_streams: Array[Variant] = []
	var playback_settings: Array[Dictionary] = []
	var playback_requests_are_typed := true
	var loaded_music_paths: Array[String] = []
	var stopped_slots: Array[String] = []
	var sound_preference_changes: Array[Dictionary] = []

	func load_wav(_pack_source: String, relative_path: String) -> Variant:
		loaded_paths.append(relative_path)
		if not asset_available or missing_paths.has(relative_path):
			return null
		return "approved-confirmation" if relative_path.ends_with("story-confirmation.wav") else relative_path

	func load_mp3(_pack_source: String, relative_path: String) -> Variant:
		loaded_music_paths.append(relative_path)
		return "birthday-flight" if music_asset_available else null

	func synthesize_music() -> Variant:
		return "synthesized-music"

	func synthesize_confirmation() -> Variant:
		return "synthesized-confirmation"

	func synthesize_birthday_star() -> Variant:
		return "synthesized-birthday-star"

	func synthesize_playful_bump() -> Variant:
		return "synthesized-playful-bump"

	func synthesize_cloud_rest() -> Variant:
		return "synthesized-cloud-rest"

	func synthesize_celebration() -> Variant:
		return "synthesized-celebration"

	func play(stream: Variant, playback: Variant) -> bool:
		played_streams.append(stream)
		if playback is SOUNDSCAPE_PLAYBACK:
			playback_settings.append({
				"bus": playback.bus,
				"category": playback.category,
				"slot": playback.slot,
				"gain_db": playback.gain_db,
				"priority": playback.priority,
				"looping": playback.looping,
				"max_duration_ms": playback.max_duration_ms,
				"music_duck_db": playback.music_duck_db,
				"crossfade_ms": playback.crossfade_ms,
			})
		else:
			playback_requests_are_typed = false
			playback_settings.append(playback)
		if fail_music_playback and stream == "birthday-flight":
			return false
		return not fail_approved_playback or stream != "approved-confirmation"

	func stop_slot(slot: String) -> void:
		stopped_slots.append(slot)

	func set_sound_enabled(enabled: bool, delay_ms: int) -> void:
		sound_preference_changes.append({"enabled": enabled, "delay_ms": delay_ms})


class FakeClock extends RefCounted:
	var milliseconds := 1_000

	func now_ms() -> int:
		return milliseconds

	func advance(elapsed_ms: int) -> void:
		milliseconds += elapsed_ms


var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	var opening_audio := FakeEngineAudioAdapter.new()
	var opening_pack := ProjectSettings.globalize_path(
		"res://tests/fixtures/opening-flight-pack",
	)
	var opening_soundscape := SOUNDSCAPE_PLAYER.new(opening_pack, opening_audio)
	var opening_events := [
		[&"sound-event.opening-storybook-moment", {"moment": "opening.celebration-preparations"}],
		[&"sound-event.opening-storybook-moment", {"moment": "opening.scattered-stars"}],
		[&"sound-event.opening-storybook-moment", {"moment": "opening.departure"}],
		[&"sound-event.flight-launch", {}],
		[&"sound-event.movement-state", {"state": "flight"}],
		[&"sound-event.movement-state", {"state": "rise"}],
	]
	for semantic_event: Array in opening_events:
		test.expect(
			opening_soundscape.report_event(semantic_event[0], semantic_event[1]),
			"the opening-to-flight semantic event plays: %s" % semantic_event[0],
		)
	var plays_before_repeated_rise := opening_audio.played_streams.size()
	test.expect(
		not opening_soundscape.report_event(
			&"sound-event.movement-state",
			{"state": "rise"},
		),
		"a repeated rise state does not emit another response",
	)
	test.expect(
		opening_audio.played_streams.size() == plays_before_repeated_rise,
		"repeated movement state does not reach engine playback",
	)
	test.expect(
		opening_soundscape.report_event(
			&"sound-event.movement-state",
			{"state": "glide"},
		),
		"release to glide emits its response on the semantic edge",
	)
	var plays_before_animation_detail := opening_audio.played_streams.size()
	test.expect(
		not opening_soundscape.report_event(&"sound-event.wing-animation", {"frame": 4}),
		"per-frame wing details are not soundscape events",
	)
	test.expect(
		opening_audio.played_streams.size() == plays_before_animation_detail,
		"high-frequency animation details stay aggregated in movement texture",
	)
	test.expect(
		opening_audio.loaded_music_paths == ["audio/birthday-flight.mp3"],
		"the bundled instrumental starts once for the opening-to-flight sequence",
	)
	test.expect(
		opening_audio.loaded_paths == [
			"source-media/soundscape/runtime/opening-celebration-reveal.wav",
			"source-media/soundscape/runtime/opening-star-scatter.wav",
			"source-media/soundscape/runtime/opening-departure.wav",
			"source-media/soundscape/runtime/flight-launch.wav",
			"source-media/soundscape/runtime/movement-flight.wav",
			"source-media/soundscape/runtime/movement-rise.wav",
			"source-media/soundscape/runtime/movement-glide.wav",
		],
		"canonical runtime mappings select specific opening cues and semantic movement edges",
	)
	var music_playback: Dictionary = (
		opening_audio.playback_settings[0]
		if opening_audio.playback_settings.size() > 0
		else {}
	)
	var opening_playback: Dictionary = (
		opening_audio.playback_settings[1]
		if opening_audio.playback_settings.size() > 1
		else {}
	)
	var movement_playback: Dictionary = (
		opening_audio.playback_settings[5]
		if opening_audio.playback_settings.size() > 5
		else {}
	)
	test.expect(
		music_playback.get("slot") == "music"
		and music_playback.get("looping") == true
		and music_playback.get("gain_db") == -6.7,
		"music loops near the established apparent reference level",
	)
	test.expect(
		opening_playback.get("category") == "critical-foreground"
		and opening_playback.get("music_duck_db") == -4,
		"critical opening cues use the critical foreground category and duck music",
	)
	test.expect(
		movement_playback.get("slot") == "movement"
		and movement_playback.get("looping") == true
		and movement_playback.get("gain_db") == -16.7,
		"flight owns one quiet continuous movement layer",
	)
	test.expect(
		opening_audio.playback_requests_are_typed,
		"the player sends typed playback requests across the engine-audio boundary",
	)
	test.expect(
		opening_soundscape.report_event(
			&"sound-event.movement-state",
			{"state": "flight"},
		),
		"flight can become the base movement state again",
	)
	test.expect(
		opening_soundscape.report_event(
			&"sound-event.replay",
			{"destination": "opening-storybook"},
		),
		"replay is accepted through the semantic interface",
	)
	test.expect(
		opening_audio.stopped_slots == ["movement", "ambience", "foreground"],
		"replay clears persistent journey layers",
	)
	test.expect(
		opening_soundscape.report_event(
			&"sound-event.movement-state",
			{"state": "flight"},
		),
		"the next journey can restart the flight movement edge",
	)
	test.expect(
		opening_soundscape.report_event(
			&"sound-event.opening-storybook-moment",
			{"moment": "opening.ordinary"},
		),
		"an ordinary Opening Storybook Moment selects the gentle confirmation",
	)
	test.expect(
		opening_audio.loaded_paths.back()
		== "source-media/soundscape/runtime/story-confirmation.wav",
		"the ordinary opening confirmation uses its approved runtime mapping",
	)

	var missing_music_audio := FakeEngineAudioAdapter.new()
	missing_music_audio.music_asset_available = false
	var missing_music_soundscape := SOUNDSCAPE_PLAYER.new(opening_pack, missing_music_audio)
	test.expect(
		missing_music_soundscape.report_event(
			&"sound-event.opening-storybook-moment",
			{"moment": "opening.celebration-preparations"},
		),
		"a failed soundtrack does not block the opening",
	)
	test.expect(
		missing_music_audio.played_streams[0] == "synthesized-music",
		"a failed core soundtrack chooses its local synthesized fallback",
	)
	var failed_music_audio := FakeEngineAudioAdapter.new()
	failed_music_audio.fail_music_playback = true
	var failed_music_soundscape := SOUNDSCAPE_PLAYER.new(opening_pack, failed_music_audio)
	test.expect(
		failed_music_soundscape.report_event(
			&"sound-event.opening-storybook-moment",
			{"moment": "opening.celebration-preparations"},
		),
		"failed soundtrack playback does not block the opening",
	)
	test.expect(
		failed_music_audio.played_streams.slice(0, 2) == [
			"birthday-flight",
			"synthesized-music",
		],
		"failed soundtrack playback retries with the local synthesized music fallback",
	)

	var audio := FakeEngineAudioAdapter.new()
	var pack_root := ProjectSettings.globalize_path("res://../../shared/edition")
	var soundscape := SOUNDSCAPE_PLAYER.new(pack_root, audio)
	var edge_audio := FakeEngineAudioAdapter.new()
	var edge_clock := FakeClock.new()
	var edge_soundscape := SOUNDSCAPE_PLAYER.new(
		pack_root,
		edge_audio,
		edge_clock.now_ms,
	)
	test.expect(
		edge_soundscape.report_event(
			&"sound-event.near-miss",
			{"place": "lacewood", "kind": "silver-ribbon"},
		),
		"a Lacewood near miss sounds on its state edge",
	)
	test.expect(
		not edge_soundscape.report_event(
			&"sound-event.near-miss",
			{"place": "lacewood", "kind": "silver-ribbon"},
		),
		"a per-frame near-miss repeat is suppressed during cooldown",
	)
	edge_clock.advance(750)
	test.expect(
		edge_soundscape.report_event(
			&"sound-event.near-miss",
			{"place": "lacewood", "kind": "silver-ribbon"},
		),
		"a later Lacewood near-miss edge may sound after cooldown",
	)
	test.expect(
		edge_soundscape.report_event(
			&"sound-event.birthday-star-proximity",
			{"birthdayStar": "birthday-star.lacewood"},
		),
		"Birthday Star proximity starts one capped shimmer",
	)
	edge_clock.advance(750)
	test.expect(
		not edge_soundscape.report_event(
			&"sound-event.birthday-star-proximity",
			{"birthdayStar": "birthday-star.lacewood"},
		),
		"Birthday Star visual pulses cannot retrigger the capped shimmer",
	)
	var crossing_audio := FakeEngineAudioAdapter.new()
	var crossing_soundscape := SOUNDSCAPE_PLAYER.new(pack_root, crossing_audio)
	for crossed_place: String in ["rose-garden", "lacewood"]:
		test.expect(
			crossing_soundscape.report_event(
				&"sound-event.place-entry",
				{"place": crossed_place},
			),
			"%s answers with its own place ambience" % crossed_place,
		)
	test.expect(
		crossing_audio.loaded_paths == [
			"source-media/soundscape/runtime/place-rose-garden.wav",
			"source-media/soundscape/runtime/place-lacewood.wav",
		],
		"crossing places asks for one place loop each: %s"
		% JSON.stringify(crossing_audio.loaded_paths),
	)
	var crossing_playbacks := crossing_audio.playback_settings
	test.expect(
		crossing_playbacks.size() == 2
		and crossing_playbacks.all(func(playback: Dictionary) -> bool:
			return (
				playback.get("slot") == "ambience"
				and playback.get("looping") == true
				and playback.get("crossfade_ms") == 600
			)),
		"both place loops claim the one ambience slot with the authored crossfade: %s"
		% JSON.stringify(crossing_playbacks),
	)
	test.expect(
		crossing_audio.stopped_slots.is_empty(),
		"crossing places never cuts the ambience slot to silence first",
	)

	var rest_audio := FakeEngineAudioAdapter.new()
	var rest_soundscape := SOUNDSCAPE_PLAYER.new(pack_root, rest_audio)
	var lacewood_rest_events := [
		[&"sound-event.movement-state", {"state": "flight"}],
		[&"sound-event.place-entry", {"place": "lacewood"}],
		[&"sound-event.playful-bump", {"place": "lacewood", "kind": "silver-ribbon"}],
		[&"sound-event.playful-bump", {"place": "lacewood", "kind": "silver-ribbon"}],
		[&"sound-event.playful-bump", {"place": "lacewood", "kind": "silver-ribbon"}],
	]
	for semantic_event: Array in lacewood_rest_events:
		test.expect(
			rest_soundscape.report_event(semantic_event[0], semantic_event[1]),
			"the Lacewood pre-rest sequence plays: %s" % semantic_event[0],
		)
	test.expect(
		rest_soundscape.report_event(
			&"sound-event.cloud-rest-entered",
			{},
		),
		"Cloud Rest accepts the landing transition",
	)
	test.expect(
		rest_audio.stopped_slots == ["foreground", "movement", "ambience"],
		"Cloud Rest cancels the third Playful Bump tail and replaces movement and ambience",
	)
	test.expect(
		rest_audio.loaded_paths.slice(-2) == [
			"source-media/soundscape/runtime/cloud-rest-enter.wav",
			"source-media/soundscape/runtime/cloud-rest-ambience.wav",
		],
		"Cloud Rest schedules its reassuring landing and gentle loop together",
	)
	var rest_playbacks := rest_audio.playback_settings.slice(-2)
	test.expect(
		rest_playbacks[0].get("category") == "critical-foreground"
		and rest_playbacks[1].get("slot") == "ambience"
		and rest_playbacks[1].get("looping") == true,
		"the landing preempts optional detail while the rest loop owns the one ambience slot",
	)
	test.expect(
		rest_soundscape.report_event(
			&"sound-event.cloud-rest-exited",
			{},
		),
		"Cloud Rest accepts immediate resume",
	)
	test.expect(
		rest_audio.loaded_paths.slice(-3) == [
			"source-media/soundscape/runtime/cloud-rest-exit.wav",
			"source-media/soundscape/runtime/place-lacewood.wav",
			"source-media/soundscape/runtime/movement-flight.wav",
		],
		"resume restores the correct Lacewood ambience and flight layer after its takeoff cue",
	)
	var muted_rest_audio := FakeEngineAudioAdapter.new()
	var muted_rest_soundscape := SOUNDSCAPE_PLAYER.new(pack_root, muted_rest_audio)
	test.expect(
		muted_rest_soundscape.report_event(
			&"sound-event.movement-state",
			{"state": "flight"},
		),
		"the pre-mute flight layer starts",
	)
	test.expect(
		muted_rest_soundscape.report_event(
			&"sound-event.place-entry",
			{"place": "lacewood"},
		),
		"the pre-mute Lacewood layer starts",
	)
	test.expect(
		not muted_rest_soundscape.report_event(
			&"sound-event.sound-preference-changed",
			{"enabled": false},
		),
		"Sound can be disabled silently before a semantic state change",
	)
	var loaded_before_muted_rest := muted_rest_audio.loaded_paths.size()
	test.expect(
		not muted_rest_soundscape.report_event(
			&"sound-event.cloud-rest-entered",
			{},
		),
		"muted Cloud Rest state does not start audible media",
	)
	test.expect(
		muted_rest_audio.stopped_slots.slice(-3) == ["foreground", "movement", "ambience"],
		"muted Cloud Rest still clears stale foreground, flight, and Lacewood slots",
	)
	test.expect(
		muted_rest_audio.loaded_paths.size() == loaded_before_muted_rest,
		"muted Cloud Rest performs no hidden media playback",
	)
	test.expect(
		muted_rest_soundscape.report_event(
			&"sound-event.sound-preference-changed",
			{"enabled": true},
		),
		"enabling Sound reconciles the current semantic state",
	)
	var enabled_rest_paths := muted_rest_audio.loaded_paths.slice(loaded_before_muted_rest)
	test.expect(
		enabled_rest_paths.has("source-media/soundscape/runtime/cloud-rest-ambience.wav")
		and not enabled_rest_paths.has("source-media/soundscape/runtime/place-lacewood.wav")
		and not enabled_rest_paths.has("source-media/soundscape/runtime/movement-flight.wav"),
		"Sound enabled during Cloud Rest restores only the rest loop, never stale flight",
	)
	var fallback_audio := FakeEngineAudioAdapter.new()
	fallback_audio.asset_available = false
	var core_fallback_soundscape := SOUNDSCAPE_PLAYER.new(pack_root, fallback_audio)
	test.expect(
		core_fallback_soundscape.report_event(
			&"sound-event.birthday-star-gathered",
			{"birthdayStar": "birthday-star.lacewood"},
		),
		"Birthday Star progression continues when its approved cue cannot load",
	)
	test.expect(
		(
			fallback_audio.played_streams.back()
			if not fallback_audio.played_streams.is_empty()
			else ""
		) == "synthesized-birthday-star",
		"Birthday Star failure selects its recognizable local synthesized fallback",
	)
	test.expect(
		core_fallback_soundscape.report_event(
			&"sound-event.playful-bump",
			{"place": "lacewood", "kind": "silver-ribbon"},
		),
		"a Playful Bump remains gentle feedback when its approved cue cannot load",
	)
	test.expect(
		(
			fallback_audio.played_streams.back()
			if not fallback_audio.played_streams.is_empty()
			else ""
		) == "synthesized-playful-bump",
		"Playful Bump failure selects its soft local synthesized fallback",
	)
	test.expect(
		core_fallback_soundscape.report_event(
			&"sound-event.cloud-rest-entered",
			{},
		),
		"Cloud Rest progression continues when its approved landing and loop cannot load",
	)
	test.expect(
		fallback_audio.played_streams.slice(-2) == [
			"synthesized-cloud-rest",
			"synthesized-cloud-rest",
		],
		"Cloud Rest failure selects local fallbacks for the landing and owned ambience",
	)
	test.expect(
		core_fallback_soundscape.report_event(&"sound-event.birthday-castle-arrival", {}),
		"the celebration remains audible before its authored cue is approved",
	)
	test.expect(
		fallback_audio.played_streams.back() == "synthesized-celebration",
		"celebration failure selects its warm local synthesized fallback",
	)
	var plays_before_missing_optional := fallback_audio.played_streams.size()
	test.expect(
		not core_fallback_soundscape.report_event(
			&"sound-event.near-miss",
			{"place": "lacewood", "kind": "silver-ribbon"},
		),
		"an unavailable optional near-miss cue may remain silent",
	)
	test.expect(
		fallback_audio.played_streams.size() == plays_before_missing_optional,
		"optional silence does not synthesize unrelated core feedback",
	)

	var played: bool = soundscape.report_event(
		&"sound-event.story-confirmation",
		{"action": "continue"},
	)

	test.expect(played, "the semantic confirmation event plays")
	test.expect(
		audio.loaded_paths == ["source-media/soundscape/runtime/story-confirmation.wav"],
		"the approved Edition Pack runtime asset is resolved at the engine boundary",
	)
	test.expect(
		audio.played_streams == ["approved-confirmation"],
		"the approved cue reaches the engine audio adapter",
	)
	test.expect(
		audio.playback_settings[0].get("gain_db") == -3.7,
		"ordinary foreground sits three decibels above the music reference gain",
	)

	var missing_asset_audio := FakeEngineAudioAdapter.new()
	missing_asset_audio.asset_available = false
	var fallback_soundscape := SOUNDSCAPE_PLAYER.new(pack_root, missing_asset_audio)
	var fallback_played: bool = fallback_soundscape.report_event(
		&"sound-event.story-confirmation",
		{"action": "continue"},
	)
	test.expect(fallback_played, "a missing confirmation asset does not block feedback")
	test.expect(
		missing_asset_audio.played_streams == ["synthesized-confirmation"],
		"a missing confirmation asset selects the local synthesized fallback",
	)

	var failed_playback_audio := FakeEngineAudioAdapter.new()
	failed_playback_audio.fail_approved_playback = true
	var failed_playback_soundscape := SOUNDSCAPE_PLAYER.new(pack_root, failed_playback_audio)
	test.expect(
		failed_playback_soundscape.report_event(
			&"sound-event.story-confirmation",
			{"action": "continue"},
		),
		"failed approved-cue playback does not block feedback",
	)
	test.expect(
		failed_playback_audio.played_streams == [
			"approved-confirmation",
			"synthesized-confirmation",
		],
		"failed approved-cue playback selects the local synthesized fallback",
	)

	var preference_audio := FakeEngineAudioAdapter.new()
	var preference_soundscape := SOUNDSCAPE_PLAYER.new(pack_root, preference_audio)
	test.expect(
		not preference_soundscape.report_event(
			&"sound-event.sound-preference-changed",
			{"enabled": false},
		),
		"the Grown-up Corner turns Sound off without a cue of its own",
	)
	test.expect(
		preference_audio.played_streams.is_empty(),
		"turning Sound off reaches no engine playback",
	)
	test.expect(
		preference_audio.sound_preference_changes == [
			{"enabled": false, "delay_ms": 0},
		],
		"the single Sound preference mutes every category immediately",
	)
	var plays_after_disabling := preference_audio.played_streams.size()
	test.expect(
		preference_soundscape.report_event(
			&"sound-event.replay",
			{"destination": "opening-storybook"},
		),
		"replay remains accepted while Sound is disabled",
	)
	test.expect(
		preference_audio.stopped_slots == ["movement", "ambience", "foreground"],
		"muted replay still clears persistent journey layers",
	)
	test.expect(
		not preference_soundscape.report_event(
			&"sound-event.story-confirmation",
			{"action": "continue"},
		),
		"the Sound preference suppresses confirmation playback while disabled",
	)
	test.expect(
		preference_audio.played_streams.size() == plays_after_disabling,
		"disabled Sound does not reach engine playback",
	)
	var plays_before_enabling := preference_audio.played_streams.size()
	test.expect(
		preference_soundscape.report_event(
			&"sound-event.sound-preference-changed",
			{"enabled": true},
		),
		"enabling Sound restores the mixer",
	)
	test.expect(
		preference_audio.played_streams.slice(plays_before_enabling) == ["birthday-flight"],
		"the Grown-up Corner turns Sound back on without a cue of its own",
	)
	test.expect(
		preference_audio.sound_preference_changes.back() == {"enabled": true, "delay_ms": 0},
		"enabling the same Sound preference restores every category immediately",
	)
	test.expect(
		preference_soundscape.report_event(
			&"sound-event.story-confirmation",
			{"action": "continue"},
		),
		"enabling Sound restores confirmation playback",
	)

	test.finish(self, "Soundscape Player acceptance")
