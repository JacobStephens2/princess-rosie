extends SceneTree

const SOUNDSCAPE_PLAYER := preload("res://scripts/soundscape_player.gd")
const GODOT_AUDIO_ADAPTER := preload("res://scripts/godot_audio_adapter.gd")
const CONFIRMATION_EVENT := &"sound-event.story-confirmation"
const CONFIRMATION_PARAMETERS := {"action": "continue"}
const OPENING_EVENT := &"sound-event.opening-storybook-moment"
const OPENING_PARAMETERS := {"moment": "opening.celebration-preparations"}
# One pass over Pellegrino Peak so the required MacBook-speaker listening check can
# hear the place transition, the updraft, its local encounters, and Aunt's close.
const PELLEGRINO_PEAK_WALKTHROUGH := [
	[
		"the Lacewood ambience the Peak will crossfade away from",
		&"sound-event.place-entry",
		{"place": "lacewood"},
		2.0,
	],
	[
		"the Pellegrino Peak breeze crossfading into the one ambience slot",
		&"sound-event.place-entry",
		{"place": "pellegrino-peak"},
		3.0,
	],
	[
		"the flower-petal updraft answering the one button",
		&"sound-event.vignette-interaction",
		{"place": "pellegrino-peak", "interaction": "flower-petal-updraft"},
		1.6,
	],
	[
		"a gentle local Peak Playful Bump",
		&"sound-event.playful-bump",
		{"place": "pellegrino-peak", "kind": "flower-petal"},
		1.0,
	],
	[
		"a restrained Peak near miss",
		&"sound-event.near-miss",
		{"place": "pellegrino-peak", "kind": "flower-petal"},
		1.0,
	],
	[
		"the capped Birthday Star shimmer",
		&"sound-event.birthday-star-proximity",
		{"birthdayStar": "birthday-star.pellegrino-peak"},
		1.2,
	],
	[
		"the shared Birthday Star gather identity",
		&"sound-event.birthday-star-gathered",
		{"birthdayStar": "birthday-star.pellegrino-peak"},
		1.6,
	],
	[
		"Aunt's open-air Rainbow Path travel",
		&"sound-event.rainbow-path-opened",
		{"rainbowPath": "rainbow-path.pellegrino-peak", "familyGuest": "Aunt"},
		2.7,
	],
	[
		"Aunt's Birthday Star Moment",
		&"sound-event.birthday-star-moment",
		{"place": "pellegrino-peak", "familyGuest": "Aunt"},
		2.2,
	],
	[
		"the Birthday Castle arrival fading the Peak ambience out",
		&"sound-event.birthday-castle-arrival",
		{},
		3.2,
	],
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

	print("PLAYING: approved Edition Pack confirmation")
	if not approved.report_event(CONFIRMATION_EVENT, CONFIRMATION_PARAMETERS):
		push_error("The approved Edition Pack confirmation could not play")
		audio.free()
		quit(1)
		return
	await create_timer(0.85).timeout

	for peak_stage: Array in PELLEGRINO_PEAK_WALKTHROUGH:
		print("PLAYING: %s" % peak_stage[0])
		if not approved.report_event(peak_stage[1], peak_stage[2]):
			push_error("A Pellegrino Peak stage could not play: %s" % peak_stage[1])
			audio.free()
			quit(1)
			return
		await create_timer(peak_stage[3]).timeout

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
