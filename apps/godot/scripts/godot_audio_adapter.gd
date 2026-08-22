class_name GodotAudioAdapter
extends Node

const FALLBACK_MIX_RATE := 48000
const FALLBACK_DURATION_SECONDS := 0.18
const FALLBACK_FREQUENCY_HZ := 783.99

var _player := AudioStreamPlayer.new()
var _playback_revision := 0
var _active_priority := -1


func _init() -> void:
	add_child(_player)
	_player.finished.connect(_on_playback_finished)


func load_wav(pack_source: String, relative_path: String) -> Variant:
	var bytes := _read_pack_bytes(pack_source, relative_path)
	if bytes.is_empty():
		return null
	return AudioStreamWAV.load_from_buffer(bytes)


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


func play(stream: Variant, playback: Dictionary) -> bool:
	if not stream is AudioStream:
		return false
	var priority: int = playback.get("priority", 0)
	if _player.playing and priority < _active_priority:
		return false
	var bus: StringName = playback.get("bus", &"Master")
	if AudioServer.get_bus_index(bus) < 0:
		return false

	_playback_revision += 1
	_active_priority = priority
	_player.stop()
	_player.stream = stream
	_player.bus = bus
	_player.volume_db = playback.get("gain_db", 0.0)
	_player.play()

	var maximum_duration_ms: int = playback.get("max_duration_ms", 0)
	if maximum_duration_ms > 0:
		_stop_after(maximum_duration_ms, _playback_revision)
	return true


func _stop_after(maximum_duration_ms: int, playback_revision: int) -> void:
	await get_tree().create_timer(maximum_duration_ms / 1000.0).timeout
	if playback_revision == _playback_revision:
		_player.stop()
		_player.stream = null
		_active_priority = -1


func _on_playback_finished() -> void:
	_active_priority = -1


func _read_pack_bytes(pack_source: String, relative_path: String) -> PackedByteArray:
	if pack_source.get_extension().to_lower() == "zip":
		var archive := ZIPReader.new()
		if archive.open(pack_source) != OK:
			return PackedByteArray()
		if not archive.get_files().has(relative_path):
			archive.close()
			return PackedByteArray()
		var bytes := archive.read_file(relative_path)
		archive.close()
		return bytes

	var path := pack_source.path_join(relative_path)
	if not FileAccess.file_exists(path):
		return PackedByteArray()
	return FileAccess.get_file_as_bytes(path)
