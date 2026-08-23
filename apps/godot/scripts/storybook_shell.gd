class_name StorybookShell
extends Control

enum PresentationState {
	UNPREPARED,
	PACK_ERROR,
	COVER,
	OPENING_STORYBOOK_MOMENT,
	ACTIVE_PLAY,
	BIRTHDAY_STAR_MOMENT,
	CELEBRATION,
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
const SOUNDSCAPE_PLAYER := preload("res://scripts/soundscape_player.gd")
const GODOT_AUDIO_ADAPTER := preload("res://scripts/godot_audio_adapter.gd")

const INTENT_BEGIN: StringName = &"begin"
const INTENT_GROWN_UP_CORNER: StringName = &"grown-up-corner"
const INTENT_ESCAPE: StringName = &"escape"
const INTENT_RESUME: StringName = &"resume"
const INTENT_TOGGLE_SOUND: StringName = &"toggle-sound"
const INTENT_CONTINUE: StringName = &"continue"
const INTENT_ACTION_PRESSED: StringName = &"action-pressed"
const INTENT_ACTION_RELEASED: StringName = &"action-released"
const INTENT_REPLAY: StringName = &"replay"
const EVENT_OPENING_MOMENT := &"sound-event.opening-storybook-moment"
const EVENT_FLIGHT_LAUNCH := &"sound-event.flight-launch"
const EVENT_MOVEMENT_STATE := &"sound-event.movement-state"
const EVENT_PLACE_ENTRY := &"sound-event.place-entry"
const EVENT_VIGNETTE_INTERACTION := &"sound-event.vignette-interaction"
const EVENT_PATH_CHOICE_AVAILABLE := &"sound-event.path-choice-available"
const EVENT_PATH_CHOICE_SELECTED := &"sound-event.path-choice-selected"
const EVENT_JOURNEY_HISTORY_SHIMMER := &"sound-event.journey-history-shimmer"
const EVENT_PLAYFUL_BUMP := &"sound-event.playful-bump"
const EVENT_NEAR_MISS := &"sound-event.near-miss"
const EVENT_BIRTHDAY_STAR_PROXIMITY := &"sound-event.birthday-star-proximity"
const EVENT_BIRTHDAY_STAR_GATHERED := &"sound-event.birthday-star-gathered"
const EVENT_RAINBOW_PATH_OPENED := &"sound-event.rainbow-path-opened"
const EVENT_BIRTHDAY_STAR_MOMENT := &"sound-event.birthday-star-moment"
const EVENT_CLOUD_REST_ENTERED := &"sound-event.cloud-rest-entered"
const EVENT_CLOUD_REST_EXITED := &"sound-event.cloud-rest-exited"
const EVENT_BIRTHDAY_CASTLE_ARRIVAL := &"sound-event.birthday-castle-arrival"
const EVENT_CELEBRATION_INTERACTION := &"sound-event.celebration-interaction"
const EVENT_REPLAY := &"sound-event.replay"
const EVENT_SOUND_PREFERENCE_CHANGED := &"sound-event.sound-preference-changed"
const PHASE_FLIGHT := "flight"
const PHASE_PATH_CHOICE := "lacewood-path-choice"
const PHASE_ROUTE := "lacewood-route"
const PHASE_CLOUD_REST := "cloud-rest"
const PHASE_PEAK_UPDRAFT := "pellegrino-peak-updraft"
const PHASE_STAR_APPROACH := "birthday-star-approach"
const PHASE_BIRTHDAY_STAR_MOMENT := "birthday-star-moment"
const PHASE_CELEBRATION := "celebration"
const LACEWOOD_PLACE := "lacewood"
const LACEWOOD_PATH_CHOICE := "path-choice.lacewood"
const LACEWOOD_CANOPY_ROUTE := "lacewood.canopy"
const LACEWOOD_FLOOR_ROUTE := "lacewood.floor"
const LACEWOOD_BIRTHDAY_STAR := "birthday-star.lacewood"
const LACEWOOD_RAINBOW_PATH := "rainbow-path.lacewood"
const LACEWOOD_FAMILY_GUEST := "Gram"
const PEAK_PLACE := "pellegrino-peak"
const PEAK_UPDRAFT_VIGNETTE := "flower-petal-updraft"
const PEAK_PLAYFUL_KIND := "flower-petal"
const PEAK_BIRTHDAY_STAR := "birthday-star.pellegrino-peak"
const PEAK_RAINBOW_PATH := "rainbow-path.pellegrino-peak"
const PEAK_FAMILY_GUEST := "Aunt"
const PEAK_UPDRAFT_SECONDS := 2.8
const PLAYFUL_BUMPS_BEFORE_CLOUD_REST := 3

const PLACE_IDENTITY_DEFAULTS := {
	LACEWOOD_PLACE: {
		"birthdayStar": LACEWOOD_BIRTHDAY_STAR,
		"rainbowPath": LACEWOOD_RAINBOW_PATH,
		"familyGuest": LACEWOOD_FAMILY_GUEST,
	},
	PEAK_PLACE: {
		"birthdayStar": PEAK_BIRTHDAY_STAR,
		"rainbowPath": PEAK_RAINBOW_PATH,
		"familyGuest": PEAK_FAMILY_GUEST,
	},
}

const STATE_IDS := {
	PresentationState.UNPREPARED: "unprepared",
	PresentationState.PACK_ERROR: "pack_error",
	PresentationState.COVER: "cover",
	PresentationState.OPENING_STORYBOOK_MOMENT: "opening_storybook_moment",
	PresentationState.ACTIVE_PLAY: "active_play",
	PresentationState.BIRTHDAY_STAR_MOMENT: "birthday_star_moment",
	PresentationState.CELEBRATION: "celebration",
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
var _sound_enabled := true
var _opening_moments: Array = []
var _opening_textures: Dictionary = {}
var _opening_media_paths: Dictionary = {}
var _opening_moment_index := 0
var _movement_state := ""
var _sound_events: Array[Dictionary] = []
var _journey_phase := ""
var _journey_phase_elapsed := 0.0
var _journey_checkpoint := 0
var _action_held := false
var _place := ""
var _chosen_route := ""
var _journey_playful_bumps := 0
var _bumps_since_cloud_rest := 0
var _cloud_rest_count := 0
var _birthday_stars: Array[String] = []
var _rainbow_paths: Array[String] = []
var _path_choices := {}
var _journey_history := {}
var _soundscape: RefCounted
var _engine_audio: Node

@onready var _stage: Control = %Stage
@onready var _cover_presentation: Control = %CoverPresentation
@onready var _opening_presentation: Control = %OpeningPresentation
@onready var _active_play_presentation: Control = %ActivePlayPresentation
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
@onready var _opening_art: TextureRect = %OpeningArt
@onready var _continue_button: Button = %ContinueButton
@onready var _pack_badge: Label = %PackBadge
@onready var _error_label: Label = %ErrorLabel
@onready var _export_smoke_probe: Node = %ExportSmokeProbe
@onready var _sound_button: Button = %SoundButton
@onready var _flight_title: Label = %FlightTitle
@onready var _flight_instruction: Label = %FlightInstruction


func _ready() -> void:
	resized.connect(_layout_storybook_stage)
	_begin_button.pressed.connect(_on_begin_pressed)
	_grown_up_corner_button.pressed.connect(_on_grown_up_corner_pressed)
	%ResumeButton.pressed.connect(_on_resume_pressed)
	%WindowModeButton.pressed.connect(_on_window_mode_pressed)
	_sound_button.pressed.connect(_on_sound_pressed)
	_continue_button.pressed.connect(_on_continue_pressed)
	%ReplayButton.pressed.connect(_on_replay_pressed)

	var launched := prepare_launch()
	if launched.ok:
		_engine_audio = GODOT_AUDIO_ADAPTER.new()
		add_child(_engine_audio)
		_soundscape = SOUNDSCAPE_PLAYER.new(DEFAULT_PACK_SOURCE, _engine_audio)
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
	_opening_moments = []
	_opening_textures = {}
	_opening_media_paths = {}
	_opening_moment_index = 0
	_movement_state = ""
	_sound_events = []
	_journey_history = {}
	_reset_current_journey()
	_sound_enabled = true
	_grown_up_corner_visible = false
	_paused_from = PresentationState.COVER

	var engine_version := _engine_version()
	if engine_version != EXPECTED_ENGINE_VERSION:
		return _fail_launch(
			"Godot %s is required; this application is running on %s" % [EXPECTED_ENGINE_VERSION, engine_version],
		)
	if not ResourceLoader.exists(COVER_ASSET):
		return _fail_launch("Approved Princess Rosi cover is missing: %s" % COVER_ASSET)

	var expected_digest := ""
	if pack_source == DEFAULT_PACK_SOURCE:
		var expected_digest_result := _read_expected_pack_digest()
		if not expected_digest_result.ok:
			return _fail_launch(expected_digest_result.error)
		expected_digest = expected_digest_result.value
	var prepared: Dictionary = _adapter.prepare(pack_source, expected_digest)
	if not prepared.ok:
		return _fail_launch(prepared.error)
	var content_result: Dictionary = _adapter.load_content(pack_source, prepared)
	if not content_result.ok:
		return _fail_launch(content_result.error)

	_content = content_result.value
	_opening_moments = _content.get("openingMoments", [])
	if _opening_moments.is_empty():
		return _fail_launch("Edition Pack has no Opening Storybook Moments")
	var media_loaded := _load_opening_media(pack_source, prepared)
	if not media_loaded.ok:
		return _fail_launch(media_loaded.error)
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
		"sound_enabled": _sound_enabled,
		"opening_moment": _current_opening_moment().get("id", ""),
		"opening_media_paths": _opening_media_paths.duplicate(true),
		"movement_state": _movement_state,
		"journey_phase": _journey_phase,
		"place": _place,
		"chosen_route": _chosen_route,
		"playful_bumps": _journey_playful_bumps,
		"cloud_rests": _cloud_rest_count,
		"birthday_stars": _birthday_stars.duplicate(),
		"rainbow_paths": _rainbow_paths.duplicate(),
		"path_choices": _path_choices.duplicate(true),
		"journey_history": _journey_history.duplicate(true),
		"engine_version": _engine_version(),
	}


func sound_event_evidence() -> Array[Dictionary]:
	return _sound_events.duplicate(true)


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
		"opening_visible": _opening_art.texture != null and _opening_art.is_visible_in_tree(),
		"birthday_star_moment_visible": (
			_state == PresentationState.BIRTHDAY_STAR_MOMENT
			and _opening_art.texture != null
			and _opening_art.is_visible_in_tree()
		),
		"celebration_visible": (
			_state == PresentationState.CELEBRATION
			and _active_play_presentation.is_visible_in_tree()
		),
		"active_play_visible": _active_play_presentation.is_visible_in_tree(),
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
			_grown_up_corner_visible = false
			_set_window_mode(PresentationWindowMode.FULLSCREEN)
			_show_opening_moment(0)
			return true
		INTENT_CONTINUE:
			if _state == PresentationState.BIRTHDAY_STAR_MOMENT:
				if not _chosen_route.is_empty():
					_journey_history[_chosen_route] = true
				_action_held = false
				if _place == LACEWOOD_PLACE:
					_state = PresentationState.ACTIVE_PLAY
					_enter_pellegrino_peak()
					return true
				_journey_phase = PHASE_CELEBRATION
				_state = PresentationState.CELEBRATION
				_report_sound_event(EVENT_BIRTHDAY_CASTLE_ARRIVAL, {})
				return true
			if _state != PresentationState.OPENING_STORYBOOK_MOMENT:
				return false
			if _opening_moment_index < _opening_moments.size() - 1:
				_show_opening_moment(_opening_moment_index + 1)
				return true
			_state = PresentationState.ACTIVE_PLAY
			_movement_state = "flight"
			_reset_current_journey()
			_journey_phase = PHASE_FLIGHT
			_report_sound_event(EVENT_FLIGHT_LAUNCH, {})
			_report_sound_event(EVENT_MOVEMENT_STATE, {"state": _movement_state})
			return true
		INTENT_ACTION_PRESSED:
			if _state == PresentationState.CELEBRATION:
				if _action_held:
					return false
				_action_held = true
				_report_sound_event(
					EVENT_CELEBRATION_INTERACTION,
					{"action": "dance-again"},
				)
				return true
			if _state != PresentationState.ACTIVE_PLAY:
				return false
			_action_held = true
			if _journey_phase == PHASE_CLOUD_REST:
				_resume_from_cloud_rest()
				return true
			if not _journey_phase in [PHASE_FLIGHT, PHASE_PEAK_UPDRAFT]:
				return true
			if _movement_state == "rise":
				return false
			_movement_state = "rise"
			_report_sound_event(EVENT_MOVEMENT_STATE, {"state": _movement_state})
			if _journey_phase == PHASE_PEAK_UPDRAFT:
				_report_sound_event(
					EVENT_VIGNETTE_INTERACTION,
					{"place": PEAK_PLACE, "interaction": PEAK_UPDRAFT_VIGNETTE},
				)
			return true
		INTENT_ACTION_RELEASED:
			if _state == PresentationState.CELEBRATION:
				if not _action_held:
					return false
				_action_held = false
				return true
			if _state != PresentationState.ACTIVE_PLAY:
				return false
			_action_held = false
			if not _journey_phase in [PHASE_FLIGHT, PHASE_PEAK_UPDRAFT]:
				return true
			if _movement_state == "glide":
				return false
			_movement_state = "glide"
			_report_sound_event(EVENT_MOVEMENT_STATE, {"state": _movement_state})
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
		INTENT_TOGGLE_SOUND:
			if _state != PresentationState.PAUSED:
				return false
			_sound_enabled = not _sound_enabled
			_report_sound_event(
				EVENT_SOUND_PREFERENCE_CHANGED,
				{"enabled": _sound_enabled},
			)
			return true
		INTENT_REPLAY:
			if _state != PresentationState.PAUSED:
				return false
			_report_sound_event(EVENT_REPLAY, {"destination": "opening-storybook"})
			_state = PresentationState.COVER
			_paused_from = PresentationState.COVER
			_opening_moment_index = 0
			_movement_state = ""
			_reset_current_journey()
			_grown_up_corner_visible = false
			_set_window_mode(PresentationWindowMode.WINDOWED)
			return true
		_:
			return false


func _process(delta: float) -> void:
	advance_journey(delta)


func advance_journey(delta: float) -> void:
	if _state != PresentationState.ACTIVE_PLAY or delta <= 0.0:
		return
	_journey_phase_elapsed += delta
	match _journey_phase:
		PHASE_FLIGHT:
			if _journey_phase_elapsed >= 0.75:
				_enter_lacewood()
		PHASE_PATH_CHOICE:
			if _journey_phase_elapsed >= 1.25:
				_choose_lacewood_route()
		PHASE_ROUTE:
			_advance_lacewood_route()
		PHASE_PEAK_UPDRAFT:
			_advance_pellegrino_peak_updraft()
		PHASE_STAR_APPROACH:
			_advance_birthday_star_sequence()
	_render_presentation()


func _enter_lacewood() -> void:
	_place = LACEWOOD_PLACE
	_journey_phase = PHASE_PATH_CHOICE
	_journey_phase_elapsed = 0.0
	_journey_checkpoint = 0
	_report_sound_event(EVENT_PLACE_ENTRY, {"place": LACEWOOD_PLACE})
	_report_sound_event(
		EVENT_PATH_CHOICE_AVAILABLE,
		{"pathChoice": LACEWOOD_PATH_CHOICE},
	)
	var unseen_route := ""
	if _journey_history.has(LACEWOOD_CANOPY_ROUTE) and not _journey_history.has(LACEWOOD_FLOOR_ROUTE):
		unseen_route = LACEWOOD_FLOOR_ROUTE
	elif _journey_history.has(LACEWOOD_FLOOR_ROUTE) and not _journey_history.has(LACEWOOD_CANOPY_ROUTE):
		unseen_route = LACEWOOD_CANOPY_ROUTE
	if not unseen_route.is_empty():
		_report_sound_event(
			EVENT_JOURNEY_HISTORY_SHIMMER,
			{"pathChoice": LACEWOOD_PATH_CHOICE, "route": unseen_route},
		)


func _choose_lacewood_route() -> void:
	_chosen_route = LACEWOOD_CANOPY_ROUTE if _action_held else LACEWOOD_FLOOR_ROUTE
	_path_choices[LACEWOOD_PATH_CHOICE] = _chosen_route
	_journey_phase = PHASE_ROUTE
	_journey_phase_elapsed = 0.0
	_journey_checkpoint = 0
	_report_sound_event(
		EVENT_PATH_CHOICE_SELECTED,
		{"pathChoice": LACEWOOD_PATH_CHOICE, "route": _chosen_route},
	)
	_report_sound_event(
		EVENT_VIGNETTE_INTERACTION,
		{
			"place": LACEWOOD_PLACE,
			"interaction": (
				"silver-ribbon-canopy"
				if _chosen_route == LACEWOOD_CANOPY_ROUTE
				else "rose-lit-floor"
			),
		},
	)


func _advance_lacewood_route() -> void:
	var thresholds := [0.45, 0.9, 1.35, 1.8]
	while _journey_phase == PHASE_ROUTE and _journey_checkpoint < thresholds.size():
		if _journey_phase_elapsed < thresholds[_journey_checkpoint]:
			return
		match _journey_checkpoint:
			0:
				_report_sound_event(
					EVENT_NEAR_MISS,
					{"place": LACEWOOD_PLACE, "kind": "silver-ribbon"},
				)
			1, 2, 3:
				_report_playful_bump("silver-ribbon")
		_journey_checkpoint += 1


# Pellegrino Peak has no Path Choice; its one-button vignette is the flower-petal
# updraft. Its two gentle local bumps are spaced wider than the bump cue so they
# never overlap, and they feed the same journey-wide Cloud Rest gate as every place.
func _enter_pellegrino_peak() -> void:
	_place = PEAK_PLACE
	_journey_phase = PHASE_PEAK_UPDRAFT
	_journey_phase_elapsed = 0.0
	_journey_checkpoint = 0
	_report_sound_event(EVENT_PLACE_ENTRY, {"place": PEAK_PLACE})


func _advance_pellegrino_peak_updraft() -> void:
	var thresholds := [0.5, 1.1, 2.1]
	while _journey_phase == PHASE_PEAK_UPDRAFT and _journey_checkpoint < thresholds.size():
		if _journey_phase_elapsed < thresholds[_journey_checkpoint]:
			return
		match _journey_checkpoint:
			0:
				_report_sound_event(
					EVENT_NEAR_MISS,
					{"place": PEAK_PLACE, "kind": PEAK_PLAYFUL_KIND},
				)
			1, 2:
				_report_playful_bump(PEAK_PLAYFUL_KIND)
		_journey_checkpoint += 1
	if _journey_phase == PHASE_PEAK_UPDRAFT and _journey_phase_elapsed >= PEAK_UPDRAFT_SECONDS:
		_journey_phase = PHASE_STAR_APPROACH
		_journey_phase_elapsed = 0.0
		_journey_checkpoint = 0


func _report_playful_bump(kind: String) -> void:
	_journey_playful_bumps += 1
	_bumps_since_cloud_rest += 1
	_report_sound_event(EVENT_PLAYFUL_BUMP, {"place": _place, "kind": kind})
	if _bumps_since_cloud_rest < PLAYFUL_BUMPS_BEFORE_CLOUD_REST:
		return
	_bumps_since_cloud_rest = 0
	_cloud_rest_count += 1
	_action_held = false
	_journey_phase = PHASE_CLOUD_REST
	_journey_phase_elapsed = 0.0
	_journey_checkpoint = 0
	_report_sound_event(EVENT_CLOUD_REST_ENTERED, {"place": _place})


func _resume_from_cloud_rest() -> void:
	_report_sound_event(EVENT_CLOUD_REST_EXITED, {"place": _place})
	_movement_state = "flight"
	_report_sound_event(EVENT_MOVEMENT_STATE, {"state": _movement_state})
	_journey_phase = PHASE_STAR_APPROACH
	_journey_phase_elapsed = 0.0
	_journey_checkpoint = 0


func _advance_birthday_star_sequence() -> void:
	var thresholds := [0.45, 1.0, 2.4, 4.9]
	var birthday_star := _place_identity("birthdayStar")
	var rainbow_path := _place_identity("rainbowPath")
	var family_guest := _place_identity("familyGuest")
	while _journey_phase == PHASE_STAR_APPROACH and _journey_checkpoint < thresholds.size():
		if _journey_phase_elapsed < thresholds[_journey_checkpoint]:
			return
		match _journey_checkpoint:
			0:
				_report_sound_event(
					EVENT_BIRTHDAY_STAR_PROXIMITY,
					{"birthdayStar": birthday_star},
				)
			1:
				if not _birthday_stars.has(birthday_star):
					_birthday_stars.append(birthday_star)
				_report_sound_event(
					EVENT_BIRTHDAY_STAR_GATHERED,
					{"birthdayStar": birthday_star},
				)
			2:
				if not _rainbow_paths.has(rainbow_path):
					_rainbow_paths.append(rainbow_path)
				_report_sound_event(
					EVENT_RAINBOW_PATH_OPENED,
					{"rainbowPath": rainbow_path, "familyGuest": family_guest},
				)
			3:
				_report_sound_event(
					EVENT_BIRTHDAY_STAR_MOMENT,
					{"place": _place, "familyGuest": family_guest},
				)
				_journey_phase = PHASE_BIRTHDAY_STAR_MOMENT
				_state = PresentationState.BIRTHDAY_STAR_MOMENT
		_journey_checkpoint += 1


func _reset_current_journey() -> void:
	_journey_phase = ""
	_journey_phase_elapsed = 0.0
	_journey_checkpoint = 0
	_action_held = false
	_place = ""
	_chosen_route = ""
	_journey_playful_bumps = 0
	_bumps_since_cloud_rest = 0
	_cloud_rest_count = 0
	_birthday_stars = []
	_rainbow_paths = []
	_path_choices = {}


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
		return
	if (
		_state in [PresentationState.ACTIVE_PLAY, PresentationState.CELEBRATION]
		and event.is_action_pressed("flight_action")
	):
		if handle_player_intent(INTENT_ACTION_PRESSED):
			get_viewport().set_input_as_handled()
			_render_presentation()
	elif (
		_state in [PresentationState.ACTIVE_PLAY, PresentationState.CELEBRATION]
		and event.is_action_released("flight_action")
	):
		if handle_player_intent(INTENT_ACTION_RELEASED):
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
	var opening: Dictionary = _current_opening_moment()
	_title_label.text = content_title
	if _state == PresentationState.BIRTHDAY_STAR_MOMENT:
		_opening_eyebrow.text = "A Birthday Star!"
		_opening_title.text = "%s's Rainbow Path" % _place_family_guest()
		_opening_copy.text = _birthday_star_moment_copy()
	else:
		_opening_eyebrow.text = str(opening.get("eyebrow", "A brave big sister"))
		_opening_title.text = str(opening.get("title", "Rosi and Stella can help"))
		_opening_copy.text = str(opening.get("copy", ""))
	var illustration_id: String = opening.get("illustration", "")
	if _opening_textures.has(illustration_id):
		_opening_art.texture = _opening_textures[illustration_id]
	_continue_button.text = (
		"Keep flying"
		if _state == PresentationState.BIRTHDAY_STAR_MOMENT
		else (
			"Begin flying"
			if _opening_moment_index == _opening_moments.size() - 1
			else "Turn the page"
		)
	)
	var flight_copy := _flight_presentation_copy()
	_flight_title.text = flight_copy.title
	_flight_instruction.text = flight_copy.instruction
	_pack_badge.text = "EDITION PACK  •  %s" % _pack_digest.trim_prefix("sha256:").left(10).to_upper()
	_error_label.text = _launch_error
	_sound_button.text = "Sound: On" if _sound_enabled else "Sound: Off"

	_error_presentation.visible = _state == PresentationState.PACK_ERROR
	_pause_overlay.visible = _state == PresentationState.PAUSED
	_cover_presentation.visible = (
		_state == PresentationState.COVER
		or (_state == PresentationState.PAUSED and _paused_from == PresentationState.COVER)
	)
	_opening_presentation.visible = (
		_state in [
			PresentationState.OPENING_STORYBOOK_MOMENT,
			PresentationState.BIRTHDAY_STAR_MOMENT,
		]
		or (
			_state == PresentationState.PAUSED
			and _paused_from in [
				PresentationState.OPENING_STORYBOOK_MOMENT,
				PresentationState.BIRTHDAY_STAR_MOMENT,
			]
		)
	)
	_active_play_presentation.visible = (
		_state in [PresentationState.ACTIVE_PLAY, PresentationState.CELEBRATION]
		or (
			_state == PresentationState.PAUSED
			and _paused_from in [PresentationState.ACTIVE_PLAY, PresentationState.CELEBRATION]
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


func _on_sound_pressed() -> void:
	if handle_player_intent(INTENT_TOGGLE_SOUND):
		_render_presentation()


func _on_continue_pressed() -> void:
	if handle_player_intent(INTENT_CONTINUE):
		_render_presentation()


func _on_replay_pressed() -> void:
	if handle_player_intent(INTENT_REPLAY):
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


func _report_sound_event(event_id: StringName, parameters: Dictionary) -> void:
	_sound_events.append({"event": str(event_id), "context": parameters.duplicate(true)})
	if _soundscape != null:
		_soundscape.report_event(event_id, parameters)


func _show_opening_moment(index: int) -> void:
	_opening_moment_index = clampi(index, 0, _opening_moments.size() - 1)
	_state = PresentationState.OPENING_STORYBOOK_MOMENT
	var opening := _current_opening_moment()
	_report_sound_event(EVENT_OPENING_MOMENT, {"moment": opening.get("id", "")})


func _current_opening_moment() -> Dictionary:
	if _opening_moments.is_empty() or _opening_moment_index >= _opening_moments.size():
		return {}
	var opening: Variant = _opening_moments[_opening_moment_index]
	return opening if opening is Dictionary else {}


# Every place resolves its own Birthday Star, Rainbow Path, Family Guest, and
# Birthday Star Moment copy from the Edition Pack, preferring the current place's
# chosen Path Choice route when that route has its own resolution copy.
func _place_content() -> Dictionary:
	for place_value: Variant in _content.get("places", []):
		if place_value is Dictionary and place_value.get("id") == _place:
			return place_value
	return {}


func _place_identity(field: String) -> String:
	var defaults: Dictionary = PLACE_IDENTITY_DEFAULTS.get(_place, {})
	return str(_place_content().get(field, defaults.get(field, "")))


func _place_family_guest() -> String:
	return _place_identity("familyGuest")


func _birthday_star_moment_copy() -> String:
	var place := _place_content()
	var default_copy := "Gram followed the gentle lights through Zélie’s Lacewood!"
	var path_choice: Dictionary = place.get("pathChoice", {})
	for route_value: Variant in path_choice.get("routes", []):
		if route_value is Dictionary and route_value.get("id") == _chosen_route:
			return str(route_value.get("birthdayStarMoment", default_copy))
	return str(place.get("birthdayStarMoment", default_copy))


func _flight_presentation_copy() -> Dictionary:
	match _journey_phase:
		PHASE_PATH_CHOICE:
			return {
				"title": "Zélie's Lacewood",
				"instruction": "Hold for silver ribbons • release for rose lights",
			}
		PHASE_ROUTE:
			return {
				"title": (
					"Silver-ribbon canopy"
					if _chosen_route == LACEWOOD_CANOPY_ROUTE
					else "Rose-lit woodland floor"
				),
				"instruction": "Both gentle ways lead safely to Gram",
			}
		PHASE_CLOUD_REST:
			return {
				"title": "Cloud Rest",
				"instruction": "Stella is safe • press to fly on",
			}
		PHASE_PEAK_UPDRAFT:
			return {
				"title": "Pellegrino Peak",
				"instruction": "Press to ride a flower-petal updraft",
			}
		PHASE_STAR_APPROACH:
			return {
				"title": "A Birthday Star is near!",
				"instruction": "It will joyfully fly to Stella",
			}
		PHASE_CELEBRATION:
			return {
				"title": "Birthday Castle Celebration!",
				"instruction": "Press to dance again • both paths helped Gram, and Aunt rode the updrafts",
			}
		_:
			return {
				"title": "Stella is flying!",
				"instruction": "Hold to rise • release to glide",
			}


func _load_opening_media(pack_source: String, prepared_pack: Dictionary) -> Dictionary:
	var media_result: Dictionary = _adapter.load_media(pack_source, prepared_pack)
	if not media_result.ok:
		return media_result
	var media_by_id: Dictionary = {}
	for media_value: Variant in media_result.value.get("media", []):
		if media_value is Dictionary:
			media_by_id[media_value.get("id")] = media_value
	for opening_value: Variant in _opening_moments:
		if not opening_value is Dictionary:
			return {"ok": false, "error": "Opening Storybook Moment content is invalid"}
		var illustration_id: String = opening_value.get("illustration", "")
		var media: Dictionary = media_by_id.get(illustration_id, {})
		var relative_path: String = media.get("path", "")
		if relative_path.is_empty():
			return {
				"ok": false,
				"error": "Opening Storybook Moment media is missing: %s" % illustration_id,
			}
		var texture_result: Dictionary = _adapter.load_png_texture(pack_source, relative_path)
		if not texture_result.ok:
			return texture_result
		_opening_textures[illustration_id] = texture_result.texture
		_opening_media_paths[illustration_id] = relative_path
	return {"ok": true}


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
