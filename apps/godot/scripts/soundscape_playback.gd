class_name SoundscapePlayback
extends RefCounted

const SLOT_MUSIC := &"music"
const SLOT_AMBIENCE := &"ambience"
const SLOT_MOVEMENT := &"movement"
const SLOT_FOREGROUND := &"foreground"

var bus: StringName
var category: StringName
var slot: StringName
var gain_db: float
var priority: int
var looping: bool
var max_duration_ms: int
var music_duck_db: float
var crossfade_ms: int


func _init(
	bus_name: StringName,
	category_name: StringName,
	slot_name: StringName,
	gain: float,
	cue_priority: int,
	should_loop: bool,
	maximum_duration_ms: int,
	duck_db: float = 0.0,
	crossfade_duration_ms: int = 0,
) -> void:
	bus = bus_name
	category = category_name
	slot = slot_name
	gain_db = gain
	priority = cue_priority
	looping = should_loop
	max_duration_ms = maximum_duration_ms
	music_duck_db = duck_db
	crossfade_ms = crossfade_duration_ms
