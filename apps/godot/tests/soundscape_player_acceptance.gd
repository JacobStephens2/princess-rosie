extends SceneTree

const SOUNDSCAPE_PLAYER := preload("res://scripts/soundscape_player.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")


class FakeEngineAudioAdapter extends RefCounted:
	var asset_available := true
	var fail_approved_playback := false
	var loaded_paths: Array[String] = []
	var played_streams: Array[Variant] = []
	var playback_settings: Array[Dictionary] = []

	func load_wav(_pack_source: String, relative_path: String) -> Variant:
		loaded_paths.append(relative_path)
		return "approved-confirmation" if asset_available else null

	func synthesize_confirmation() -> Variant:
		return "synthesized-confirmation"

	func play(stream: Variant, playback: Dictionary) -> bool:
		played_streams.append(stream)
		playback_settings.append(playback)
		return not fail_approved_playback or stream != "approved-confirmation"


var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	var audio := FakeEngineAudioAdapter.new()
	var pack_root := ProjectSettings.globalize_path("res://../../shared/edition")
	var soundscape := SOUNDSCAPE_PLAYER.new(pack_root, audio)

	var played: bool = soundscape.report_event(
		&"sound-event.story-confirmation",
		{"action": "continue"},
	)

	test.expect(played, "the semantic confirmation event plays")
	test.expect(
		audio.loaded_paths == ["source-media/soundscape/masters/story-confirmation.wav"],
		"the approved Edition Pack master is resolved at the engine boundary",
	)
	test.expect(
		audio.played_streams == ["approved-confirmation"],
		"the approved cue reaches the engine audio adapter",
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
	var plays_after_disabling := preference_audio.played_streams.size()
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
		preference_soundscape.report_event(
			&"sound-event.story-confirmation",
			{"action": "continue"},
		),
		"enabling Sound restores confirmation playback",
	)

	test.finish(self, "Soundscape Player acceptance")
