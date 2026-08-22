class_name StorybookShell
extends Control

enum PresentationState {
	UNPREPARED,
	PACK_ERROR,
	COVER,
	OPENING_STORYBOOK_MOMENT,
	PAUSED,
}

enum PresentationWindowMode {
	WINDOWED,
	FULLSCREEN,
}

const EXPECTED_ENGINE_VERSION := "4.7.2"
const DEFAULT_PACK_SOURCE := "res://edition-pack.zip"
const PACK_DIGEST_ASSET := "res://edition-pack.digest"
const COVER_ASSET := "res://assets/storybook-cover.png"
const STAGE_ASPECT := 16.0 / 9.0
const EDITION_PACK_ADAPTER := preload("res://scripts/edition_pack_adapter.gd")

const INTENT_BEGIN: StringName = &"begin"
const INTENT_GROWN_UP_CORNER: StringName = &"grown-up-corner"
const INTENT_ESCAPE: StringName = &"escape"
const INTENT_RESUME: StringName = &"resume"

const STATE_IDS := {
	PresentationState.UNPREPARED: "unprepared",
	PresentationState.PACK_ERROR: "pack_error",
	PresentationState.COVER: "cover",
	PresentationState.OPENING_STORYBOOK_MOMENT: "opening_storybook_moment",
	PresentationState.PAUSED: "paused",
}
const WINDOW_MODE_IDS := {
	PresentationWindowMode.WINDOWED: "windowed",
	PresentationWindowMode.FULLSCREEN: "fullscreen",
}

var _adapter: RefCounted = EDITION_PACK_ADAPTER.new()
var _content: Dictionary = {}
var _pack_digest := ""
var _state: PresentationState = PresentationState.UNPREPARED
var _window_mode: PresentationWindowMode = PresentationWindowMode.WINDOWED
var _launch_error := ""
var _grown_up_corner_visible := false
var _paused_from: PresentationState = PresentationState.COVER

@onready var _stage: Control = %Stage
@onready var _cover_presentation: Control = %CoverPresentation
@onready var _opening_presentation: Control = %OpeningPresentation
@onready var _pause_overlay: Control = %PauseOverlay
@onready var _error_presentation: Control = %ErrorPresentation
@onready var _cover_art: TextureRect = %CoverArt
@onready var _title_card: Control = %TitleCard
@onready var _begin_button: Button = %BeginButton
@onready var _grown_up_corner_button: Button = %GrownUpCornerButton
@onready var _title_label: Label = %TitleLabel
@onready var _opening_eyebrow: Label = %OpeningEyebrow
@onready var _opening_title: Label = %OpeningTitle
@onready var _opening_copy: Label = %OpeningCopy
@onready var _pack_badge: Label = %PackBadge
@onready var _error_label: Label = %ErrorLabel
@onready var _export_smoke_probe: Node = %ExportSmokeProbe


func _ready() -> void:
	resized.connect(_layout_storybook_stage)
	_begin_button.pressed.connect(_on_begin_pressed)
	_grown_up_corner_button.pressed.connect(_on_grown_up_corner_pressed)
	%ResumeButton.pressed.connect(_on_resume_pressed)
	%WindowModeButton.pressed.connect(_on_window_mode_pressed)
	%ReplayButton.pressed.connect(_on_replay_pressed)

	var launched := prepare_launch()
	_layout_storybook_stage()
	_render_presentation()
	if launched.ok:
		_center_large_window.call_deferred()
	_export_smoke_probe.call_deferred("run_if_requested", self)


func prepare_launch(pack_source: String = DEFAULT_PACK_SOURCE) -> Dictionary:
	_state = PresentationState.UNPREPARED
	_launch_error = ""
	_pack_digest = ""
	_content = {}
	_grown_up_corner_visible = false
	_paused_from = PresentationState.COVER

	var engine_version := _engine_version()
	if engine_version != EXPECTED_ENGINE_VERSION:
		return _fail_launch(
			"Godot %s is required; this application is running on %s" % [EXPECTED_ENGINE_VERSION, engine_version],
		)
	if not ResourceLoader.exists(COVER_ASSET):
		return _fail_launch("Approved Princess Rosi cover is missing: %s" % COVER_ASSET)

	var expected_digest_result := _read_expected_pack_digest()
	if not expected_digest_result.ok:
		return _fail_launch(expected_digest_result.error)
	var prepared: Dictionary = _adapter.prepare(pack_source, expected_digest_result.value)
	if not prepared.ok:
		return _fail_launch(prepared.error)
	var content_result: Dictionary = _adapter.load_content(pack_source, prepared)
	if not content_result.ok:
		return _fail_launch(content_result.error)

	_content = content_result.value
	_pack_digest = prepared.pack_digest
	_state = PresentationState.COVER
	_window_mode = PresentationWindowMode.WINDOWED
	return {"ok": true}


func presentation_evidence() -> Dictionary:
	return {
		"state": STATE_IDS[_state],
		"window_mode": WINDOW_MODE_IDS[_window_mode],
		"cover_asset": COVER_ASSET,
		"entry_points": [str(INTENT_BEGIN), str(INTENT_GROWN_UP_CORNER)],
		"pack_digest": _pack_digest,
		"error": _launch_error,
		"grown_up_corner_visible": _grown_up_corner_visible,
		"engine_version": _engine_version(),
	}


func storybook_stage_evidence() -> Dictionary:
	if not is_node_ready():
		return {"ready": false}
	var stage_rect := _stage.get_global_rect()
	var essential_controls: Array[Control] = [
		_cover_art,
		_title_card,
		_begin_button,
		_grown_up_corner_button,
	]
	var essential_content_cropped := false
	for essential_control in essential_controls:
		if not stage_rect.encloses(essential_control.get_global_rect()):
			essential_content_cropped = true
			break
	var stage_aspect := stage_rect.size.x / stage_rect.size.y
	return {
		"ready": true,
		"aspect": "16:9" if is_equal_approx(stage_aspect, STAGE_ASPECT) else "invalid",
		"essential_content_cropped": essential_content_cropped,
		"cover_visible": _cover_art.texture != null and _cover_art.is_visible_in_tree(),
		"entry_points_visible": (
			_begin_button.is_visible_in_tree()
			and _grown_up_corner_button.is_visible_in_tree()
		),
		"viewport_size": {"width": size.x, "height": size.y},
		"position": {"x": stage_rect.position.x, "y": stage_rect.position.y},
		"size": {"width": stage_rect.size.x, "height": stage_rect.size.y},
		"decorative_surroundings": has_decorative_surroundings(size),
	}


func handle_player_intent(intent: StringName) -> bool:
	match intent:
		INTENT_BEGIN:
			if _state != PresentationState.COVER:
				return false
			_state = PresentationState.OPENING_STORYBOOK_MOMENT
			_grown_up_corner_visible = false
			_set_window_mode(PresentationWindowMode.FULLSCREEN)
			return true
		INTENT_GROWN_UP_CORNER:
			if _state != PresentationState.COVER:
				return false
			_paused_from = PresentationState.COVER
			_state = PresentationState.PAUSED
			_grown_up_corner_visible = true
			return true
		INTENT_ESCAPE:
			if _state in [
				PresentationState.UNPREPARED,
				PresentationState.PACK_ERROR,
				PresentationState.COVER,
				PresentationState.PAUSED,
			]:
				return false
			_paused_from = _state
			_state = PresentationState.PAUSED
			_grown_up_corner_visible = true
			_set_window_mode(PresentationWindowMode.WINDOWED)
			return true
		INTENT_RESUME:
			if _state != PresentationState.PAUSED:
				return false
			_state = _paused_from
			_grown_up_corner_visible = false
			_set_window_mode(
				PresentationWindowMode.WINDOWED
				if _state == PresentationState.COVER
				else PresentationWindowMode.FULLSCREEN,
			)
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
	if event.is_action_pressed("pause_presentation") and handle_player_intent(INTENT_ESCAPE):
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

	_error_presentation.visible = _state == PresentationState.PACK_ERROR
	_pause_overlay.visible = _state == PresentationState.PAUSED
	_cover_presentation.visible = (
		_state == PresentationState.COVER
		or (_state == PresentationState.PAUSED and _paused_from == PresentationState.COVER)
	)
	_opening_presentation.visible = (
		_state == PresentationState.OPENING_STORYBOOK_MOMENT
		or (
			_state == PresentationState.PAUSED
			and _paused_from == PresentationState.OPENING_STORYBOOK_MOMENT
		)
	)


func _center_large_window() -> void:
	if DisplayServer.get_name() == "headless" or _window_mode != PresentationWindowMode.WINDOWED:
		return
	var usable_rect := DisplayServer.screen_get_usable_rect()
	var desired_size := Vector2i(
		mini(1440, maxi(1, usable_rect.size.x - 120)),
		mini(900, maxi(1, usable_rect.size.y - 120)),
	)
	DisplayServer.window_set_size(desired_size)
	DisplayServer.window_set_position(usable_rect.position + (usable_rect.size - desired_size) / 2)


func _on_begin_pressed() -> void:
	if handle_player_intent(INTENT_BEGIN):
		_render_presentation()


func _on_grown_up_corner_pressed() -> void:
	if handle_player_intent(INTENT_GROWN_UP_CORNER):
		_render_presentation()


func _on_resume_pressed() -> void:
	if handle_player_intent(INTENT_RESUME):
		_render_presentation()


func _on_window_mode_pressed() -> void:
	var target_mode := (
		PresentationWindowMode.FULLSCREEN
		if _window_mode == PresentationWindowMode.WINDOWED
		else PresentationWindowMode.WINDOWED
	)
	_set_window_mode(target_mode)
	if _window_mode == PresentationWindowMode.WINDOWED:
		_center_large_window.call_deferred()


func _on_replay_pressed() -> void:
	_state = PresentationState.COVER
	_paused_from = PresentationState.COVER
	_grown_up_corner_visible = false
	_set_window_mode(PresentationWindowMode.WINDOWED)
	_center_large_window.call_deferred()
	_render_presentation()


func _set_window_mode(mode: PresentationWindowMode) -> void:
	_window_mode = mode
	if DisplayServer.get_name() == "headless":
		return
	if mode == PresentationWindowMode.FULLSCREEN:
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN)
	else:
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_WINDOWED)


func _read_expected_pack_digest() -> Dictionary:
	if not FileAccess.file_exists(PACK_DIGEST_ASSET):
		return {"ok": false, "error": "Edition Pack digest binding is missing"}
	var expected_digest := FileAccess.get_file_as_string(PACK_DIGEST_ASSET).strip_edges()
	if expected_digest.length() != 71 or not expected_digest.begins_with("sha256:"):
		return {"ok": false, "error": "Edition Pack digest binding is invalid"}
	return {"ok": true, "value": expected_digest}


func _fail_launch(message: String) -> Dictionary:
	_state = PresentationState.PACK_ERROR
	_launch_error = message
	return {"ok": false, "error": message}
