extends SceneTree

const SOUNDSCAPE_PLAYER := preload("res://scripts/soundscape_player.gd")
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

	func play(stream: Variant, playback: Dictionary) -> bool:
		played_streams.append(stream)
		playback_settings.append(playback)
		if fail_music_playback and stream == "birthday-flight":
			return false
		return not fail_approved_playback or stream != "approved-confirmation"

	func stop_slot(slot: String) -> void:
		stopped_slots.append(slot)

	func set_sound_enabled(enabled: bool, delay_ms: int) -> void:
		sound_preference_changes.append({"enabled": enabled, "delay_ms": delay_ms})


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

	var archive_audio := FakeEngineAudioAdapter.new()
	var archived_soundscape := SOUNDSCAPE_PLAYER.new("res://edition-pack.zip", archive_audio)
	test.expect(
		archived_soundscape.report_event(
			&"sound-event.story-confirmation",
			{"action": "continue"},
		),
		"the semantic confirmation resolves from the immutable runtime Edition Pack",
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
		preference_soundscape.report_event(
			&"sound-event.sound-preference-changed",
			{"enabled": false},
		),
		"disabling Sound may play its semantic confirmation",
	)
	test.expect(
		preference_audio.playback_settings.back().get("max_duration_ms") <= 200,
		"the sound-off confirmation is capped at 200 milliseconds",
	)
	test.expect(
		preference_audio.sound_preference_changes == [
			{"enabled": false, "delay_ms": 200},
		],
		"the single Sound preference mutes every category after its capped confirmation",
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
	test.expect(
		preference_soundscape.report_event(
			&"sound-event.sound-preference-changed",
			{"enabled": true},
		),
		"enabling Sound may play its semantic confirmation",
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
