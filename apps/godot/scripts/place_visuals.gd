class_name PlaceVisuals
extends Control

const PHASE_CELEBRATION := "celebration"
const PHASE_CLOUD_REST := "cloud-rest"
const PLACE_CONTENT := preload("res://scripts/place_content.gd")
const BAND_HIGH := PLACE_CONTENT.BAND_HIGH
const BAND_LOW := PLACE_CONTENT.BAND_LOW
const DEFAULT_TINT := Color(0.96, 0.86, 0.94)

var _phase := ""
var _place: Dictionary = {}
var _progress := 0.0
var _altitude := 0.5
var _observed_interactions: Array[String] = []
var _playful_bump_wobble := false
var _cloud_rest_altitude := 0.36
var _elapsed := 0.0


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	queue_redraw()


func _process(delta: float) -> void:
	if not visible or not is_finite(delta) or delta <= 0.0:
		return
	_elapsed += delta
	queue_redraw()


func configure_place(place: Dictionary) -> void:
	if _place == place:
		return
	_place = place.duplicate(true)
	queue_redraw()


func set_story_state(state: Dictionary) -> void:
	var phase := str(state.get("phase", ""))
	var progress := float(state.get("progress", 0.0))
	var altitude := float(state.get("altitude", 0.5))
	var playful_bump_wobble := bool(state.get("playful_bump_wobble", false))
	var cloud_rest_altitude := float(state.get("cloud_rest_altitude", 0.36))
	var observed_interactions: Array[String] = []
	for interaction: Variant in state.get("observed_interactions", []):
		observed_interactions.append(str(interaction))
	if (
		phase == _phase
		and is_equal_approx(progress, _progress)
		and is_equal_approx(altitude, _altitude)
		and playful_bump_wobble == _playful_bump_wobble
		and is_equal_approx(cloud_rest_altitude, _cloud_rest_altitude)
		and observed_interactions == _observed_interactions
	):
		return
	_phase = phase
	_progress = progress
	_altitude = altitude
	_playful_bump_wobble = playful_bump_wobble
	_cloud_rest_altitude = cloud_rest_altitude
	_observed_interactions = observed_interactions
	queue_redraw()


func visual_evidence() -> Dictionary:
	var resting := visible and _phase == PHASE_CLOUD_REST
	var travelling := visible and _phase != PHASE_CELEBRATION and not resting
	return {
		"place": str(_place.get("id", "")),
		"tint": str(_place.get("tint", "")),
		"single_corridor_visible": travelling,
		"fork_visible": false,
		"atmospheric_motion": visible,
		"high_interaction_visible": travelling and not _band_interaction(BAND_HIGH).is_empty(),
		"low_interaction_visible": travelling and not _band_interaction(BAND_LOW).is_empty(),
		"observed_visual_responses": _observed_visual_responses(),
		"resting_cloud_visible": resting,
		"place_tint_applied": travelling,
		"playful_bump_wobble_visible": visible and _playful_bump_wobble and travelling,
		"celebration_visible": visible and _phase == PHASE_CELEBRATION,
	}


func _draw() -> void:
	if not visible:
		return
	# Cloud Rest is the gentlest moment in the game, so it is the most familiar: the
	# place's own tint, corridor, and delights give way to one shared resting sky.
	if _phase == PHASE_CLOUD_REST:
		_draw_resting_sky()
		_draw_resting_cloud()
		return
	_draw_atmosphere()
	if _phase == PHASE_CELEBRATION:
		_draw_arrival_echo()
		return
	_draw_single_corridor()
	_draw_high_band_clusters()
	_draw_low_band_clusters()
	_draw_progress_glimmer()
	if _playful_bump_wobble:
		_draw_playful_bump_sparkle()
	if _phase in ["birthday-star-approach", "birthday-star-moment"]:
		_draw_birthday_star(Vector2(1112.0, 365.0), 24.0 + sin(_elapsed * 2.2) * 2.0)


# One soft veil settles the place behind the resting cloud, so a rest in any place
# reads the same to the child.
func _draw_resting_sky() -> void:
	draw_rect(Rect2(Vector2.ZERO, size), Color(0.97, 0.96, 1.0, 0.72))
	for index: int in 18:
		var drift := fmod(_elapsed * (5.0 + index % 3) + index * 83.0, 1420.0) - 70.0
		var y := 95.0 + fmod(index * 97.0 + sin(_elapsed * 0.45 + index) * 34.0, 535.0)
		draw_circle(Vector2(drift, y), 2.0 + float(index % 3), Color(1.0, 1.0, 1.0, 0.42))


# Each place paints the same composition in its own light; the tint is place data.
func _place_tint() -> Color:
	var tint := str(_place.get("tint", ""))
	return Color.from_string(tint, DEFAULT_TINT) if not tint.is_empty() else DEFAULT_TINT


func _band_interaction(altitude_band: String) -> Dictionary:
	return PLACE_CONTENT.interaction(_place, altitude_band)


func _band_observed(altitude_band: String) -> bool:
	var interaction := _band_interaction(altitude_band)
	return _observed_interactions.has(str(interaction.get("id", "")))


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


# The high band reads as ribbons of light strung across the upper Stage.
func _draw_high_band_clusters() -> void:
	if _band_interaction(BAND_HIGH).is_empty():
		return
	var tint := _place_tint()
	var centers := [Vector2(330.0, 230.0), Vector2(650.0, 205.0), Vector2(965.0, 250.0)]
	var pulse := 0.5 + 0.5 * sin(_elapsed * 3.0)
	var observed := _band_observed(BAND_HIGH)
	for center: Vector2 in centers:
		var wave := PackedVector2Array()
		for index: int in 7:
			wave.append(center + Vector2(index * 24.0 - 72.0, sin(_elapsed * 1.8 + index) * 9.0))
		draw_polyline(
			wave,
			Color(tint.r, tint.g, tint.b, 0.42 + (pulse * 0.28 if observed else 0.0)),
			7.0 if observed else 4.0,
			true,
		)


# The low band reads as blooms of light gathered along the lower Stage.
func _draw_low_band_clusters() -> void:
	if _band_interaction(BAND_LOW).is_empty():
		return
	var tint := _place_tint()
	var centers := [Vector2(420.0, 505.0), Vector2(760.0, 530.0), Vector2(1060.0, 485.0)]
	var observed := _band_observed(BAND_LOW)
	for cluster_index: int in centers.size():
		var center: Vector2 = centers[cluster_index]
		var bloom := 10.0 + (sin(_elapsed * 2.4 + cluster_index) * 2.5 if observed else 0.0)
		for petal: int in 5:
			var angle := float(petal) * TAU / 5.0
			draw_circle(
				center + Vector2.from_angle(angle) * bloom * 0.55,
				bloom * 0.46,
				Color(tint.r, tint.g * 0.6, tint.b * 0.8, 0.72 if observed else 0.42),
			)
		draw_circle(center, bloom * 0.34, Color(1.0, 0.9, 0.42, 0.92 if observed else 0.58))


func _draw_progress_glimmer() -> void:
	var x := lerpf(85.0, 1180.0, clampf(_progress, 0.0, 1.0))
	var y := lerpf(520.0, 190.0, clampf(_altitude, 0.0, 1.0))
	draw_circle(Vector2(x, y), 13.0 + sin(_elapsed * 3.5) * 2.0, Color(1.0, 0.92, 0.55, 0.28))


# Cloud Rest shows Stella settling onto something solid and soft, right where she was.
# It is painted the same way in every place so the gentlest moment stays familiar.
func _draw_resting_cloud() -> void:
	var center := _stage_position(_cloud_rest_altitude) + Vector2(0.0, 64.0)
	var breath := sin(_elapsed * 1.1) * 3.0
	for puff_index: int in 5:
		var offset := Vector2(float(puff_index - 2) * 34.0, absf(float(puff_index - 2)) * 7.0)
		draw_circle(
			center + offset + Vector2(0.0, breath),
			42.0 - absf(float(puff_index - 2)) * 7.0,
			Color(1.0, 0.98, 1.0, 0.86),
		)
	draw_circle(center + Vector2(0.0, breath), 54.0, Color(0.98, 0.94, 1.0, 0.34))


func _draw_playful_bump_sparkle() -> void:
	var center := _stage_position(_altitude)
	for spark_index: int in 6:
		var angle := float(spark_index) * TAU / 6.0 + _elapsed * 1.4
		draw_circle(
			center + Vector2.from_angle(angle) * 34.0,
			5.0,
			Color(1.0, 0.93, 0.62, 0.6),
		)


func _draw_arrival_echo() -> void:
	for ribbon_index: int in 4:
		var y := 96.0 + ribbon_index * 38.0
		var wave := PackedVector2Array()
		for point_index: int in 18:
			var x := 710.0 + point_index * 38.0
			wave.append(Vector2(x, y + sin(_elapsed * 1.6 + point_index * 0.5) * 9.0))
		draw_polyline(wave, Color(0.9, 0.97, 1.0, 0.34), 5.0, true)
	for rose_index: int in 12:
		var center := Vector2(
			720.0 + float(rose_index % 6) * 94.0,
			500.0 + float(rose_index / 6) * 68.0 + sin(_elapsed * 1.8 + rose_index) * 5.0,
		)
		draw_circle(center, 9.0, Color(1.0, 0.51, 0.69, 0.44))
		draw_circle(center, 3.0, Color(1.0, 0.91, 0.48, 0.72))


func _draw_birthday_star(center: Vector2, radius: float) -> void:
	var points := PackedVector2Array()
	for index: int in 10:
		var point_radius := radius if index % 2 == 0 else radius * 0.44
		var angle := -PI / 2.0 + float(index) * PI / 5.0
		points.append(center + Vector2.from_angle(angle) * point_radius)
	draw_colored_polygon(points, Color(1.0, 0.78, 0.25, 0.94))
	draw_polyline(points + PackedVector2Array([points[0]]), Color(1.0, 0.96, 0.72, 0.96), 3.0, true)


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
