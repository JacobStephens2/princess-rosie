extends SceneTree

const SOUNDSCAPE_PLAYER := preload("res://scripts/soundscape_player.gd")
const GODOT_AUDIO_ADAPTER := preload("res://scripts/godot_audio_adapter.gd")
const CONFIRMATION_EVENT := &"sound-event.story-confirmation"
const CONFIRMATION_PARAMETERS := {"action": "continue"}
const OPENING_EVENT := &"sound-event.opening-storybook-moment"
const OPENING_PARAMETERS := {"moment": "opening.celebration-preparations"}
const ROSE_GARDEN_SEQUENCE := [
	["sound-event.place-entry", {"place": "rose-garden"}, 3.0],
	["sound-event.vignette-interaction", {"place": "rose-garden", "interaction": "awakening-roses"}, 1.8],
	["sound-event.near-miss", {"place": "rose-garden", "kind": "rose-garland"}, 1.0],
	["sound-event.playful-bump", {"place": "rose-garden", "kind": "rose-garland"}, 1.2],
	["sound-event.birthday-star-proximity", {"birthdayStar": "birthday-star.rose-garden"}, 1.2],
	["sound-event.birthday-star-gathered", {"birthdayStar": "birthday-star.rose-garden"}, 1.6],
	["sound-event.rainbow-path-opened", {"rainbowPath": "rainbow-path.rose-garden", "familyGuest": "Mom"}, 2.8],
	["sound-event.birthday-star-moment", {"place": "rose-garden", "familyGuest": "Mom"}, 2.4],
	["sound-event.place-exit", {"place": "rose-garden"}, 1.2],
]


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

	print("PLAYING: Rosalia's Rose Garden, from arrival to Mom's Birthday Star Moment")
	for garden_stage: Array in ROSE_GARDEN_SEQUENCE:
		print("  ", garden_stage[0], " ", garden_stage[1])
		approved.report_event(garden_stage[0], garden_stage[1])
		await create_timer(garden_stage[2]).timeout

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
