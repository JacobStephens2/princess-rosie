class_name SoundscapePlayer
extends RefCounted

const CATALOG_PATH := "soundscape/catalog.json"
const SOURCE_MEDIA_PATH := "soundscape/source-media.json"
const RUNTIME_MAPPINGS_PATH := "soundscape/runtime-mappings.json"
const MIX_PATH := "soundscape/mix.json"
const RUNTIME_MEDIA_ROOT := "source-media/soundscape"
const MUSIC_BUS := &"Music"
const AMBIENCE_BUS := &"Ambience"
const MOVEMENT_BUS := &"Movement"
const FOREGROUND_BUS := &"Foreground"
const CRITICAL_BUS := &"Critical"
const DETAIL_BUS := &"Detail"
const OPENING_EVENT := &"sound-event.opening-storybook-moment"
const STORY_CONFIRMATION_EVENT := &"sound-event.story-confirmation"
const STORY_CONFIRMATION_PARAMETERS := {"action": "continue"}
const MOVEMENT_EVENT := &"sound-event.movement-state"
const REPLAY_EVENT := &"sound-event.replay"
const SOUND_PREFERENCE_EVENT := &"sound-event.sound-preference-changed"
const SOUND_OFF_LIMIT_MS := 200
const EDITION_PACK_READER := preload("res://scripts/edition_pack_reader.gd")
const SOUNDSCAPE_PLAYBACK := preload("res://scripts/soundscape_playback.gd")

var _pack_source: String
var _audio: Object
var _catalog_entries: Array = []
var _source_masters: Dictionary = {}
var _runtime_mappings: Dictionary = {}
var _mix := {
	"soundtrack": {},
	"categoryGainDb": {
		"music": 0.0,
		"ambience": -10.0,
		"movement": -10.0,
		"ordinaryForeground": 3.0,
		"criticalForeground": 3.0,
		"optionalDetail": -10.0,
	},
	"musicDuckDb": -4.0,
	"confirmationDelayMaximumMs": SOUND_OFF_LIMIT_MS,
}
var _sound_enabled := true
var _music_started := false
var _movement_state := ""
var _reader: RefCounted = EDITION_PACK_READER.new()


func _init(pack_source: String, engine_audio_adapter: Object) -> void:
	_pack_source = pack_source
	_audio = engine_audio_adapter
	var catalog: Dictionary = _reader.read_json_object(_pack_source, CATALOG_PATH)
	if catalog.get("ok") == true:
		_catalog_entries = catalog.value.get("entries", [])
	var source_media: Dictionary = _reader.read_json_object(_pack_source, SOURCE_MEDIA_PATH)
	if source_media.get("ok") == true:
		for source_master: Variant in source_media.value.get("sourceMasters", []):
			if source_master is Dictionary:
				_source_masters[source_master.get("id")] = source_master
	var runtime_mappings: Dictionary = _reader.read_json_object(
		_pack_source,
		RUNTIME_MAPPINGS_PATH,
	)
	if runtime_mappings.get("ok") == true:
		for runtime_mapping: Variant in runtime_mappings.value.get("mappings", []):
			if runtime_mapping is Dictionary:
				_runtime_mappings[runtime_mapping.get("id")] = runtime_mapping
	var mix: Dictionary = _reader.read_json_object(_pack_source, MIX_PATH)
	if mix.get("ok") == true:
		_mix = mix.value


func report_event(event_id: StringName, parameters: Dictionary = {}) -> bool:
	if event_id == SOUND_PREFERENCE_EVENT:
		if not parameters.get("enabled") is bool:
			return false
		var enabled: bool = parameters.enabled
		if enabled:
			_sound_enabled = true
			if _audio.has_method("set_sound_enabled"):
				_audio.set_sound_enabled(true, 0)
			return _play_resolved_cue(event_id, parameters)
		if not _sound_enabled:
			return false
		var delay_limit := mini(
			SOUND_OFF_LIMIT_MS,
			int(_mix.get("confirmationDelayMaximumMs", SOUND_OFF_LIMIT_MS)),
		)
		var played := _play_resolved_cue(event_id, parameters, delay_limit)
		_sound_enabled = false
		if _audio.has_method("set_sound_enabled"):
			_audio.set_sound_enabled(false, delay_limit if played else 0)
		return played
	if event_id == REPLAY_EVENT:
		_movement_state = ""
		if _audio.has_method("stop_slot"):
			_audio.stop_slot("movement")
			_audio.stop_slot("ambience")
			_audio.stop_slot("foreground")
		if not _sound_enabled:
			return true
	if not _sound_enabled:
		return false
	if event_id == MOVEMENT_EVENT:
		var next_state: Variant = parameters.get("state")
		if not next_state is String or next_state == _movement_state:
			return false
		_movement_state = next_state
	if event_id == OPENING_EVENT:
		_ensure_music()
	return _play_resolved_cue(event_id, parameters)


func _ensure_music() -> bool:
	if _music_started or not _audio.has_method("load_mp3"):
		return _music_started
	var soundtrack: Dictionary = _mix.get("soundtrack", {})
	var relative_path: String = soundtrack.get("path", "")
	if relative_path.is_empty():
		return false
	var stream: Variant = _audio.load_mp3(_pack_source, relative_path)
	if stream != null and _play_music_stream(stream, soundtrack):
		return true
	if not _audio.has_method("synthesize_music"):
		return false
	stream = _audio.synthesize_music()
	return stream != null and _play_music_stream(stream, soundtrack)


func _play_music_stream(stream: Variant, soundtrack: Dictionary) -> bool:
	var category_gains: Dictionary = _mix.get("categoryGainDb", {})
	var playback := SOUNDSCAPE_PLAYBACK.new(
		MUSIC_BUS,
		&"music",
		SOUNDSCAPE_PLAYBACK.SLOT_MUSIC,
		(
			float(soundtrack.get("gainDb", 0.0))
			+ float(category_gains.get("music", 0.0))
		),
		0,
		soundtrack.get("looping", true),
		0,
	)
	_music_started = _audio.play(stream, playback)
	return _music_started


func _play_resolved_cue(
	event_id: StringName,
	parameters: Dictionary,
	maximum_duration_ms := -1,
) -> bool:
	var cue := _resolve_cue(event_id, parameters)
	if cue.is_empty():
		return false
	var relative_path := _runtime_path_for(cue)
	var cue_duration_ms := int(float(cue.get("durationSeconds", 0.0)) * 1000.0)
	if maximum_duration_ms >= 0:
		cue_duration_ms = mini(cue_duration_ms, maximum_duration_ms)
	var playback := _playback_for(cue, event_id, cue_duration_ms)
	if not relative_path.is_empty():
		var stream: Variant = _audio.load_wav(_pack_source, relative_path)
		if stream != null and _audio.play(stream, playback):
			return true
	if cue.get("fallbackRole") != "fallback.story-confirmation":
		return false
	var confirmation_cue := _resolve_cue(
		STORY_CONFIRMATION_EVENT,
		STORY_CONFIRMATION_PARAMETERS,
	)
	if confirmation_cue.get("id") != cue.get("id"):
		var confirmation_path := _runtime_path_for(confirmation_cue)
		if not confirmation_path.is_empty():
			var confirmation_stream: Variant = _audio.load_wav(_pack_source, confirmation_path)
			if confirmation_stream != null and _audio.play(confirmation_stream, playback):
				return true
	var fallback_stream: Variant = _audio.synthesize_confirmation()
	return fallback_stream != null and _audio.play(fallback_stream, playback)


func _runtime_path_for(cue: Dictionary) -> String:
	var source_master: Dictionary = _source_masters.get(cue.get("sourceMaster"), {})
	var runtime_mapping: Dictionary = _runtime_mappings.get(cue.get("runtimeMapping"), {})
	if runtime_mapping.get("sourceMaster") == cue.get("sourceMaster"):
		var runtime_path: String = runtime_mapping.get("path", "")
		if not runtime_path.is_empty():
			return RUNTIME_MEDIA_ROOT.path_join(runtime_path)
	return source_master.get("runtimePath", source_master.get("path", ""))


func _playback_for(cue: Dictionary, event_id: StringName, duration_ms: int) -> SoundscapePlayback:
	var category_gains: Dictionary = _mix.get("categoryGainDb", {})
	var soundtrack: Dictionary = _mix.get("soundtrack", {})
	var music_reference_gain_db := float(soundtrack.get("gainDb", -6.7))
	var priority: int = cue.get("priority", 0)
	var playback := SOUNDSCAPE_PLAYBACK.new(
		FOREGROUND_BUS,
		&"ordinary-foreground",
		SOUNDSCAPE_PLAYBACK.SLOT_FOREGROUND,
		(
			music_reference_gain_db
			+ float(category_gains.get("ordinaryForeground", 3.0))
		),
		priority,
		cue.get("looping", false),
		duration_ms,
	)
	if priority >= 100:
		playback.bus = CRITICAL_BUS
		playback.category = &"critical-foreground"
		playback.gain_db = (
			music_reference_gain_db
			+ float(category_gains.get("criticalForeground", 3.0))
		)
		playback.music_duck_db = float(_mix.get("musicDuckDb", -4))
		return playback
	if event_id == MOVEMENT_EVENT:
		playback.bus = MOVEMENT_BUS
		playback.category = &"movement"
		playback.gain_db = music_reference_gain_db + float(category_gains.get("movement", -10.0))
		if cue.get("looping") == true:
			playback.slot = SOUNDSCAPE_PLAYBACK.SLOT_MOVEMENT
			playback.max_duration_ms = 0
		return playback
	if cue.get("category") == "place" or cue.get("looping") == true:
		playback.bus = AMBIENCE_BUS
		playback.category = &"ambience"
		playback.slot = SOUNDSCAPE_PLAYBACK.SLOT_AMBIENCE
		playback.gain_db = music_reference_gain_db + float(category_gains.get("ambience", -10.0))
		playback.max_duration_ms = 0
		return playback
	if priority <= 20:
		playback.bus = DETAIL_BUS
		playback.category = &"optional-detail"
		playback.gain_db = (
			music_reference_gain_db
			+ float(category_gains.get("optionalDetail", -10.0))
		)
	return playback


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
	if event_id == OPENING_EVENT:
		return _resolve_cue(STORY_CONFIRMATION_EVENT, STORY_CONFIRMATION_PARAMETERS)
	return {}
