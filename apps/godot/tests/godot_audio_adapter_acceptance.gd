extends SceneTree

const GODOT_AUDIO_ADAPTER := preload("res://scripts/godot_audio_adapter.gd")
const SOUNDSCAPE_PLAYBACK := preload("res://scripts/soundscape_playback.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")
const CONFIRMATION_PATH := "source-media/soundscape/masters/story-confirmation.wav"
const OPENING_FLIGHT_CUE_PATHS := [
	"source-media/soundscape/runtime/opening-celebration-reveal.wav",
	"source-media/soundscape/runtime/opening-star-scatter.wav",
	"source-media/soundscape/runtime/opening-departure.wav",
	"source-media/soundscape/runtime/flight-launch.wav",
	"source-media/soundscape/runtime/movement-flight.wav",
	"source-media/soundscape/runtime/movement-rise.wav",
	"source-media/soundscape/runtime/movement-glide.wav",
]
const LACEWOOD_CUE_PATHS := [
	"source-media/soundscape/runtime/place-lacewood.wav",
	"source-media/soundscape/runtime/vignette-lacewood-canopy.wav",
	"source-media/soundscape/runtime/vignette-lacewood-floor.wav",
	"source-media/soundscape/runtime/playful-bump-lacewood.wav",
	"source-media/soundscape/runtime/near-miss.wav",
	"source-media/soundscape/runtime/birthday-star-proximity.wav",
	"source-media/soundscape/runtime/birthday-star-gather.wav",
	"source-media/soundscape/runtime/rainbow-path-open.wav",
	"source-media/soundscape/runtime/birthday-star-moment-lacewood.wav",
	"source-media/soundscape/runtime/cloud-rest-enter.wav",
	"source-media/soundscape/runtime/cloud-rest-ambience.wav",
	"source-media/soundscape/runtime/cloud-rest-exit.wav",
]

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	_run.call_deferred()


func _run() -> void:
	var audio := GODOT_AUDIO_ADAPTER.new()
	root.add_child(audio)
	await process_frame
	var pack_root := ProjectSettings.globalize_path(ACCEPTANCE_TEST.PACK_ROOT)
	var approved_stream: Variant = audio.load_wav(pack_root, CONFIRMATION_PATH)
	test.expect(approved_stream is AudioStreamWAV, "Godot decodes the approved Edition Pack WAV")
	if approved_stream is AudioStreamWAV:
		test.expect(approved_stream.mix_rate == 48000, "the approved 48 kHz master reaches Godot unchanged")
		test.expect(not approved_stream.stereo, "the approved focused-mono master stays mono")
	for cue_path: String in OPENING_FLIGHT_CUE_PATHS + LACEWOOD_CUE_PATHS:
		var cue_stream: Variant = audio.load_wav(pack_root, cue_path)
		test.expect(
			cue_stream is AudioStreamWAV,
			"the immutable Edition Pack includes the approved runtime cue: %s" % cue_path,
		)
		if cue_stream is AudioStreamWAV:
			test.expect(cue_stream.mix_rate == 48000, "%s decodes at 48 kHz" % cue_path)
			test.expect(
				cue_stream.stereo == _expects_stereo(cue_path),
				"%s retains its authored channel policy" % cue_path,
			)

	var fallback_stream: Variant = audio.synthesize_confirmation()
	test.expect(fallback_stream is AudioStreamWAV, "the fallback is an engine-native WAV stream")
	if fallback_stream is AudioStreamWAV:
		test.expect(fallback_stream.mix_rate == 48000, "the local fallback is synthesized at 48 kHz")
		test.expect(not fallback_stream.stereo, "the local fallback is focused mono")
		test.expect(not fallback_stream.data.is_empty(), "the local fallback contains synthesized PCM")
	for fallback_method: StringName in [
		&"synthesize_birthday_star",
		&"synthesize_playful_bump",
		&"synthesize_cloud_rest",
		&"synthesize_celebration",
	]:
		var core_fallback: Variant = (
			audio.call(fallback_method)
			if audio.has_method(fallback_method)
			else null
		)
		test.expect(
			core_fallback is AudioStreamWAV,
			"%s returns local engine-native PCM" % fallback_method,
		)
		if core_fallback is AudioStreamWAV:
			test.expect(
				core_fallback.mix_rate == 48000
				and not core_fallback.stereo
				and not core_fallback.data.is_empty(),
				"%s remains a focused, non-empty 48 kHz fallback" % fallback_method,
			)

	var soundtrack: Variant = audio.load_mp3(
		pack_root,
		"source-media/soundscape/music/birthday-flight.mp3",
	) if audio.has_method("load_mp3") else null
	test.expect(soundtrack is AudioStreamMP3, "Godot decodes the bundled instrumental locally")
	var fallback_music: Variant = (
		audio.synthesize_music()
		if audio.has_method("synthesize_music")
		else null
	)
	test.expect(fallback_music is AudioStreamWAV, "music failure has a local synthesized fallback")

	test.expect(AudioServer.get_bus_index(&"Sound") >= 0, "Godot provides the dedicated Sound bus")
	var sound_bus_index := AudioServer.get_bus_index(&"Sound")
	var limiter: Variant = (
		AudioServer.get_bus_effect(sound_bus_index, 0)
		if sound_bus_index >= 0 and AudioServer.get_bus_effect_count(sound_bus_index) > 0
		else null
	)
	test.expect(limiter is AudioEffectHardLimiter, "the summed Sound bus uses an engine-native hard limiter")
	if limiter is AudioEffectHardLimiter:
		test.expect(limiter.ceiling_db == -3.0, "the summed signal has a -3 dBFS ceiling")
	for bus_name: StringName in [
		&"Music",
		&"Ambience",
		&"Movement",
		&"Foreground",
		&"Critical",
		&"Detail",
	]:
		test.expect(
			AudioServer.get_bus_index(bus_name) >= 0,
			"Godot provides the internal %s category bus" % bus_name,
		)

	if soundtrack is AudioStreamMP3 and fallback_stream is AudioStreamWAV:
		test.expect(audio.play(soundtrack, SOUNDSCAPE_PLAYBACK.new(
			&"Music", &"music", SOUNDSCAPE_PLAYBACK.SLOT_MUSIC, -6.7, 0, true, 0,
		)), "the soundtrack occupies its one music slot")
		test.expect(audio.play(fallback_stream, SOUNDSCAPE_PLAYBACK.new(
			&"Movement", &"movement", SOUNDSCAPE_PLAYBACK.SLOT_MOVEMENT,
			-10.0, 40, true, 0,
		)), "one continuous movement layer can play with music")
		var detail_playback := SOUNDSCAPE_PLAYBACK.new(
			&"Detail", &"optional-detail", SOUNDSCAPE_PLAYBACK.SLOT_FOREGROUND,
			-10.0, 20, false, 0,
		)
		test.expect(audio.play(fallback_stream, detail_playback), "the first foreground voice plays")
		test.expect(audio.play(fallback_stream, detail_playback), "the second foreground voice plays")
		test.expect(
			not audio.play(fallback_stream, detail_playback),
			"a third ordinary foreground voice cannot exceed the global ceiling",
		)
		var critical_playback := SOUNDSCAPE_PLAYBACK.new(
			&"Critical", &"critical-foreground", SOUNDSCAPE_PLAYBACK.SLOT_FOREGROUND,
			3.0, 100, false, 0, -4.0,
		)
		test.expect(
			audio.play(fallback_stream, critical_playback),
			"a critical foreground cue preempts optional detail at the ceiling",
		)
		test.expect(
			audio.play(fallback_stream, critical_playback),
			"a second critical opening cue preempts the remaining optional detail",
		)
		test.expect(
			audio.play(fallback_stream, critical_playback),
			"a newer critical opening cue replaces an older critical cue at the ceiling",
		)

	test.expect(
		audio.has_method("set_sound_enabled"),
		"the adapter supports the one Sound presentation preference",
	)
	if audio.has_method("set_sound_enabled"):
		audio.set_sound_enabled(false, 0)
		test.expect(
			AudioServer.is_bus_mute(AudioServer.get_bus_index(&"Sound")),
			"disabling Sound mutes every internal category through their parent bus",
		)
		audio.set_sound_enabled(true, 0)
		test.expect(
			not AudioServer.is_bus_mute(AudioServer.get_bus_index(&"Sound")),
			"enabling Sound restores every internal category",
		)
	audio.stop_slot("foreground")
	if fallback_stream is AudioStreamWAV:
		var looping_detail := SOUNDSCAPE_PLAYBACK.new(
			&"Detail", &"looping-detail", SOUNDSCAPE_PLAYBACK.SLOT_FOREGROUND,
			-10.0, 20, true, 0,
		)
		test.expect(audio.play(fallback_stream, looping_detail), "a looping cue takes a voice")
		test.expect(audio.play(fallback_stream, looping_detail), "a second looping cue takes the last voice")
		await create_timer(0.6).timeout
		test.expect(
			not audio.play(fallback_stream, looping_detail),
			"a looping cue keeps sounding past the length of its own asset",
		)

	audio.stop_slot("foreground")
	audio.stop_slot("movement")
	audio.stop_slot("ambience")
	audio.stop_slot("music")
	approved_stream = null
	fallback_stream = null
	soundtrack = null
	fallback_music = null
	await create_timer(0.1).timeout
	audio.queue_free()
	await create_timer(0.1).timeout
	test.finish(self, "Godot audio adapter acceptance")


func _expects_stereo(cue_path: String) -> bool:
	return (
		cue_path.ends_with("movement-flight.wav")
		or cue_path.ends_with("place-lacewood.wav")
		or cue_path.ends_with("rainbow-path-open.wav")
		or cue_path.ends_with("cloud-rest-ambience.wav")
	)
