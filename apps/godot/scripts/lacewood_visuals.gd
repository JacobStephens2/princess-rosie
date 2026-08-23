class_name LacewoodVisuals
extends Control

const PHASE_PATH_CHOICE := "lacewood-path-choice"
const PHASE_CELEBRATION := "celebration"
const CANOPY_ROUTE := "lacewood.canopy"
const FLOOR_ROUTE := "lacewood.floor"

var _phase := ""
var _chosen_route := ""
var _shimmer_route := ""
var _route_presentations := {}
var _elapsed := 0.0


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	queue_redraw()


func _process(delta: float) -> void:
	if not visible or not is_finite(delta) or delta <= 0.0:
		return
	_elapsed += delta
	queue_redraw()


func configure_routes(route_values: Array) -> void:
	var route_presentations := {}
	for route_value: Variant in route_values:
		if not route_value is Dictionary:
			continue
		var route_id := str(route_value.get("id", ""))
		if not route_id.is_empty():
			route_presentations[route_id] = {
				"visual_response": str(route_value.get("visualResponse", "")),
				"celebration_echo": str(route_value.get("celebrationEcho", "")),
			}
	_route_presentations = route_presentations


func set_story_state(state: Dictionary) -> void:
	var phase := str(state.get("phase", ""))
	var chosen_route := str(state.get("chosen_route", ""))
	var shimmer_route := str(state.get("shimmer_route", ""))
	if phase == _phase and chosen_route == _chosen_route and shimmer_route == _shimmer_route:
		return
	_phase = phase
	_chosen_route = chosen_route
	_shimmer_route = shimmer_route
	queue_redraw()


func visual_evidence() -> Dictionary:
	return {
		"both_routes_visible": visible and _phase != PHASE_CELEBRATION,
		"routes_equal_emphasis": visible and _phase == PHASE_PATH_CHOICE and _chosen_route.is_empty(),
		"atmospheric_motion": visible,
		"selected_visual_response": _selected_visual_response(),
		"rendered_visual_response": _rendered_visual_response(),
		"shimmer_route": _shimmer_route,
		"celebration_echo": _selected_celebration_echo(),
	}


func _draw() -> void:
	if not visible:
		return
	_draw_atmosphere()
	if _phase == PHASE_CELEBRATION:
		_draw_celebration_echo()
		return
	_draw_canopy_route()
	_draw_floor_route()
	_draw_selected_visual_response()
	if _phase in ["birthday-star-approach", "birthday-star-moment"]:
		_draw_birthday_star(Vector2(1112.0, 365.0), 24.0 + sin(_elapsed * 2.2) * 2.0)


func _draw_atmosphere() -> void:
	for index: int in 18:
		var drift := fmod(_elapsed * (9.0 + index % 4) + index * 83.0, 1420.0) - 70.0
		var y := 95.0 + fmod(index * 97.0 + sin(_elapsed * 0.45 + index) * 34.0, 535.0)
		var color := (
			Color(1.0, 0.86, 0.48, 0.25)
			if index % 3 == 0
			else Color(0.86, 0.96, 1.0, 0.18)
		)
		draw_circle(Vector2(drift, y), 2.0 + float(index % 3), color)


func _draw_canopy_route() -> void:
	var points := _canopy_route_points()
	var emphasis := _route_emphasis(CANOPY_ROUTE)
	var base_alpha: float = emphasis.base_alpha
	draw_polyline(points, Color(0.92, 0.97, 1.0, base_alpha), 12.0, true)
	draw_polyline(points, Color(0.54, 0.74, 0.84, base_alpha * 0.62), 3.0, true)
	for index: int in range(1, points.size() - 1):
		var center := points[index]
		draw_arc(center, 13.0, 0.0, TAU, 18, Color(1.0, 1.0, 1.0, base_alpha), 2.0, true)
	_draw_shimmer(points, CANOPY_ROUTE)


func _draw_floor_route() -> void:
	var points := _floor_route_points()
	var emphasis := _route_emphasis(FLOOR_ROUTE)
	var base_alpha: float = emphasis.base_alpha
	draw_polyline(points, Color(1.0, 0.46, 0.67, base_alpha * 0.7), 14.0, true)
	for index: int in range(1, points.size() - 1):
		var center := points[index]
		var bloom := 10.0
		for petal: int in 5:
			var angle := float(petal) * TAU / 5.0
			draw_circle(
				center + Vector2.from_angle(angle) * bloom * 0.48,
				bloom * 0.42,
				Color(1.0, 0.53, 0.7, base_alpha),
			)
		draw_circle(center, bloom * 0.3, Color(1.0, 0.84, 0.4, base_alpha))
	_draw_shimmer(points, FLOOR_ROUTE)


func _draw_selected_visual_response() -> void:
	var points := _selected_route_points()
	if points.is_empty():
		return
	match _rendered_visual_response():
		"silver-ribbons-unfurl":
			var pulse := 0.5 + 0.5 * sin(_elapsed * 3.0)
			draw_polyline(points, Color(0.95, 0.99, 1.0, 0.28 + pulse * 0.18), 19.0, true)
			for index: int in range(1, points.size() - 1):
				draw_arc(
					points[index],
					14.0 + pulse * 4.0,
					0.0,
					TAU,
					18,
					Color(1.0, 1.0, 1.0, 0.72),
					3.0,
					true,
				)
		"rose-lights-bloom":
			for index: int in range(1, points.size() - 1):
				var bloom := 13.0 + sin(_elapsed * 2.4 + index) * 2.5
				for petal: int in 5:
					var angle := float(petal) * TAU / 5.0
					draw_circle(
						points[index] + Vector2.from_angle(angle) * bloom * 0.55,
						bloom * 0.46,
						Color(1.0, 0.5, 0.72, 0.72),
					)
				draw_circle(points[index], bloom * 0.34, Color(1.0, 0.9, 0.42, 0.92))


func _draw_shimmer(points: PackedVector2Array, route_id: String) -> void:
	if _shimmer_route != route_id:
		return
	var restrained_alpha := 0.11 + (sin(_elapsed * 1.8) + 1.0) * 0.035
	draw_polyline(points, Color(1.0, 0.94, 0.66, restrained_alpha), 22.0, true)


func _draw_celebration_echo() -> void:
	match _selected_celebration_echo():
		"silver-ribbons":
			for index: int in 4:
				var y := 96.0 + index * 38.0
				var wave := PackedVector2Array()
				for point_index: int in 18:
					var x := 710.0 + point_index * 38.0
					wave.append(Vector2(x, y + sin(_elapsed * 1.6 + point_index * 0.5) * 9.0))
				draw_polyline(wave, Color(0.9, 0.97, 1.0, 0.34), 5.0, true)
		"rose-lights":
			for index: int in 12:
				var center := Vector2(
					720.0 + float(index % 6) * 94.0,
					500.0 + float(index / 6) * 68.0 + sin(_elapsed * 1.8 + index) * 5.0,
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


func _selected_visual_response() -> String:
	return str(_route_presentations.get(_chosen_route, {}).get("visual_response", ""))


func _rendered_visual_response() -> String:
	var response := _selected_visual_response()
	return response if response in ["silver-ribbons-unfurl", "rose-lights-bloom"] else ""


func _selected_celebration_echo() -> String:
	if _phase != PHASE_CELEBRATION:
		return ""
	return str(_route_presentations.get(_chosen_route, {}).get("celebration_echo", ""))


func _route_emphasis(route_id: String) -> Dictionary:
	var selected := _chosen_route == route_id
	return {
		"selected": selected,
		"base_alpha": 0.56 if _chosen_route.is_empty() else (0.78 if selected else 0.24),
	}


func _selected_route_points() -> PackedVector2Array:
	if _chosen_route == CANOPY_ROUTE:
		return _canopy_route_points()
	if _chosen_route == FLOOR_ROUTE:
		return _floor_route_points()
	return PackedVector2Array()


func _canopy_route_points() -> PackedVector2Array:
	return PackedVector2Array([
		Vector2(95.0, 350.0),
		Vector2(280.0, 276.0),
		Vector2(510.0, 223.0),
		Vector2(755.0, 235.0),
		Vector2(970.0, 292.0),
		Vector2(1168.0, 354.0),
	])


func _floor_route_points() -> PackedVector2Array:
	return PackedVector2Array([
		Vector2(95.0, 430.0),
		Vector2(280.0, 494.0),
		Vector2(510.0, 536.0),
		Vector2(755.0, 520.0),
		Vector2(970.0, 455.0),
		Vector2(1168.0, 374.0),
	])
