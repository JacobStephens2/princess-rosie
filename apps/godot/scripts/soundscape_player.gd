class_name SoundscapePlayer
extends RefCounted

const CATALOG_PATH := "soundscape/catalog.json"
const SOURCE_MEDIA_PATH := "soundscape/source-media.json"
const SOUND_BUS := &"Sound"
const CUE_GAIN_DB := -3.0
const SOUND_PREFERENCE_EVENT := &"sound-event.sound-preference-changed"
const SOUND_OFF_LIMIT_MS := 200

var _pack_source: String
var _audio: Object
var _catalog_entries: Array = []
var _source_masters: Dictionary = {}
var _sound_enabled := true


func _init(pack_source: String, engine_audio_adapter: Object) -> void:
	_pack_source = pack_source
	_audio = engine_audio_adapter
	var catalog := _read_pack_json(CATALOG_PATH)
	if catalog.get("ok") == true:
		_catalog_entries = catalog.value.get("entries", [])
	var source_media := _read_pack_json(SOURCE_MEDIA_PATH)
	if source_media.get("ok") == true:
		for source_master: Variant in source_media.value.get("sourceMasters", []):
			if source_master is Dictionary:
				_source_masters[source_master.get("id")] = source_master


func report_event(event_id: StringName, parameters: Dictionary = {}) -> bool:
	if event_id == SOUND_PREFERENCE_EVENT:
		if not parameters.get("enabled") is bool:
			return false
		var enabled: bool = parameters.enabled
		if enabled:
			_sound_enabled = true
			return _play_resolved_cue(event_id, parameters)
		if not _sound_enabled:
			return false
		var played := _play_resolved_cue(event_id, parameters, SOUND_OFF_LIMIT_MS)
		_sound_enabled = false
		return played
	if not _sound_enabled:
		return false
	return _play_resolved_cue(event_id, parameters)


func _play_resolved_cue(
	event_id: StringName,
	parameters: Dictionary,
	maximum_duration_ms := -1,
) -> bool:
	var cue := _resolve_cue(event_id, parameters)
	if cue.is_empty():
		return false
	var source_master: Dictionary = _source_masters.get(cue.get("sourceMaster"), {})
	var relative_path: String = source_master.get("path", "")
	var cue_duration_ms := int(float(cue.get("durationSeconds", 0.0)) * 1000.0)
	if maximum_duration_ms >= 0:
		cue_duration_ms = mini(cue_duration_ms, maximum_duration_ms)
	var playback := {
		"bus": SOUND_BUS,
		"gain_db": CUE_GAIN_DB,
		"priority": cue.get("priority", 0),
		"max_duration_ms": cue_duration_ms,
	}
	if not relative_path.is_empty():
		var stream: Variant = _audio.load_wav(_pack_source, relative_path)
		if stream != null and _audio.play(stream, playback):
			return true
	if cue.get("fallbackRole") != "fallback.story-confirmation":
		return false
	var fallback_stream: Variant = _audio.synthesize_confirmation()
	return fallback_stream != null and _audio.play(fallback_stream, playback)


func _resolve_cue(event_id: StringName, parameters: Dictionary) -> Dictionary:
	for cue_value: Variant in _catalog_entries:
		if not cue_value is Dictionary:
			continue
		var cue: Dictionary = cue_value
		if cue.get("event") != str(event_id):
			continue
		var expected_parameters: Dictionary = cue.get("match", {})
		var matches := true
		for parameter: Variant in expected_parameters:
			if not parameters.has(parameter) or parameters.get(parameter) != expected_parameters.get(parameter):
				matches = false
				break
		if matches:
			return cue
	return {}


func _read_pack_json(relative_path: String) -> Dictionary:
	var bytes := PackedByteArray()
	if _pack_source.get_extension().to_lower() == "zip":
		var archive := ZIPReader.new()
		if archive.open(_pack_source) != OK or not archive.get_files().has(relative_path):
			archive.close()
			return {"ok": false}
		bytes = archive.read_file(relative_path)
		archive.close()
	else:
		var path := _pack_source.path_join(relative_path)
		if not FileAccess.file_exists(path):
			return {"ok": false}
		bytes = FileAccess.get_file_as_bytes(path)
	if bytes.is_empty():
		return {"ok": false}
	var json := JSON.new()
	if json.parse(bytes.get_string_from_utf8()) != OK or not json.data is Dictionary:
		return {"ok": false}
	return {"ok": true, "value": json.data}
