class_name GodotAudioAdapter
extends Node

const FALLBACK_MIX_RATE := 48000
const FALLBACK_DURATION_SECONDS := 0.18
const FALLBACK_FREQUENCY_HZ := 783.99
const MUSIC_FALLBACK_DURATION_SECONDS := 2.0
const FOREGROUND_VOICE_MAXIMUM := 2
const SOUND_BUS := &"Sound"
const EDITION_PACK_READER := preload("res://scripts/edition_pack_reader.gd")
const SOUNDSCAPE_PLAYBACK := preload("res://scripts/soundscape_playback.gd")

var _music_player := AudioStreamPlayer.new()
var _ambience_player := AudioStreamPlayer.new()
var _movement_player := AudioStreamPlayer.new()
var _foreground_players: Array[AudioStreamPlayer] = []
var _priorities: Dictionary = {}
var _ducking: Dictionary = {}
var _duration_timers: Dictionary = {}
var _music_base_gain_db := 0.0
var _mute_timer := Timer.new()
var _reader: RefCounted = EDITION_PACK_READER.new()


func _init() -> void:
	for persistent_player: AudioStreamPlayer in [
		_music_player,
		_ambience_player,
		_movement_player,
	]:
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
	else:
		target = _persistent_player_for(playback.slot)
	if target == null:
		return false
	if playback.slot == SOUNDSCAPE_PLAYBACK.SLOT_MUSIC:
		_music_base_gain_db = playback.gain_db
	return _play_on(target, stream, playback)


func _persistent_player_for(slot: StringName) -> AudioStreamPlayer:
	match slot:
		SOUNDSCAPE_PLAYBACK.SLOT_MUSIC:
			return _music_player
		SOUNDSCAPE_PLAYBACK.SLOT_AMBIENCE:
			return _ambience_player
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
	if slot == SOUNDSCAPE_PLAYBACK.SLOT_FOREGROUND:
		for player: AudioStreamPlayer in _foreground_players:
			_stop_player(player)
		return
	var player := _persistent_player_for(slot)
	if player != null:
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
		var frame_count := _wav_frame_count(stream)
		if playback.looping and frame_count > 0 and stream.loop_end <= stream.loop_begin:
			stream.loop_begin = 0
			stream.loop_end = frame_count
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



func _wav_frame_count(stream: AudioStreamWAV) -> int:
	if stream.format not in [AudioStreamWAV.FORMAT_8_BITS, AudioStreamWAV.FORMAT_16_BITS]:
		return 0
	var bytes_per_sample := 2 if stream.format == AudioStreamWAV.FORMAT_16_BITS else 1
	var channels := 2 if stream.stereo else 1
	return stream.data.size() / (bytes_per_sample * channels)

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
