extends SceneTree

const GODOT_AUDIO_ADAPTER := preload("res://scripts/godot_audio_adapter.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")
const CONFIRMATION_PATH := "source-media/soundscape/masters/story-confirmation.wav"

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	_run.call_deferred()


func _run() -> void:
	var audio := GODOT_AUDIO_ADAPTER.new()
	root.add_child(audio)
	await process_frame
	var approved_stream: Variant = audio.load_wav("res://edition-pack.zip", CONFIRMATION_PATH)
	test.expect(approved_stream is AudioStreamWAV, "Godot decodes the approved Edition Pack WAV")
	if approved_stream is AudioStreamWAV:
		test.expect(approved_stream.mix_rate == 48000, "the approved 48 kHz master reaches Godot unchanged")
		test.expect(not approved_stream.stereo, "the approved focused-mono master stays mono")

	var fallback_stream: Variant = audio.synthesize_confirmation()
	test.expect(fallback_stream is AudioStreamWAV, "the fallback is an engine-native WAV stream")
	if fallback_stream is AudioStreamWAV:
		test.expect(fallback_stream.mix_rate == 48000, "the local fallback is synthesized at 48 kHz")
		test.expect(not fallback_stream.stereo, "the local fallback is focused mono")
		test.expect(not fallback_stream.data.is_empty(), "the local fallback contains synthesized PCM")

	test.expect(AudioServer.get_bus_index(&"Sound") >= 0, "Godot provides the dedicated Sound bus")
	audio.free()
	approved_stream = null
	fallback_stream = null
	test.finish(self, "Godot audio adapter acceptance")
