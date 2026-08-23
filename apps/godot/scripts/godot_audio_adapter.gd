class_name GodotAudioAdapter
extends Node

const FALLBACK_MIX_RATE := 48000
const FALLBACK_DURATION_SECONDS := 0.18
const FALLBACK_FREQUENCY_HZ := 783.99
const MUSIC_FALLBACK_DURATION_SECONDS := 2.0
const FOREGROUND_VOICE_MAXIMUM := 2
const AMBIENCE_VOICE_MAXIMUM := 2
const CROSSFADE_FLOOR_DB := 40.0
const SOUND_BUS := &"Sound"
const EDITION_PACK_READER := preload("res://scripts/edition_pack_reader.gd")
const SOUNDSCAPE_PLAYBACK := preload("res://scripts/soundscape_playback.gd")

var _music_player := AudioStreamPlayer.new()
var _ambience_players: Array[AudioStreamPlayer] = []
var _active_ambience_player: AudioStreamPlayer
var _movement_player := AudioStreamPlayer.new()
var _foreground_players: Array[AudioStreamPlayer] = []
var _priorities: Dictionary = {}
var _ducking: Dictionary = {}
var _duration_timers: Dictionary = {}
var _fades: Dictionary = {}
var _music_base_gain_db := 0.0
var _mute_timer := Timer.new()
var _reader: RefCounted = EDITION_PACK_READER.new()


func _init() -> void:
	for _ambience_index: int in AMBIENCE_VOICE_MAXIMUM:
		var ambience_player := AudioStreamPlayer.new()
		_ambience_players.append(ambience_player)
	_active_ambience_player = _ambience_players[0]
	for persistent_player: AudioStreamPlayer in (
		[_music_player, _movement_player] + _ambience_players
	):
		_register_player(persistent_player)
	for _voice_index: int in FOREGROUND_VOICE_MAXIMUM:
		var foreground_player := AudioStreamPlayer.new()
		_foreground_players.append(foreground_player)
		_register_player(foreground_player)
	_mute_timer.one_shot = true
	add_child(_mute_timer)
	_mute_timer.timeout.connect(_on_mute_timer_timeout)


func _exit_tree() -> void:
	_mute_timer.stop()
	stop_slot("foreground")
	stop_slot("movement")
	stop_slot("ambience")
	stop_slot("music")


func load_wav(pack_source: String, relative_path: String) -> Variant:
	var bytes_result: Dictionary = _reader.read_bytes(pack_source, relative_path)
	if not bytes_result.get("ok"):
		return null
	return AudioStreamWAV.load_from_buffer(bytes_result.value)


func load_mp3(pack_source: String, relative_path: String) -> Variant:
	var bytes_result: Dictionary = _reader.read_bytes(pack_source, relative_path)
	if not bytes_result.get("ok"):
		return null
	return AudioStreamMP3.load_from_buffer(bytes_result.value)


func synthesize_confirmation() -> AudioStreamWAV:
	var sample_count := int(FALLBACK_MIX_RATE * FALLBACK_DURATION_SECONDS)
	var pcm := PackedByteArray()
	pcm.resize(sample_count * 2)
	for sample_index: int in sample_count:
		var time := float(sample_index) / FALLBACK_MIX_RATE
		var attack := minf(time / 0.012, 1.0)
		var envelope := attack * exp(-time * 17.0)
		var tone := (
			sin(TAU * FALLBACK_FREQUENCY_HZ * time)
			+ 0.28 * sin(TAU * FALLBACK_FREQUENCY_HZ * 1.5 * time)
		)
		var sample := clampf(tone * envelope * 0.12, -1.0, 1.0)
		pcm.encode_s16(sample_index * 2, roundi(sample * 32767.0))

	var stream := AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = FALLBACK_MIX_RATE
	stream.stereo = false
	stream.data = pcm
	return stream


func synthesize_birthday_star() -> AudioStreamWAV:
	return _synthesize_gentle_response(0.42, 880.0, 1.5, 8.0, 0.08)


func synthesize_playful_bump() -> AudioStreamWAV:
	return _synthesize_gentle_response(0.22, 392.0, 1.33, 18.0, 0.07)


func synthesize_cloud_rest() -> AudioStreamWAV:
	return _synthesize_gentle_response(0.75, 523.25, 1.25, 4.0, 0.045)


func synthesize_celebration() -> AudioStreamWAV:
	return _synthesize_gentle_response(0.9, 659.25, 1.5, 3.5, 0.05)


func _synthesize_gentle_response(
	duration_seconds: float,
	frequency_hz: float,
	overtone_ratio: float,
	decay_rate: float,
	amplitude: float,
) -> AudioStreamWAV:
	var sample_count := int(FALLBACK_MIX_RATE * duration_seconds)
	var pcm := PackedByteArray()
	pcm.resize(sample_count * 2)
	for sample_index: int in sample_count:
		var time := float(sample_index) / FALLBACK_MIX_RATE
		var attack := minf(time / 0.018, 1.0)
		var envelope := attack * exp(-time * decay_rate)
		var tone := (
			sin(TAU * frequency_hz * time)
			+ 0.32 * sin(TAU * frequency_hz * overtone_ratio * time)
		)
		var sample := clampf(tone * envelope * amplitude, -1.0, 1.0)
		pcm.encode_s16(sample_index * 2, roundi(sample * 32767.0))

	var stream := AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = FALLBACK_MIX_RATE
	stream.stereo = false
	stream.data = pcm
	return stream


func synthesize_music() -> AudioStreamWAV:
	var sample_count := int(FALLBACK_MIX_RATE * MUSIC_FALLBACK_DURATION_SECONDS)
	var pcm := PackedByteArray()
	pcm.resize(sample_count * 2)
	for sample_index: int in sample_count:
		var time := float(sample_index) / FALLBACK_MIX_RATE
		var tone := (
			sin(TAU * 220.0 * time)
			+ 0.45 * sin(TAU * 330.0 * time)
			+ 0.2 * sin(TAU * 440.0 * time)
		)
		var sample := clampf(tone * 0.018, -1.0, 1.0)
		pcm.encode_s16(sample_index * 2, roundi(sample * 32767.0))

	var stream := AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = FALLBACK_MIX_RATE
	stream.stereo = false
	stream.loop_mode = AudioStreamWAV.LOOP_FORWARD
	stream.loop_begin = 0
	stream.loop_end = sample_count
	stream.data = pcm
	return stream


func play(stream: Variant, playback: SoundscapePlayback) -> bool:
	if not stream is AudioStream:
		return false
	if AudioServer.get_bus_index(playback.bus) < 0:
		return false
	var target: AudioStreamPlayer
	if playback.slot == SOUNDSCAPE_PLAYBACK.SLOT_FOREGROUND:
		target = _select_foreground_player(playback.priority)
	elif playback.slot == SOUNDSCAPE_PLAYBACK.SLOT_AMBIENCE:
		target = _incoming_ambience_player(playback.crossfade_ms)
	else:
		target = _persistent_player_for(playback.slot)
	if target == null:
		return false
	if playback.slot == SOUNDSCAPE_PLAYBACK.SLOT_MUSIC:
		_music_base_gain_db = playback.gain_db
	if playback.slot != SOUNDSCAPE_PLAYBACK.SLOT_AMBIENCE:
		return _play_on(target, stream, playback)
	var outgoing_player := _active_ambience_player
	if not _play_on(target, stream, playback):
		return false
	_active_ambience_player = target
	if playback.crossfade_ms > 0:
		_crossfade_ambience(outgoing_player, target, playback)
	return true


# The single ambience slot changes place by crossfading between two voices so no
# gap or hard cut is heard; without a crossfade the one active voice is reused.
func _incoming_ambience_player(crossfade_ms: int) -> AudioStreamPlayer:
	if crossfade_ms <= 0:
		for ambience_player: AudioStreamPlayer in _ambience_players:
			if ambience_player != _active_ambience_player:
				_stop_player(ambience_player)
		return _active_ambience_player
	for ambience_player: AudioStreamPlayer in _ambience_players:
		if ambience_player != _active_ambience_player:
			return ambience_player
	return _active_ambience_player


func _crossfade_ambience(
	outgoing_player: AudioStreamPlayer,
	incoming_player: AudioStreamPlayer,
	playback: SoundscapePlayback,
) -> void:
	var fade_seconds := playback.crossfade_ms / 1000.0
	var outgoing_gain_db := outgoing_player.volume_db if outgoing_player != null else 0.0
	if not is_inside_tree():
		if outgoing_player != null and outgoing_player != incoming_player:
			_stop_player(outgoing_player)
		return
	incoming_player.volume_db = playback.gain_db - CROSSFADE_FLOOR_DB
	var incoming_tween := _restart_fade(incoming_player)
	incoming_tween.tween_property(
		incoming_player,
		"volume_db",
		playback.gain_db,
		fade_seconds,
	)
	if outgoing_player == null or outgoing_player == incoming_player:
		return
	var outgoing_tween := _restart_fade(outgoing_player)
	outgoing_tween.tween_property(
		outgoing_player,
		"volume_db",
		outgoing_gain_db - CROSSFADE_FLOOR_DB,
		fade_seconds,
	)
	outgoing_tween.tween_callback(_finish_fade_out.bind(outgoing_player))


func fade_out_slot(slot: StringName, fade_ms: int) -> void:
	if fade_ms <= 0 or not is_inside_tree():
		stop_slot(slot)
		return
	var fading_players: Array[AudioStreamPlayer] = _slot_players(slot)
	for fading_player: AudioStreamPlayer in fading_players:
		if not fading_player.playing:
			continue
		var fade_tween := _restart_fade(fading_player)
		fade_tween.tween_property(
			fading_player,
			"volume_db",
			fading_player.volume_db - CROSSFADE_FLOOR_DB,
			fade_ms / 1000.0,
		)
		fade_tween.tween_callback(_finish_fade_out.bind(fading_player))


func _finish_fade_out(player: AudioStreamPlayer) -> void:
	_fades.erase(player.get_instance_id())
	_stop_player(player)


func _restart_fade(player: AudioStreamPlayer) -> Tween:
	var running_fade: Variant = _fades.get(player.get_instance_id())
	if running_fade is Tween and running_fade.is_valid():
		running_fade.kill()
	var fade := create_tween()
	_fades[player.get_instance_id()] = fade
	return fade


# Public evidence for the one ambience slot: how many voices are audible during a
# place transition, and the gain the surviving voice settles at.
func ambience_evidence() -> Dictionary:
	var playing_voices := 0
	for ambience_player: AudioStreamPlayer in _ambience_players:
		if ambience_player.playing:
			playing_voices += 1
	return {
		"playing_voices": playing_voices,
		"active_volume_db": _active_ambience_player.volume_db,
	}


func _slot_players(slot: StringName) -> Array[AudioStreamPlayer]:
	if slot == SOUNDSCAPE_PLAYBACK.SLOT_FOREGROUND:
		return _foreground_players
	if slot == SOUNDSCAPE_PLAYBACK.SLOT_AMBIENCE:
		return _ambience_players
	var players: Array[AudioStreamPlayer] = []
	var player := _persistent_player_for(slot)
	if player != null:
		players.append(player)
	return players


func _persistent_player_for(slot: StringName) -> AudioStreamPlayer:
	match slot:
		SOUNDSCAPE_PLAYBACK.SLOT_MUSIC:
			return _music_player
		SOUNDSCAPE_PLAYBACK.SLOT_AMBIENCE:
			return _active_ambience_player
		SOUNDSCAPE_PLAYBACK.SLOT_MOVEMENT:
			return _movement_player
		_:
			return null


func set_sound_enabled(enabled: bool, delay_ms: int = 0) -> void:
	_mute_timer.stop()
	if enabled or delay_ms <= 0:
		_set_sound_bus_muted(not enabled)
		return
	_mute_timer.start(delay_ms / 1000.0)


func stop_slot(slot: StringName) -> void:
	for player: AudioStreamPlayer in _slot_players(slot):
		_stop_player(player)


func _on_mute_timer_timeout() -> void:
	_set_sound_bus_muted(true)


func _set_sound_bus_muted(muted: bool) -> void:
	var sound_bus_index := AudioServer.get_bus_index(SOUND_BUS)
	if sound_bus_index >= 0:
		AudioServer.set_bus_mute(sound_bus_index, muted)


func _select_foreground_player(priority: int) -> AudioStreamPlayer:
	for player: AudioStreamPlayer in _foreground_players:
		if not player.playing:
			return player
	var candidate: AudioStreamPlayer
	var candidate_priority := priority
	for player: AudioStreamPlayer in _foreground_players:
		var active_priority: int = _priorities.get(player.get_instance_id(), -1)
		if active_priority < candidate_priority:
			candidate = player
			candidate_priority = active_priority
	if candidate == null and priority >= 100:
		return _foreground_players[0]
	return candidate


func _play_on(
	player: AudioStreamPlayer,
	source_stream: AudioStream,
	playback: SoundscapePlayback,
) -> bool:
	var stream: AudioStream = source_stream.duplicate()
	if stream is AudioStreamWAV:
		stream.loop_mode = (
			AudioStreamWAV.LOOP_FORWARD
			if playback.looping
			else AudioStreamWAV.LOOP_DISABLED
		)
	elif stream is AudioStreamMP3:
		stream.loop = playback.looping

	var player_id := player.get_instance_id()
	_priorities[player_id] = playback.priority
	_ducking[player_id] = playback.music_duck_db
	player.stop()
	player.stream = stream
	player.bus = playback.bus
	player.volume_db = playback.gain_db
	player.play()
	_apply_music_duck()

	var duration_timer: Timer = _duration_timers[player_id]
	duration_timer.stop()
	if playback.max_duration_ms > 0:
		duration_timer.start(playback.max_duration_ms / 1000.0)
	return true


func _register_player(player: AudioStreamPlayer) -> void:
	add_child(player)
	player.finished.connect(_on_playback_finished.bind(player))
	var duration_timer := Timer.new()
	duration_timer.one_shot = true
	player.add_child(duration_timer)
	duration_timer.timeout.connect(_stop_player.bind(player))
	_duration_timers[player.get_instance_id()] = duration_timer


func _stop_player(player: AudioStreamPlayer) -> void:
	var player_id := player.get_instance_id()
	var duration_timer: Timer = _duration_timers.get(player_id)
	if duration_timer != null:
		duration_timer.stop()
	var running_fade: Variant = _fades.get(player_id)
	if running_fade is Tween and running_fade.is_valid():
		running_fade.kill()
	_fades.erase(player_id)
	player.stop()
	player.stream = null
	_priorities.erase(player_id)
	_ducking.erase(player_id)
	_apply_music_duck()


func _on_playback_finished(player: AudioStreamPlayer) -> void:
	_stop_player(player)


func _apply_music_duck() -> void:
	var duck_db := 0.0
	for player: AudioStreamPlayer in _foreground_players:
		if player.playing:
			duck_db = minf(duck_db, float(_ducking.get(player.get_instance_id(), 0.0)))
	_music_player.volume_db = _music_base_gain_db + duck_db
