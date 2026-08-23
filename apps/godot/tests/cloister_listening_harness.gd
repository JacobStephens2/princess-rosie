extends SceneTree

## Audible Cloister of Clouds pass for the required MacBook built-in speaker check.
## Run without --headless:
##   /Applications/Godot.app/Contents/MacOS/Godot --path apps/godot \
##     --script res://tests/cloister_listening_harness.gd

const SOUNDSCAPE_PLAYER := preload("res://scripts/soundscape_player.gd")
const GODOT_AUDIO_ADAPTER := preload("res://scripts/godot_audio_adapter.gd")
const LISTENING_PASS := [
	["listen for the Lacewood the Cloister has to follow", 3.0,
		[[&"sound-event.movement-state", {"state": "flight"}],
		[&"sound-event.place-entry", {"place": "lacewood"}]]],
	["listen for open-air hush crossfading in over the Lacewood", 6.0,
		[[&"sound-event.place-entry", {"place": "cloister"}],
		[&"sound-event.path-choice-available", {"pathChoice": "path-choice.cloister"}]]],
	["listen for the sunlit arch route", 4.0,
		[[&"sound-event.path-choice-selected",
			{"pathChoice": "path-choice.cloister", "route": "cloister.arches"}],
		[&"sound-event.vignette-interaction",
			{"place": "cloister", "interaction": "sunlit-arch-glide"}]]],
	["listen for the equally safe soft cloud route", 4.0,
		[[&"sound-event.journey-history-shimmer",
			{"pathChoice": "path-choice.cloister", "route": "cloister.clouds"}],
		[&"sound-event.path-choice-selected",
			{"pathChoice": "path-choice.cloister", "route": "cloister.clouds"}],
		[&"sound-event.vignette-interaction",
			{"place": "cloister", "interaction": "soft-cloud-drift"}]]],
	["listen for soft cloud bounds and Playful Bumps", 3.0,
		[[&"sound-event.near-miss", {"place": "cloister", "kind": "cloud-bound"}],
		[&"sound-event.playful-bump", {"place": "cloister", "kind": "soft-cloud"}]]],
	["listen for the shared Birthday Star and Rainbow Path", 6.0,
		[[&"sound-event.birthday-star-proximity", {"birthdayStar": "birthday-star.cloister"}],
		[&"sound-event.birthday-star-gathered", {"birthdayStar": "birthday-star.cloister"}],
		[&"sound-event.rainbow-path-opened",
			{"rainbowPath": "rainbow-path.cloister", "familyGuest": "Beasley"}]]],
	["listen for Beasley's Birthday Star Moment", 4.0,
		[[&"sound-event.birthday-star-moment",
			{"place": "cloister", "familyGuest": "Beasley"}]]],
	["listen for the place fading out into the celebration", 4.0,
		[[&"sound-event.birthday-castle-arrival", {}]]],
]


func _init() -> void:
	_run.call_deferred()


func _run() -> void:
	var audio := GODOT_AUDIO_ADAPTER.new()
	root.add_child(audio)
	await process_frame
	var soundscape := SOUNDSCAPE_PLAYER.new("res://edition-pack.zip", audio)
	soundscape.report_event(
		&"sound-event.opening-storybook-moment",
		{"moment": "opening.celebration-preparations"},
	)
	await create_timer(1.5).timeout

	for stage: Array in LISTENING_PASS:
		print("PLAYING: %s" % stage[0])
		for semantic_event: Array in stage[2]:
			soundscape.report_event(semantic_event[0], semantic_event[1])
			await create_timer(1.2).timeout
		await create_timer(float(stage[1])).timeout

	audio.stop_slot("foreground")
	audio.stop_slot("movement")
	audio.stop_slot("ambience")
	audio.stop_slot("music")
	await create_timer(0.2).timeout
	soundscape = null
	audio.queue_free()
	await create_timer(0.2).timeout
	print("PASS: the Cloister of Clouds listening pass played offline")
	quit(0)
