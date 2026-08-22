extends SceneTree

const SOUNDSCAPE_PLAYER := preload("res://scripts/soundscape_player.gd")
const GODOT_AUDIO_ADAPTER := preload("res://scripts/godot_audio_adapter.gd")
const CONFIRMATION_EVENT := &"sound-event.story-confirmation"
const CONFIRMATION_PARAMETERS := {"action": "continue"}


func _init() -> void:
	_run.call_deferred()


func _run() -> void:
	var audio := GODOT_AUDIO_ADAPTER.new()
	root.add_child(audio)
	await process_frame

	print("PLAYING: approved Edition Pack confirmation")
	var approved := SOUNDSCAPE_PLAYER.new("res://edition-pack.zip", audio)
	if not approved.report_event(CONFIRMATION_EVENT, CONFIRMATION_PARAMETERS):
		push_error("The approved Edition Pack confirmation could not play")
		audio.free()
		quit(1)
		return
	await create_timer(0.85).timeout

	print("PLAYING: synthesized fallback for intentionally missing confirmation")
	var missing_pack := ProjectSettings.globalize_path(
		"res://tests/fixtures/missing-confirmation-pack",
	)
	var fallback := SOUNDSCAPE_PLAYER.new(missing_pack, audio)
	if not fallback.report_event(CONFIRMATION_EVENT, CONFIRMATION_PARAMETERS):
		push_error("The synthesized confirmation fallback could not play")
		audio.free()
		quit(1)
		return
	await create_timer(0.35).timeout

	audio.free()
	print("PASS: approved cue and local fallback played without network access")
	quit(0)
