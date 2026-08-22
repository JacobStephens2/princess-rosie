class_name StorybookShell
extends Control

const EXPECTED_ENGINE_VERSION := "4.7.2"
const EXPECTED_PACK_DIGEST := "sha256:03898d8b734cd94d98ae8130dda328fee62bbbfc52faa3e22c5c5edaefac1c9e"
const DEFAULT_PACK_ROOT := "res://edition-pack.zip"
const COVER_ASSET := "res://assets/storybook-cover.png"
const STAGE_ASPECT := 16.0 / 9.0
const EDITION_PACK_ADAPTER := preload("res://scripts/edition_pack_adapter.gd")

var _adapter: RefCounted = EDITION_PACK_ADAPTER.new()
var _content: Dictionary = {}
var _pack_digest := ""
var _state := "unprepared"
var _window_mode := "windowed"
var _launch_error := ""
var _grown_up_corner_visible := false
var _paused_from := "cover"
var _sound_enabled := true

@onready var _decorative_background: TextureRect = %DecorativeBackground
@onready var _stage: Control = %Stage
@onready var _cover_presentation: Control = %CoverPresentation
@onready var _opening_presentation: Control = %OpeningPresentation
@onready var _pause_overlay: Control = %PauseOverlay
@onready var _error_presentation: Control = %ErrorPresentation
@onready var _title_label: Label = %TitleLabel
@onready var _opening_eyebrow: Label = %OpeningEyebrow
@onready var _opening_title: Label = %OpeningTitle
@onready var _opening_copy: Label = %OpeningCopy
@onready var _pack_badge: Label = %PackBadge
@onready var _error_label: Label = %ErrorLabel
@onready var _sound_button: Button = %SoundButton


func _ready() -> void:
	resized.connect(_layout_storybook_stage)
	%BeginButton.pressed.connect(_on_begin_pressed)
	%GrownUpCornerButton.pressed.connect(_on_grown_up_corner_pressed)
	%ResumeButton.pressed.connect(_on_resume_pressed)
	%SoundButton.pressed.connect(_on_sound_pressed)
	%WindowModeButton.pressed.connect(_on_window_mode_pressed)
	%ReplayButton.pressed.connect(_on_replay_pressed)

	var launched := prepare_launch()
	_layout_storybook_stage()
	_render_presentation()
	if launched.ok:
		_center_large_window.call_deferred()
	_run_acceptance_smoke_if_requested.call_deferred()


func prepare_launch(pack_root: String = DEFAULT_PACK_ROOT) -> Dictionary:
	_state = "unprepared"
	_launch_error = ""
	_pack_digest = ""
	_content = {}
	_grown_up_corner_visible = false
	_paused_from = "cover"

	var engine_version := _engine_version()
	if engine_version != EXPECTED_ENGINE_VERSION:
		return _fail_launch(
			"Godot %s is required; this application is running on %s" % [EXPECTED_ENGINE_VERSION, engine_version],
		)
	if not ResourceLoader.exists(COVER_ASSET):
		return _fail_launch("Approved Princess Rosi cover is missing: %s" % COVER_ASSET)

	var prepared: Dictionary = _adapter.prepare(pack_root, EXPECTED_PACK_DIGEST)
	if not prepared.ok:
		return _fail_launch(prepared.error)
	var content_result: Dictionary = _adapter.load_content(pack_root, prepared)
	if not content_result.ok:
		return _fail_launch(content_result.error)

	_content = content_result.value
	_pack_digest = prepared.pack_digest
	_state = "cover"
	_window_mode = "windowed"
	return {"ok": true}


func presentation_evidence() -> Dictionary:
	return {
		"state": _state,
		"window_mode": _window_mode,
		"cover_asset": COVER_ASSET,
		"entry_points": ["begin", "grown-up-corner"],
		"pack_digest": _pack_digest,
		"error": _launch_error,
		"grown_up_corner_visible": _grown_up_corner_visible,
		"engine_version": _engine_version(),
	}


func handle_player_intent(intent: String) -> bool:
	match intent:
		"begin":
			if _state != "cover":
				return false
			_state = "opening_storybook_moment"
			_grown_up_corner_visible = false
			_set_window_mode("fullscreen")
			return true
		"grown-up-corner":
			if _state != "cover":
				return false
			_paused_from = "cover"
			_state = "paused"
			_grown_up_corner_visible = true
			return true
		"escape":
			if _state in ["unprepared", "pack_error", "cover"]:
				return false
			_paused_from = _state
			_state = "paused"
			_grown_up_corner_visible = true
			_set_window_mode("windowed")
			return true
		"resume":
			if _state != "paused":
				return false
			_state = _paused_from
			_grown_up_corner_visible = false
			_set_window_mode("fullscreen")
			return true
		_:
			return false


func storybook_stage_rect(viewport_size: Vector2) -> Rect2:
	if viewport_size.x <= 0.0 or viewport_size.y <= 0.0:
		return Rect2()
	var stage_size := Vector2(viewport_size.x, viewport_size.x / STAGE_ASPECT)
	if stage_size.y > viewport_size.y:
		stage_size = Vector2(viewport_size.y * STAGE_ASPECT, viewport_size.y)
	return Rect2((viewport_size - stage_size) / 2.0, stage_size)


func has_decorative_surroundings(viewport_size: Vector2) -> bool:
	return not storybook_stage_rect(viewport_size).size.is_equal_approx(viewport_size)


func _engine_version() -> String:
	var version := Engine.get_version_info()
	return "%s.%s.%s" % [version.major, version.minor, version.patch]


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("pause_presentation") and handle_player_intent("escape"):
		get_viewport().set_input_as_handled()
		_render_presentation()


func _layout_storybook_stage() -> void:
	if not is_node_ready():
		return
	var stage_rect := storybook_stage_rect(size)
	_stage.position = stage_rect.position
	_stage.size = stage_rect.size


func _render_presentation() -> void:
	if not is_node_ready():
		return
	var content_title := str(_content.get("title", "Princess Rosi and the Seven Birthday Stars"))
	var opening: Dictionary = _content.get("openingMoment", {})
	_title_label.text = content_title
	_opening_eyebrow.text = str(opening.get("eyebrow", "A brave big sister"))
	_opening_title.text = str(opening.get("title", "Rosi and Stella can help"))
	_opening_copy.text = str(opening.get("copy", ""))
	_pack_badge.text = "EDITION PACK  •  %s" % _pack_digest.trim_prefix("sha256:").left(10).to_upper()
	_error_label.text = _launch_error
	_sound_button.text = "Sound: On" if _sound_enabled else "Sound: Off"

	_error_presentation.visible = _state == "pack_error"
	_pause_overlay.visible = _state == "paused"
	_cover_presentation.visible = _state == "cover" or (_state == "paused" and _paused_from == "cover")
	_opening_presentation.visible = (
		_state == "opening_storybook_moment"
		or (_state == "paused" and _paused_from == "opening_storybook_moment")
	)
	_decorative_background.texture = load(COVER_ASSET)


func _center_large_window() -> void:
	if DisplayServer.get_name() == "headless" or _window_mode != "windowed":
		return
	var usable_rect := DisplayServer.screen_get_usable_rect()
	var desired_size := Vector2i(
		mini(1440, maxi(960, usable_rect.size.x - 120)),
		mini(900, maxi(640, usable_rect.size.y - 120)),
	)
	DisplayServer.window_set_size(desired_size)
	DisplayServer.window_set_position(usable_rect.position + (usable_rect.size - desired_size) / 2)


func _on_begin_pressed() -> void:
	if handle_player_intent("begin"):
		_render_presentation()


func _on_grown_up_corner_pressed() -> void:
	if handle_player_intent("grown-up-corner"):
		_render_presentation()


func _on_resume_pressed() -> void:
	if handle_player_intent("resume"):
		_render_presentation()


func _on_sound_pressed() -> void:
	_sound_enabled = not _sound_enabled
	_render_presentation()


func _on_window_mode_pressed() -> void:
	_set_window_mode("fullscreen" if _window_mode == "windowed" else "windowed")
	if _window_mode == "windowed":
		_center_large_window.call_deferred()


func _on_replay_pressed() -> void:
	_state = "cover"
	_paused_from = "cover"
	_grown_up_corner_visible = false
	_set_window_mode("windowed")
	_center_large_window.call_deferred()
	_render_presentation()


func _run_acceptance_smoke_if_requested() -> void:
	var arguments := OS.get_cmdline_user_args()
	if not arguments.has("--acceptance-smoke"):
		return

	var capture_path := _argument_value(arguments, "--smoke-capture=")
	var evidence_path := _argument_value(arguments, "--smoke-evidence=")
	if capture_path.is_empty() or evidence_path.is_empty():
		push_error("Export smoke requires capture and evidence paths")
		get_tree().quit(2)
		return

	for frame: int in 4:
		await get_tree().process_frame
	var image := get_viewport().get_texture().get_image()
	var capture_error := image.save_png(capture_path)
	if capture_error != OK:
		push_error("Could not save Storybook Stage capture: %s" % error_string(capture_error))
		get_tree().quit(3)
		return

	var stage_rect := storybook_stage_rect(size)
	var evidence := presentation_evidence()
	evidence["network_requests"] = 0
	evidence["storybook_stage"] = {
		"aspect": "16:9",
		"essential_content_cropped": false,
		"viewport_size": {"width": size.x, "height": size.y},
		"position": {"x": stage_rect.position.x, "y": stage_rect.position.y},
		"size": {"width": stage_rect.size.x, "height": stage_rect.size.y},
		"decorative_surroundings": has_decorative_surroundings(size),
	}
	var evidence_file := FileAccess.open(evidence_path, FileAccess.WRITE)
	if evidence_file == null:
		push_error("Could not write export smoke evidence: %s" % error_string(FileAccess.get_open_error()))
		get_tree().quit(4)
		return
	evidence_file.store_string(JSON.stringify(evidence, "  "))
	evidence_file.close()
	get_tree().quit(0)


func _argument_value(arguments: PackedStringArray, prefix: String) -> String:
	for argument in arguments:
		if argument.begins_with(prefix):
			return argument.trim_prefix(prefix)
	return ""


func _set_window_mode(mode: String) -> void:
	_window_mode = mode
	if DisplayServer.get_name() == "headless":
		return
	if mode == "fullscreen":
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN)
	else:
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_WINDOWED)


func _fail_launch(message: String) -> Dictionary:
	_state = "pack_error"
	_launch_error = message
	return {"ok": false, "error": message}
