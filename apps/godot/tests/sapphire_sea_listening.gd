extends SceneTree

# Audible MacBook-speaker pass for the Sapphire Sea. Run without --headless.

const SOUNDSCAPE_PLAYER := preload("res://scripts/soundscape_player.gd")
const GODOT_AUDIO_ADAPTER := preload("res://scripts/godot_audio_adapter.gd")
const SEA := "sapphire-sea"
const PATH_CHOICE := "path-choice.sapphire-sea"
const BIRTHDAY_STAR := "birthday-star.sapphire-sea"
const RAINBOW_PATH := "rainbow-path.sapphire-sea"


func _init() -> void:
	_run.call_deferred()


func _run() -> void:
	var audio := GODOT_AUDIO_ADAPTER.new()
	root.add_child(audio)
	await process_frame
	var soundscape := SOUNDSCAPE_PLAYER.new("res://edition-pack.zip", audio)

	await _play(soundscape, "the bundled instrumental through the shared mixer",
		&"sound-event.opening-storybook-moment", {"moment": "opening.departure"}, 1.5)
	await _play(soundscape, "Zélie's Lacewood ambience",
		&"sound-event.place-entry", {"place": "lacewood"}, 4.0)
	await _play(soundscape, "the Sapphire Sea crossfading into the one ambience slot",
		&"sound-event.place-entry", {"place": SEA}, 14.0)

	await _play(soundscape, "the shell-lined shore choice",
		&"sound-event.path-choice-selected",
		{"pathChoice": PATH_CHOICE, "route": "sapphire-sea.shore"}, 2.0)
	await _play(soundscape, "the shell-lined shore interaction",
		&"sound-event.vignette-interaction",
		{"place": SEA, "interaction": "shell-lined-shore"}, 2.0)
	await _play(soundscape, "the open sparkling water choice",
		&"sound-event.path-choice-selected",
		{"pathChoice": PATH_CHOICE, "route": "sapphire-sea.open-water"}, 2.0)
	await _play(soundscape, "the open sparkling water interaction",
		&"sound-event.vignette-interaction",
		{"place": SEA, "interaction": "open-sparkling-water"}, 2.0)

	await _play(soundscape, "a sea-spray near miss",
		&"sound-event.near-miss", {"place": SEA, "kind": "sea-spray"}, 1.5)
	await _play(soundscape, "a sparkling wave Playful Bump",
		&"sound-event.playful-bump", {"place": SEA, "kind": "sparkling-wave"}, 1.5)
	await _play(soundscape, "an unexplored sea route shimmer",
		&"sound-event.journey-history-shimmer",
		{"pathChoice": PATH_CHOICE, "route": "sapphire-sea.open-water"}, 2.0)

	await _play(soundscape, "the nearby Birthday Star",
		&"sound-event.birthday-star-proximity", {"birthdayStar": BIRTHDAY_STAR}, 1.5)
	await _play(soundscape, "gathering the Birthday Star",
		&"sound-event.birthday-star-gathered", {"birthdayStar": BIRTHDAY_STAR}, 2.0)
	await _play(soundscape, "Uncle's Rainbow Path opening",
		&"sound-event.rainbow-path-opened",
		{"rainbowPath": RAINBOW_PATH, "familyGuest": "Uncle"}, 3.0)
	await _play(soundscape, "Uncle's sparkling shore-wash Birthday Star Moment",
		&"sound-event.birthday-star-moment", {"place": SEA, "familyGuest": "Uncle"}, 3.0)

	for slot: String in ["foreground", "movement", "ambience", "music"]:
		audio.stop_slot(slot)
	await create_timer(0.1).timeout
	soundscape = null
	audio.queue_free()
	await create_timer(0.1).timeout
	print("PASS: the Sapphire Sea played from the immutable Edition Pack without network access")
	quit(0)


func _play(
	soundscape: RefCounted,
	description: String,
	event_id: StringName,
	parameters: Dictionary,
	hold_seconds: float,
) -> void:
	print("PLAYING: %s" % description)
	if not soundscape.report_event(event_id, parameters):
		push_error("Could not play %s" % description)
	await create_timer(hold_seconds).timeout
