class_name BirthdayCastleApproach
extends Control

const PATH_HEIGHT := 92.0

var _rainbow_path_texture: Texture2D
var _rainbow_path_count := 0
var _paths: Array[TextureRect] = []
var _elapsed := 0.0


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	resized.connect(_layout_paths)
	_layout_paths()


func _process(delta: float) -> void:
	if not visible or not is_finite(delta) or delta <= 0.0:
		return
	_elapsed += delta
	for path_index: int in _paths.size():
		var path := _paths[path_index]
		path.modulate.a = 0.42 + 0.08 * sin(_elapsed * 2.0 + path_index * 0.7)


# Every returning path uses the one approved treatment. Six instances make the six
# recovered Stars' Paths legible at once without inventing a second visual language.
func configure(texture: Texture2D, rainbow_path_count: int) -> void:
	if texture == _rainbow_path_texture and rainbow_path_count == _rainbow_path_count:
		return
	_rainbow_path_texture = texture
	_rainbow_path_count = maxi(0, rainbow_path_count)
	for path: TextureRect in _paths:
		path.free()
	_paths = []
	for path_index: int in _rainbow_path_count:
		var path := TextureRect.new()
		path.name = "ReturningRainbowPath%d" % (path_index + 1)
		path.texture = _rainbow_path_texture
		path.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		path.stretch_mode = TextureRect.STRETCH_SCALE
		path.mouse_filter = Control.MOUSE_FILTER_IGNORE
		path.pivot_offset = Vector2(0.0, PATH_HEIGHT * 0.5)
		add_child(path)
		_paths.append(path)
	_layout_paths()


func visual_evidence() -> Dictionary:
	var every_path_visible := not _paths.is_empty()
	for path: TextureRect in _paths:
		every_path_visible = every_path_visible and path.is_visible_in_tree()
	return {
		"visible": visible and every_path_visible,
		"rainbow_path_count": _paths.size() if visible else 0,
		"converging": visible and _paths_converge(),
	}


func _layout_paths() -> void:
	if _paths.is_empty():
		return
	var stage_size := size if size.x > 0.0 and size.y > 0.0 else Vector2(1280.0, 720.0)
	var destination := Vector2(stage_size.x * 0.82, stage_size.y * 0.54)
	var spacing := stage_size.y * 0.115
	for path_index: int in _paths.size():
		var start := Vector2(
			-stage_size.x * 0.18,
			stage_size.y * 0.14 + path_index * spacing,
		)
		var path := _paths[path_index]
		path.position = start
		path.size = Vector2(start.distance_to(destination), PATH_HEIGHT)
		path.rotation = start.angle_to_point(destination)


func _paths_converge() -> bool:
	if _paths.size() != _rainbow_path_count or _paths.size() < 2:
		return false
	var first_rotation: float = _paths.front().rotation
	var last_rotation: float = _paths.back().rotation
	return first_rotation > 0.0 and last_rotation < 0.0
