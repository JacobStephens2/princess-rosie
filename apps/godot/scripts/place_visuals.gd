class_name PlaceVisuals
extends Control

const PLACE_CONTENT := preload("res://scripts/place_content.gd")
const BAND_HIGH := PLACE_CONTENT.BAND_HIGH
const BAND_LOW := PLACE_CONTENT.BAND_LOW
const DEFAULT_TINT := Color(0.96, 0.86, 0.94)

var _phase := ""
var _place: Dictionary = {}
var _altitude_ladder: Array[Dictionary] = []
var _progress := 0.0
var _altitude := 0.5
var _observed_interactions: Array[String] = []
var _playful_bump_wobble := false
var _elapsed := 0.0


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	queue_redraw()


func _process(delta: float) -> void:
	if not visible or not is_finite(delta) or delta <= 0.0:
		return
	_elapsed += delta
	queue_redraw()


# The ladder arrives already resolved, so the module paints whatever rungs the place
# declares — two for a garden, four for an abbey — without knowing which place it is.
func configure_place(place: Dictionary, altitude_ladder: Array[Dictionary]) -> void:
	if _place == place and _altitude_ladder == altitude_ladder:
		return
	_place = place.duplicate(true)
	_altitude_ladder = altitude_ladder.duplicate(true)
	queue_redraw()


func set_story_state(state: Dictionary) -> void:
	var phase := str(state.get("phase", ""))
	var progress := float(state.get("progress", 0.0))
	var altitude := float(state.get("altitude", 0.5))
	var playful_bump_wobble := bool(state.get("playful_bump_wobble", false))
	var observed_interactions: Array[String] = []
	for interaction: Variant in state.get("observed_interactions", []):
		observed_interactions.append(str(interaction))
	if (
		phase == _phase
		and is_equal_approx(progress, _progress)
		and is_equal_approx(altitude, _altitude)
		and playful_bump_wobble == _playful_bump_wobble
		and observed_interactions == _observed_interactions
	):
		return
	_phase = phase
	_progress = progress
	_altitude = altitude
	_playful_bump_wobble = playful_bump_wobble
	_observed_interactions = observed_interactions
	queue_redraw()


func visual_evidence() -> Dictionary:
	var travelling := visible
	return {
		"place": str(_place.get("id", "")),
		"tint": str(_place.get("tint", "")),
		"single_corridor_visible": travelling,
		"fork_visible": false,
		"atmospheric_motion": visible,
		"high_interaction_visible": travelling and not _band_interaction(BAND_HIGH).is_empty(),
		"low_interaction_visible": travelling and not _band_interaction(BAND_LOW).is_empty(),
		"observed_visual_responses": _observed_visual_responses(),
		"place_tint_applied": travelling,
		"playful_bump_wobble_visible": visible and _playful_bump_wobble and travelling,
	}


func _draw() -> void:
	if not visible:
		return
	_draw_atmosphere()
	_draw_single_corridor()
	_draw_altitude_rungs()
	_draw_progress_glimmer()
	if _playful_bump_wobble:
		_draw_playful_bump_sparkle()


# Each place paints the same composition in its own light; the tint is place data.
func _place_tint() -> Color:
	var tint := str(_place.get("tint", ""))
	return Color.from_string(tint, DEFAULT_TINT) if not tint.is_empty() else DEFAULT_TINT


func _band_interaction(altitude_band: String) -> Dictionary:
	return PLACE_CONTENT.interaction(_place, altitude_band)


func _draw_atmosphere() -> void:
	var tint := _place_tint()
	for index: int in 18:
		var drift := fmod(_elapsed * (9.0 + index % 4) + index * 83.0, 1420.0) - 70.0
		var y := 95.0 + fmod(index * 97.0 + sin(_elapsed * 0.45 + index) * 34.0, 535.0)
		var color := (
			Color(1.0, 0.86, 0.48, 0.25)
			if index % 3 == 0
			else Color(tint.r, tint.g, tint.b, 0.18)
		)
		draw_circle(Vector2(drift, y), 2.0 + float(index % 3), color)


func _draw_single_corridor() -> void:
	var tint := _place_tint()
	var points := PackedVector2Array([
		Vector2(70.0, 380.0),
		Vector2(270.0, 342.0),
		Vector2(490.0, 375.0),
		Vector2(720.0, 340.0),
		Vector2(950.0, 378.0),
		Vector2(1200.0, 352.0),
	])
	draw_polyline(points, Color(tint.r, tint.g, tint.b, 0.5), 18.0, true)
	draw_polyline(points, Color(0.9, 0.97, 1.0, 0.68), 5.0, true)


# Every rung of the place's altitude ladder gets a row of its own, hung at the height it
# answers to, so the child can see what each height is offering before she flies to it.
# Rows above the middle of the Stage read as ribbons of light; rows below read as blooms.
func _draw_altitude_rungs() -> void:
	for rung_index: int in _altitude_ladder.size():
		var rung: Dictionary = _altitude_ladder[rung_index]
		var altitude := _rung_altitude(rung)
		var interaction: Dictionary = rung.get("interaction", {})
		var observed := _observed_interactions.has(str(interaction.get("id", "")))
		if altitude >= 0.5:
			_draw_ribbon_row(altitude, rung_index, observed)
		else:
			_draw_bloom_row(altitude, rung_index, observed)


# The middle of the heights a rung answers to, with an open end reaching the Stage edge.
func _rung_altitude(rung: Dictionary) -> float:
	var minimum := maxf(float(rung.get("minimum", 0.0)), 0.0)
	var maximum := minf(float(rung.get("maximum", 1.0)), 1.0)
	return clampf((minimum + maximum) * 0.5, 0.0, 1.0)


func _draw_ribbon_row(altitude: float, row_index: int, observed: bool) -> void:
	var tint := _place_tint()
	var y := _row_y(altitude)
	var pulse := 0.5 + 0.5 * sin(_elapsed * 3.0)
	for cluster_index: int in 3:
		var center := Vector2(330.0 + cluster_index * 317.0 + row_index * 24.0, y)
		var wave := PackedVector2Array()
		for index: int in 7:
			wave.append(center + Vector2(index * 24.0 - 72.0, sin(_elapsed * 1.8 + index) * 9.0))
		draw_polyline(
			wave,
			Color(tint.r, tint.g, tint.b, 0.42 + (pulse * 0.28 if observed else 0.0)),
			7.0 if observed else 4.0,
			true,
		)


func _draw_bloom_row(altitude: float, row_index: int, observed: bool) -> void:
	var tint := _place_tint()
	var y := _row_y(altitude)
	for cluster_index: int in 3:
		var center := Vector2(420.0 + cluster_index * 320.0 - row_index * 18.0, y)
		var bloom := 10.0 + (sin(_elapsed * 2.4 + cluster_index) * 2.5 if observed else 0.0)
		for petal: int in 5:
			var angle := float(petal) * TAU / 5.0
			draw_circle(
				center + Vector2.from_angle(angle) * bloom * 0.55,
				bloom * 0.46,
				Color(tint.r, tint.g * 0.6, tint.b * 0.8, 0.72 if observed else 0.42),
			)
		draw_circle(center, bloom * 0.34, Color(1.0, 0.9, 0.42, 0.92 if observed else 0.58))


func _row_y(altitude: float) -> float:
	return lerpf(530.0, 205.0, clampf(altitude, 0.0, 1.0))


func _draw_progress_glimmer() -> void:
	var x := lerpf(85.0, 1180.0, clampf(_progress, 0.0, 1.0))
	var y := lerpf(520.0, 190.0, clampf(_altitude, 0.0, 1.0))
	draw_circle(Vector2(x, y), 13.0 + sin(_elapsed * 3.5) * 2.0, Color(1.0, 0.92, 0.55, 0.28))


func _draw_playful_bump_sparkle() -> void:
	var center := _stage_position(_altitude)
	for spark_index: int in 6:
		var angle := float(spark_index) * TAU / 6.0 + _elapsed * 1.4
		draw_circle(
			center + Vector2.from_angle(angle) * 34.0,
			5.0,
			Color(1.0, 0.93, 0.62, 0.6),
		)


# Where Stella sits on the Storybook Stage for a given height, matching the traversal
# placement the shell applies to her illustration.
func _stage_position(altitude: float) -> Vector2:
	return Vector2(
		lerpf(300.0, 1040.0, clampf(_progress, 0.0, 1.0)),
		lerpf(520.0, 190.0, clampf(altitude, 0.0, 1.0)),
	)


func _observed_visual_responses() -> Array[String]:
	var responses: Array[String] = []
	for observed_interaction: String in _observed_interactions:
		responses.append(PLACE_CONTENT.visual_response(_place, observed_interaction))
	return responses
