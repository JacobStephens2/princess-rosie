extends SceneTree

const SOUNDSCAPE_PLAYER := preload("res://scripts/soundscape_player.gd")
const GODOT_AUDIO_ADAPTER := preload("res://scripts/godot_audio_adapter.gd")
const CONFIRMATION_EVENT := &"sound-event.story-confirmation"
const CONFIRMATION_PARAMETERS := {"action": "continue"}
const OPENING_EVENT := &"sound-event.opening-storybook-moment"
const OPENING_PARAMETERS := {"moment": "opening.celebration-preparations"}


func _init() -> void:
	_run.call_deferred()


func _run() -> void:
	var audio := GODOT_AUDIO_ADAPTER.new()
	root.add_child(audio)
	await process_frame

	print("PLAYING: bundled instrumental through the shared mixer")
	var approved := SOUNDSCAPE_PLAYER.new("res://edition-pack.zip", audio)
	if not approved.report_event(OPENING_EVENT, OPENING_PARAMETERS):
		push_error("The opening reveal fallback could not play while starting music")
		audio.free()
		quit(1)
		return
	await create_timer(0.85).timeout

	print("PLAYING: approved Edition Pack confirmation")
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

	audio.stop_slot("foreground")
	audio.stop_slot("movement")
	audio.stop_slot("ambience")
	audio.stop_slot("music")
	await create_timer(0.1).timeout
	approved = null
	fallback = null
	audio.queue_free()
	await create_timer(0.1).timeout
	print("PASS: approved cue and local fallback played without network access")
	quit(0)
