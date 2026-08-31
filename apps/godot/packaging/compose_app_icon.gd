extends SceneTree

## Compose the macOS app icon from approved Edition Pack art only.
##
## Sources: shared/edition/source-media/flight/rosie-stella.png and
## shared/edition/source-media/journey/birthday-star.png. The cutout and
## Birthday Star are placed on a sapphire jewel field; no new likeness is
## generated.

const ROSIE_RELATIVE := "shared/edition/source-media/flight/rosie-stella.png"
const STAR_RELATIVE := "shared/edition/source-media/journey/birthday-star.png"
const ICON_SIZE := 1024
const FIELD := Color8(27, 62, 122, 255)
const FIELD_EDGE := Color8(16, 36, 78, 255)


func _init() -> void:
	var project_root := ProjectSettings.globalize_path("res://").rstrip("/")
	var repo_root := project_root.get_base_dir().get_base_dir()
	var dest_dir := project_root.path_join("packaging")
	var dest_path := dest_dir.path_join("app-icon.png")

	var rosie := Image.load_from_file(repo_root.path_join(ROSIE_RELATIVE))
	if rosie == null or rosie.is_empty():
		push_error("Could not load Princess Rosie and Stella cutout from %s" % ROSIE_RELATIVE)
		quit(1)
		return
	var star := Image.load_from_file(repo_root.path_join(STAR_RELATIVE))
	if star == null or star.is_empty():
		push_error("Could not load Birthday Star from %s" % STAR_RELATIVE)
		quit(1)
		return
	_clear_near_black_pixels(star)

	var canvas := Image.create(ICON_SIZE, ICON_SIZE, false, Image.FORMAT_RGBA8)
	_fill_jewel_field(canvas)

	var rosie_layer := _scaled_to_fit(_crop_opaque(rosie), 920)
	_blend(
		canvas,
		rosie_layer,
		Vector2i((ICON_SIZE - rosie_layer.get_width()) / 2, ICON_SIZE - rosie_layer.get_height() - 36),
	)

	var star_layer := _scaled_to_fit(_crop_opaque(star), 280)
	_blend(canvas, star_layer, Vector2i(ICON_SIZE - star_layer.get_width() - 48, 40))

	var make_error := DirAccess.make_dir_recursive_absolute(dest_dir)
	if make_error != OK:
		push_error("Could not create %s" % dest_dir)
		quit(1)
		return
	var save_error := canvas.save_png(dest_path)
	if save_error != OK:
		push_error("Could not write %s" % dest_path)
		quit(1)
		return
	print("Wrote %s" % dest_path)
	quit(0)


func _clear_near_black_pixels(image: Image) -> void:
	for y in image.get_height():
		for x in image.get_width():
			var color := image.get_pixel(x, y)
			var luminance := color.get_luminance()
			if luminance < 0.10:
				color.a = 0.0
			elif luminance < 0.22:
				color.a *= (luminance - 0.10) / 0.12
			image.set_pixel(x, y, color)


func _fill_jewel_field(image: Image) -> void:
	var center := Vector2(ICON_SIZE * 0.5, ICON_SIZE * 0.42)
	var max_distance := Vector2.ZERO.distance_to(Vector2(ICON_SIZE, ICON_SIZE)) * 0.62
	for y in ICON_SIZE:
		for x in ICON_SIZE:
			var distance := Vector2(x, y).distance_to(center) / max_distance
			image.set_pixel(x, y, FIELD.lerp(FIELD_EDGE, clampf(distance, 0.0, 1.0)))


func _crop_opaque(image: Image) -> Image:
	var used: Rect2i = image.get_used_rect()
	if used.size.x <= 0 or used.size.y <= 0:
		return image
	return image.get_region(used)


func _scaled_to_fit(image: Image, max_size: int) -> Image:
	var longest := maxi(image.get_width(), image.get_height())
	var scale := float(max_size) / float(longest)
	var copy := image.duplicate()
	copy.resize(
		maxi(1, int(round(float(image.get_width()) * scale))),
		maxi(1, int(round(float(image.get_height()) * scale))),
		Image.INTERPOLATE_LANCZOS,
	)
	return copy


func _blend(dest: Image, src: Image, origin: Vector2i) -> void:
	dest.blend_rect(src, Rect2i(Vector2i.ZERO, src.get_size()), origin)
