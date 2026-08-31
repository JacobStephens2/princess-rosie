class_name CelebrationStars
extends Control

# Dad's Castle Star is already shining on the approach. The six recovered Stars join it
# over the celebration as one constellation rather than as a seventh returning Path.

const STAR_SIZE := 58.0
const JOIN_SECONDS := 0.9
const CASTLE_STAR_INDEX := 3

var _star_texture: Texture2D
var _stars: Array[TextureRect] = []
var _phase := ""
var _elapsed := 0.0
var _shimmer := 0.0
var _gathered_count := 0


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	_ensure_stars()
	resized.connect(_layout_stars)
	_layout_stars()


func _process(delta: float) -> void:
	if not visible or not is_finite(delta) or delta <= 0.0:
		return
	_shimmer += delta
	_present_stars()


func configure(texture: Texture2D) -> void:
	if texture == _star_texture:
		return
	_star_texture = texture
	_ensure_stars()
	for star: TextureRect in _stars:
		star.texture = _star_texture
	_layout_stars()


func set_story_state(state: Dictionary) -> void:
	_phase = str(state.get("phase", ""))
	_elapsed = float(state.get("elapsed", 0.0))
	_gathered_count = int(state.get("gathered", 0))
	visible = _phase in ["birthday-castle-approach", "celebration"]
	_present_stars()


func visual_evidence() -> Dictionary:
	if not visible:
		return {
			"visible": false,
			"castle_star_visible": false,
			"gathered_star_count": 0,
			"united_star_count": 0,
			"constellation": false,
		}
	var castle_visible := _layer_visible(CASTLE_STAR_INDEX)
	var gathered_visible := 0
	for star_index: int in _stars.size():
		if star_index == CASTLE_STAR_INDEX:
			continue
		if _layer_visible(star_index):
			gathered_visible += 1
	var united := gathered_visible + (1 if castle_visible else 0)
	return {
		"visible": true,
		"castle_star_visible": castle_visible,
		"gathered_star_count": gathered_visible,
		"united_star_count": united,
		"constellation": united == 7,
	}


func _ensure_stars() -> void:
	if not _stars.is_empty():
		return
	for star_index: int in 7:
		var star := TextureRect.new()
		star.name = (
			"CastleStar"
			if star_index == CASTLE_STAR_INDEX
			else "RecoveredStar%d" % (
				(star_index + 1) if star_index < CASTLE_STAR_INDEX else star_index
			)
		)
		star.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		star.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		star.mouse_filter = Control.MOUSE_FILTER_IGNORE
		star.pivot_offset = Vector2(STAR_SIZE * 0.5, STAR_SIZE * 0.5)
		add_child(star)
		_stars.append(star)


func _layout_stars() -> void:
	if _stars.is_empty():
		return
	var stage_size := size if size.x > 0.0 and size.y > 0.0 else Vector2(1280.0, 720.0)
	var arc_center := Vector2(stage_size.x * 0.5, stage_size.y * 0.16)
	var arc_radius := Vector2(stage_size.x * 0.23, stage_size.y * 0.09)
	for star_index: int in _stars.size():
		var t := (float(star_index) / 6.0) * 2.0 - 1.0
		var star := _stars[star_index]
		star.size = Vector2(STAR_SIZE, STAR_SIZE)
		star.position = Vector2(
			arc_center.x + t * arc_radius.x - STAR_SIZE * 0.5,
			arc_center.y + (t * t - 1.0) * arc_radius.y - STAR_SIZE * 0.5,
		)


func _present_stars() -> void:
	if _stars.is_empty():
		return
	var join_progress := (
		1.0
		if _phase == "celebration" and _elapsed >= JOIN_SECONDS
		else (
			clampf(_elapsed / JOIN_SECONDS, 0.0, 1.0)
			if _phase == "celebration"
			else 0.0
		)
	)
	for star_index: int in _stars.size():
		var star := _stars[star_index]
		var is_castle := star_index == CASTLE_STAR_INDEX
		star.visible = is_castle or join_progress > 0.0
		if is_castle:
			star.modulate.a = 0.92 + 0.08 * sin(_shimmer * 2.4)
			star.scale = Vector2.ONE * (1.08 + 0.04 * sin(_shimmer * 2.1))
		else:
			var slot := star_index if star_index < CASTLE_STAR_INDEX else star_index - 1
			if slot >= _gathered_count:
				star.visible = false
				star.modulate.a = 0.0
				continue
			var appear_at := float(slot) / 6.0 * 0.7
			var local := (
				1.0
				if join_progress >= 1.0
				else clampf((join_progress - appear_at) / 0.3, 0.0, 1.0)
			)
			star.modulate.a = local
			star.scale = Vector2.ONE * lerpf(0.4, 1.0, local)
			star.visible = local > 0.0


func _layer_visible(star_index: int) -> bool:
	if star_index < 0 or star_index >= _stars.size():
		return false
	var star := _stars[star_index]
	return star.visible and star.modulate.a >= 0.6 and star.is_visible_in_tree()
