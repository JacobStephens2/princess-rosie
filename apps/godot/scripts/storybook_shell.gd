class_name StorybookShell
extends Control

signal exit_requested

enum PresentationState {
	UNPREPARED,
	PACK_ERROR,
	COVER,
	OPENING_STORYBOOK_MOMENT,
	ACTIVE_PLAY,
	BIRTHDAY_STAR_MOMENT,
	CELEBRATION,
	GROWN_UP_CORNER,
}

const EXPECTED_ENGINE_VERSION := "4.7.2"
# The exported application carries the Edition Pack staged under res://edition by
# addons/edition_pack_export; in the editor the workspace store is read directly.
const BUNDLED_PACK_SOURCE := "res://edition"
const WORKSPACE_PACK_SOURCE := "res://../../shared/edition"
const COVER_ASSET := "res://assets/storybook-cover.png"
const STAGE_ASPECT := 16.0 / 9.0
const EDITION_PACK_ADAPTER := preload("res://scripts/edition_pack_adapter.gd")
const SOUNDSCAPE_PLAYER := preload("res://scripts/soundscape_player.gd")
const GODOT_AUDIO_ADAPTER := preload("res://scripts/godot_audio_adapter.gd")
const PLACE_CONTENT := preload("res://scripts/place_content.gd")

const INTENT_BEGIN: StringName = &"begin"
const INTENT_GROWN_UP_CORNER: StringName = &"grown-up-corner"
const INTENT_ESCAPE: StringName = &"escape"
const INTENT_TOGGLE_SOUND: StringName = &"toggle-sound"
const INTENT_CONTINUE: StringName = &"continue"
const INTENT_ACTION_PRESSED: StringName = &"action-pressed"
const INTENT_ACTION_RELEASED: StringName = &"action-released"
const INTENT_REPLAY: StringName = &"replay"
const SOURCE_KEYBOARD_SPACE: StringName = &"keyboard.space"
const SOURCE_POINTER_PRIMARY: StringName = &"pointer.primary"
const EVENT_OPENING_MOMENT := &"sound-event.opening-storybook-moment"
const EVENT_FLIGHT_LAUNCH := &"sound-event.flight-launch"
const EVENT_MOVEMENT_STATE := &"sound-event.movement-state"
const EVENT_PLACE_ENTRY := &"sound-event.place-entry"
const EVENT_VIGNETTE_INTERACTION := &"sound-event.vignette-interaction"
const EVENT_PLAYFUL_BUMP := &"sound-event.playful-bump"
const EVENT_NEAR_MISS := &"sound-event.near-miss"
const EVENT_BIRTHDAY_STAR_PROXIMITY := &"sound-event.birthday-star-proximity"
const EVENT_BIRTHDAY_STAR_GATHERED := &"sound-event.birthday-star-gathered"
const EVENT_RAINBOW_PATH_OPENED := &"sound-event.rainbow-path-opened"
const EVENT_BIRTHDAY_STAR_MOMENT := &"sound-event.birthday-star-moment"
const EVENT_BIRTHDAY_CASTLE_ARRIVAL := &"sound-event.birthday-castle-arrival"
const EVENT_CELEBRATION_INTERACTION := &"sound-event.celebration-interaction"
const EVENT_REPLAY := &"sound-event.replay"
const EVENT_SOUND_PREFERENCE_CHANGED := &"sound-event.sound-preference-changed"
const ACTION_FLY_AGAIN := "fly-again"
const GROWN_UP_CORNER_CONTROLS := ["toggle-sound", "replay"]
const PHASE_FLIGHT := "flight"
const PHASE_PLACE_FLIGHT := "place-flight"
const PHASE_STAR_APPROACH := "birthday-star-approach"
const PHASE_BIRTHDAY_STAR_MOMENT := "birthday-star-moment"
const PHASE_BIRTHDAY_CASTLE_APPROACH := "birthday-castle-approach"
const PHASE_CELEBRATION := "celebration"
const MILESTONE_ALTITUDE_BAND: StringName = &"altitude-band-interaction"
const MILESTONE_ROUTE_COMPLETE: StringName = &"route-complete"
const BIRTHDAY_STAR_MOMENT_DIM := Color(0.55, 0.53, 0.64)
# How far from the Family Guest the Birthday Star can hang and still read as hers.
const BIRTHDAY_STAR_REACH := 160.0
const DEFAULT_PLAYFUL_BUMP_WOBBLE_SECONDS := 0.45
const DEFAULT_CROSSING_REST_SECONDS := 0.9
const DEFAULT_NEAR_MISS_REST_SECONDS := 0.9
const BIRTHDAY_CASTLE_APPROACH_SECONDS := 4.0
const REQUIRED_PLACE_FIELDS := [
	"id",
	"name",
	"familyGuest",
	"familyGuestIllustration",
	"illustration",
	"birthdayStar",
	"rainbowPath",
	"birthdayStarMoment",
]
# Every place travels the same authored rhythm: the route offers the child's height five
# chances to awaken something. Each chance answers whichever altitude rung Stella is on
# at that moment, so a place with two rungs answers high then low while Golden Bell
# Abbey's four bells ring whichever bell the child is beside. The rhythm is held as a
# fraction of the route rather than in seconds, so retuning how long a place takes speeds
# the whole passage up without resequencing it.
#
# The Bump Floor and the Near Miss are deliberately absent here. Both answer where Stella
# actually is rather than where the route has got to, so sampling them at authored points
# would announce a bump she did not have and stay silent for one she did.
const ROUTE_MILESTONES := [
	{"id": MILESTONE_ALTITUDE_BAND, "progress": 0.167},
	{"id": MILESTONE_ALTITUDE_BAND, "progress": 0.333},
	{"id": MILESTONE_ALTITUDE_BAND, "progress": 0.472},
	{"id": MILESTONE_ALTITUDE_BAND, "progress": 0.611},
	{"id": MILESTONE_ALTITUDE_BAND, "progress": 0.75},
	{"id": MILESTONE_ROUTE_COMPLETE},
]

const STATE_IDS := {
	PresentationState.UNPREPARED: "unprepared",
	PresentationState.PACK_ERROR: "pack_error",
	PresentationState.COVER: "cover",
	PresentationState.OPENING_STORYBOOK_MOMENT: "opening_storybook_moment",
	PresentationState.ACTIVE_PLAY: "active_play",
	PresentationState.BIRTHDAY_STAR_MOMENT: "birthday_star_moment",
	PresentationState.CELEBRATION: "celebration",
	PresentationState.GROWN_UP_CORNER: "grown_up_corner",
}
var _adapter: RefCounted = EDITION_PACK_ADAPTER.new()
var _content: Dictionary = {}
var _pack_source := ""
var _pack_revision := ""
var _state: PresentationState = PresentationState.UNPREPARED
var _launch_error := ""
var _grown_up_corner_visible := false
var _sound_enabled := true
var _opening_moments: Array = []
var _opening_textures: Dictionary = {}
var _opening_media_paths: Dictionary = {}
var _flight_background_texture: Texture2D
var _flight_character_texture: Texture2D
var _flight_character_has_transparency := false
var _flight_media_paths: Dictionary = {}
var _place_textures: Dictionary = {}
var _place_media_paths: Dictionary = {}
var _family_guest_textures: Dictionary = {}
var _birthday_star_texture: Texture2D
var _rainbow_path_texture: Texture2D
var _rainbow_path_media_path := ""
var _celebration_texture: Texture2D
var _celebration_media_path := ""
var _journey_media_paths: Dictionary = {}
var _realized_place_count := 0
var _opening_moment_index := 0
var _movement_state := ""
var _flight_tuning: Dictionary = {}
var _single_route_tuning: Dictionary = {}
var _flight_distance_stage_widths := 0.0
var _flight_altitude_stage_heights := 0.0
var _flight_vertical_speed_stage_heights_per_second := 0.0
var _authored_motion_seconds := 0.0
var _sound_events: Array[Dictionary] = []
var _active_action_sources: Dictionary = {}
var _observed_action_sources: Dictionary = {}
var _observed_opening_moments: Array[String] = []
var _observed_opening_checkpoints: Array[Dictionary] = []
var _journey_phase := ""
var _journey_phase_elapsed := 0.0
var _journey_checkpoint := 0
var _action_held := false
var _flight_control_cycle_count := 0
var _place_index := -1
var _place_progress := 0.0
var _place_rung := ""
var _last_crossing_seconds := -INF
var _journey_clock_seconds := 0.0
var _playful_bump_count := 0
var _playful_bump_wobble_seconds := 0.0
var _touching_bump_floor := false
var _near_miss_count := 0
var _within_near_miss_band := false
var _near_miss_spent := false
var _last_near_miss_seconds := -INF
var _birthday_stars: Array[String] = []
var _rainbow_paths: Array[String] = []
var _observed_interactions: Array[String] = []
var _soundscape: RefCounted
var _engine_audio: Node
var _rendering := false

@onready var _stage: Control = %Stage
@onready var _cover_presentation: Control = %CoverPresentation
@onready var _opening_presentation: Control = %OpeningPresentation
@onready var _active_play_presentation: Control = %ActivePlayPresentation
@onready var _grown_up_corner_overlay: Control = %GrownUpCornerOverlay
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
@onready var _opening_story_card: Control = $Stage/OpeningPresentation/StoryCard
@onready var _continue_button: Button = %ContinueButton
@onready var _flight_background: TextureRect = %FlightBackground
@onready var _place_background: TextureRect = %PlaceBackground
@onready var _place_visuals: PlaceVisuals = %PlaceVisuals
@onready var _birthday_star_sprite: TextureRect = %BirthdayStarSprite
@onready var _family_guest: TextureRect = %FamilyGuest
@onready var _rainbow_path_treatment: TextureRect = %RainbowPathTreatment
@onready var _moment_family_guest: TextureRect = %MomentFamilyGuest
@onready var _moment_rainbow_path: TextureRect = %MomentRainbowPath
@onready var _celebration_art: TextureRect = %CelebrationArt
@onready var _castle_approach_backdrop: TextureRect = %CastleApproachBackdrop
@onready var _birthday_castle_approach: BirthdayCastleApproach = %BirthdayCastleApproach
@onready var _flight_character: TextureRect = %FlightCharacter
@onready var _flight_card: Control = $Stage/ActivePlayPresentation/FlightCard
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
	_sound_button.pressed.connect(_on_sound_pressed)
	_continue_button.button_down.connect(_on_continue_button_down)
	_continue_button.button_up.connect(_on_continue_button_up)
	%ReplayButton.pressed.connect(_on_replay_pressed)

	var launched := prepare_launch()
	if launched.ok:
		_engine_audio = GODOT_AUDIO_ADAPTER.new()
		add_child(_engine_audio)
		_soundscape = SOUNDSCAPE_PLAYER.new(_pack_source, _engine_audio)
	_layout_storybook_stage()
	_render_presentation()
	_export_smoke_probe.call_deferred("run_if_requested", self)


func prepare_launch(pack_source: String = default_pack_source()) -> Dictionary:
	_pack_source = pack_source
	_state = PresentationState.UNPREPARED
	_launch_error = ""
	_pack_revision = ""
	_content = {}
	_opening_moments = []
	_opening_textures = {}
	_opening_media_paths = {}
	_flight_background_texture = null
	_flight_character_texture = null
	_flight_character_has_transparency = false
	_flight_media_paths = {}
	_place_textures = {}
	_place_media_paths = {}
	_family_guest_textures = {}
	_birthday_star_texture = null
	_rainbow_path_texture = null
	_rainbow_path_media_path = ""
	_celebration_texture = null
	_celebration_media_path = ""
	_journey_media_paths = {}
	_realized_place_count = 0
	_opening_moment_index = 0
	_movement_state = ""
	_flight_tuning = {}
	_single_route_tuning = {}
	_flight_distance_stage_widths = 0.0
	_flight_altitude_stage_heights = 0.0
	_flight_vertical_speed_stage_heights_per_second = 0.0
	_authored_motion_seconds = 0.0
	_sound_events = []
	_active_action_sources = {}
	_observed_action_sources = {}
	_observed_opening_moments = []
	_observed_opening_checkpoints = []
	_observed_interactions = []
	_reset_current_journey()
	_sound_enabled = true
	_grown_up_corner_visible = false

	var engine_version := _engine_version()
	if engine_version != EXPECTED_ENGINE_VERSION:
		return _fail_launch(
			"Godot %s is required; this application is running on %s" % [EXPECTED_ENGINE_VERSION, engine_version],
		)
	if not ResourceLoader.exists(COVER_ASSET):
		return _fail_launch("Approved Princess Rosie cover is missing: %s" % COVER_ASSET)

	var prepared: Dictionary = _adapter.prepare(pack_source)
	if not prepared.ok:
		return _fail_launch(prepared.error)
	var content_result: Dictionary = _adapter.load_content(pack_source, prepared)
	if not content_result.ok:
		return _fail_launch(content_result.error)

	_content = content_result.value
	var tuning_result: Dictionary = _adapter.load_tuning_intent(pack_source, prepared)
	if not tuning_result.ok:
		return _fail_launch(tuning_result.error)
	var flight_tuning_value: Variant = tuning_result.value.get("flight")
	if not flight_tuning_value is Dictionary:
		return _fail_launch("Edition Pack flight tuning is missing")
	_flight_tuning = flight_tuning_value
	var single_route_tuning_value: Variant = tuning_result.value.get("singleRoute")
	if not single_route_tuning_value is Dictionary:
		return _fail_launch("Edition Pack Single Route tuning is missing")
	_single_route_tuning = single_route_tuning_value
	_opening_moments = _content.get("openingMoments", [])
	if _opening_moments.is_empty():
		return _fail_launch("Edition Pack has no Opening Storybook Moments")
	var places_valid := _validate_places()
	if not places_valid.ok:
		return _fail_launch(places_valid.error)
	var media_loaded := _load_journey_media(pack_source, prepared)
	if not media_loaded.ok:
		return _fail_launch(media_loaded.error)
	_pack_revision = prepared.revision
	_state = PresentationState.COVER
	return {"ok": true}


func presentation_evidence() -> Dictionary:
	return {
		"state": STATE_IDS[_state],
		"window_mode": "fullscreen",
		"cover_asset": COVER_ASSET,
		"entry_points": [str(INTENT_BEGIN), str(INTENT_GROWN_UP_CORNER)],
		"grown_up_corner_controls": GROWN_UP_CORNER_CONTROLS.duplicate(),
		"pack_revision": _pack_revision,
		"error": _launch_error,
		"grown_up_corner_visible": _grown_up_corner_visible,
		"sound_enabled": _sound_enabled,
		"opening_moment": _current_opening_moment().get("id", ""),
		"observed_opening_moments": _observed_opening_moments.duplicate(),
		"observed_opening_checkpoints": _observed_opening_checkpoints.duplicate(true),
		"opening_media_paths": _opening_media_paths.duplicate(true),
		"flight_media_paths": _flight_media_paths.duplicate(true),
		"place_media_paths": _place_media_paths.duplicate(true),
		"journey_media_paths": _journey_media_paths.duplicate(true),
		"celebration_actions": _celebration_actions(),
		"celebration_hosts": _celebration_string_list("hosts"),
		"celebration_family_guests": _celebration_string_list("familyGuests"),
		"flight_instruction": _flight_presentation_copy().get("instruction", ""),
		"movement_state": _movement_state,
		"active_action_sources": _active_action_source_ids(),
		"observed_action_sources": _observed_action_source_ids(),
		"flight": flight_evidence(),
		"flight_control_cycles": _flight_control_cycle_count,
		"journey_phase": _journey_phase,
		"playful_bumps": _playful_bump_count,
		"playful_bump_wobbling": _playful_bump_wobble_seconds > 0.0,
		"near_misses": _near_miss_count,
		"birthday_stars": _birthday_stars.duplicate(),
		"rainbow_paths": _rainbow_paths.duplicate(),
		"observed_interactions": _observed_interactions.duplicate(),
		"places": _place_ids(),
		"realized_places": _realized_place_count,
		"place": str(_current_place().get("id", "")),
		"place_name": str(_current_place().get("name", "")),
		"family_guest": str(_current_place().get("familyGuest", "")),
		"place_progress": _place_progress,
		"playful_bumps_suppressed": PLACE_CONTENT.playful_bump_suppressed(_current_place()),
		"birthday_star_moment": _birthday_star_moment_copy(),
		"route_duration_seconds": _single_route_tuning.get("durationSeconds", 0.0),
		"safe_limits_preserve_forward_motion": _single_route_tuning.get(
			"safeLimitsPreserveForwardMotion",
			false,
		),
		"journey_progress_persisted": false,
		"engine_version": _engine_version(),
	}


func sound_event_evidence() -> Array[Dictionary]:
	return _sound_events.duplicate(true)


func flight_evidence() -> Dictionary:
	return {
		"automatic_forward_motion": _flight_tuning.get("automaticForwardMotion", false),
		"character_layer_has_transparency": _flight_character_has_transparency,
		"distance_stage_widths": _flight_distance_stage_widths,
		"altitude_stage_heights": _flight_altitude_stage_heights,
		"vertical_speed_stage_heights_per_second": (
			_flight_vertical_speed_stage_heights_per_second
		),
		"minimum_altitude_stage_heights": _flight_tuning.get("minimumAltitudeStageHeights", 0.0),
		"maximum_altitude_stage_heights": _flight_tuning.get("maximumAltitudeStageHeights", 1.0),
		"bump_floor_top_stage_heights": PLACE_CONTENT.bump_floor_top(_flight_tuning),
		"playful_bump_contact_altitude_stage_heights": PLACE_CONTENT.playful_bump_contact_altitude(
			_flight_tuning,
		),
		"near_miss_ceiling_stage_heights": PLACE_CONTENT.near_miss_ceiling(_flight_tuning),
		"touching_bump_floor": _touching_bump_floor,
	}


# The Near Miss is the journey's one answer earned by flying well, so the evidence says
# what the child did rather than what the shell is holding.
func near_miss_evidence() -> Dictionary:
	return {
		"near_misses": _near_miss_count,
		"within_band": _within_near_miss_band,
		"spent_by_contact": _near_miss_spent,
		"ceiling_stage_heights": PLACE_CONTENT.near_miss_ceiling(_flight_tuning),
		"rest_seconds": _near_miss_rest_seconds(),
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
	if _state in [PresentationState.ACTIVE_PLAY, PresentationState.CELEBRATION]:
		essential_controls.append(_flight_character)
		essential_controls.append(_flight_card)
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
		"opening_motion": {
			"art_scale": _opening_art.scale.x,
			"story_card_y": _opening_story_card.position.y,
		},
		"flight_motion": {
			"background_offset_x": (
				_place_background.position.x
				if _place_background.is_visible_in_tree()
				else _flight_background.position.x
			),
			"background_scale": (
				_place_background.scale.x
				if _place_background.is_visible_in_tree()
				else _flight_background.scale.x
			),
			"character_position": {
				"x": _flight_character.position.x,
				"y": _flight_character.position.y,
			},
			"character_rotation": _flight_character.rotation,
		},
		"flight_background_visible": (
			_flight_background.texture != null and _flight_background.is_visible_in_tree()
		),
		"place_background_visible": (
			_place_background.texture != null and _place_background.is_visible_in_tree()
		),
		"place_composition": _place_visuals.visual_evidence(),
		"celebration_illustration": _celebration_media_path,
		"celebration_illustration_visible": _layer_visible(_celebration_art),
		"birthday_castle_approach": _birthday_castle_approach.visual_evidence(),
		"flight_character_center": _flight_character.position + _flight_character.pivot_offset,
		"flight_character_scale": _flight_character.scale,
		"birthday_star_approach": _birthday_star_approach_evidence(),
		"birthday_star_moment_composition": _birthday_star_moment_composition_evidence(),
		"flight_character_visible": (
			_flight_character.texture != null and _flight_character.is_visible_in_tree()
		),
		"opening_text_minimum_font_size": mini(
			_opening_title.get_theme_font_size("font_size"),
			_opening_copy.get_theme_font_size("font_size"),
		),
	}


# The Grown-up Corner is a cover-only overlay, so the presentation underneath it remains
# the cover without introducing a second window or a resumable pause state.
func _presented_state() -> PresentationState:
	return PresentationState.COVER if _state == PresentationState.GROWN_UP_CORNER else _state


# The Family Guest waits beside her Birthday Star for as long as it takes to gather it;
# gathering trades the Star for the Rainbow Path that carries her to the celebration.
func _render_birthday_star_presentation() -> void:
	var place: Dictionary = _current_place()
	var approaching := (
		_presented_state() == PresentationState.ACTIVE_PLAY
		and _journey_phase == PHASE_STAR_APPROACH
	)
	var guest_texture: Variant = _family_guest_textures.get(place.get("id", ""))
	_family_guest.texture = guest_texture if guest_texture is Texture2D else null
	_moment_family_guest.texture = _family_guest.texture
	_birthday_star_sprite.texture = _birthday_star_texture
	_rainbow_path_treatment.texture = _rainbow_path_texture
	_moment_rainbow_path.texture = _rainbow_path_texture
	_family_guest.visible = approaching
	_birthday_star_sprite.visible = approaching and not _birthday_star_gathered()
	_rainbow_path_treatment.visible = approaching and _rainbow_path_open()
	var in_moment := _presented_state() == PresentationState.BIRTHDAY_STAR_MOMENT
	_moment_family_guest.visible = in_moment
	_moment_rainbow_path.visible = in_moment


# The only thing the ending offers. It begins the whole journey again rather than
# resuming it, so every Birthday Star is out there to be found once more.
func _fly_again() -> bool:
	if not _celebration_actions().has(ACTION_FLY_AGAIN):
		return false
	_report_sound_event(EVENT_CELEBRATION_INTERACTION, {"action": ACTION_FLY_AGAIN})
	_report_sound_event(EVENT_REPLAY, {"destination": "fresh-journey"})
	_reset_flight_motion()
	_reset_current_journey()
	_state = PresentationState.ACTIVE_PLAY
	_movement_state = "flight"
	_enter_place(0)
	_report_sound_event(EVENT_MOVEMENT_STATE, {"state": _movement_state})
	return true


func _celebration() -> Dictionary:
	var celebration: Variant = _content.get("celebration")
	return celebration if celebration is Dictionary else {}


func _celebration_actions() -> Array[String]:
	return _celebration_string_list("actions")


func _celebration_string_list(field: String) -> Array[String]:
	var values: Array[String] = []
	for value: Variant in _celebration().get(field, []):
		values.append(str(value))
	return values


func _birthday_star_gathered() -> bool:
	return _birthday_stars.has(PLACE_CONTENT.birthday_star(_current_place()))


func _rainbow_path_open() -> bool:
	return _rainbow_paths.has(PLACE_CONTENT.rainbow_path(_current_place()))


# Only while the child is approaching a Birthday Star is there an approach to describe.
func _birthday_star_approach_evidence() -> Dictionary:
	if _presented_state() != PresentationState.ACTIVE_PLAY or _journey_phase != PHASE_STAR_APPROACH:
		return {}
	return {
		"family_guest": str(_current_place().get("familyGuest", "")),
		"family_guest_visible": _layer_visible(_family_guest),
		"birthday_star_visible": _layer_visible(_birthday_star_sprite),
		"birthday_star_within_reach": _birthday_star_within_reach(),
		"rainbow_path_visible": _layer_visible(_rainbow_path_treatment),
	}


# The Star hangs where the guest could reach it, so gathering it reads as helping her
# rather than as collecting something from across the Storybook Stage.
func _birthday_star_within_reach() -> bool:
	var star := _birthday_star_sprite.get_rect().get_center()
	var guest := _family_guest.get_rect().get_center()
	return absf(star.x - guest.x) <= BIRTHDAY_STAR_REACH and star.y < guest.y


# Likewise, a composition exists only while the story is paused on the moment itself.
func _birthday_star_moment_composition_evidence() -> Dictionary:
	if _presented_state() != PresentationState.BIRTHDAY_STAR_MOMENT:
		return {}
	var place: Dictionary = _current_place()
	var held: Variant = _place_textures.get(place.get("id", ""))
	var holding_the_place: bool = held is Texture2D and _opening_art.texture == held
	return {
		"place_illustration": (
			str(_place_media_paths.get(place.get("illustration", ""), ""))
			if holding_the_place
			else ""
		),
		"place_illustration_dimmed": _opening_art.modulate.get_luminance() < 1.0,
		"family_guest": str(place.get("familyGuest", "")),
		"family_guest_cutout": str(
			_journey_media_paths.get(PLACE_CONTENT.family_guest_illustration(place), ""),
		),
		"family_guest_visible": _layer_visible(_moment_family_guest),
		"rainbow_path_treatment": _rainbow_path_media_path,
		"rainbow_path_visible": _layer_visible(_moment_rainbow_path),
		"sentence": _opening_copy.text,
	}


func _layer_visible(layer: TextureRect) -> bool:
	return layer.texture != null and layer.is_visible_in_tree()


func handle_player_intent(intent: StringName) -> bool:
	match intent:
		INTENT_BEGIN:
			if _state != PresentationState.COVER:
				return false
			_grown_up_corner_visible = false
			_show_opening_moment(0)
			return true
		INTENT_CONTINUE:
			if _state == PresentationState.BIRTHDAY_STAR_MOMENT:
				_action_held = false
				if _place_index + 1 < _realized_place_count:
					_state = PresentationState.ACTIVE_PLAY
					_movement_state = "flight"
					_enter_place(_place_index + 1)
					_report_sound_event(EVENT_MOVEMENT_STATE, {"state": _movement_state})
					return true
				_journey_phase = PHASE_BIRTHDAY_CASTLE_APPROACH
				_journey_phase_elapsed = 0.0
				_journey_checkpoint = 0
				_state = PresentationState.ACTIVE_PLAY
				_movement_state = "flight"
				_report_sound_event(EVENT_MOVEMENT_STATE, {"state": _movement_state})
				return true
			if _state != PresentationState.OPENING_STORYBOOK_MOMENT:
				return false
			if _opening_moment_index < _opening_moments.size() - 1:
				_show_opening_moment(_opening_moment_index + 1)
				return true
			_start_flight()
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
				return _fly_again()
			if _state != PresentationState.ACTIVE_PLAY:
				return false
			_action_held = true
			if _journey_phase not in [
				PHASE_FLIGHT,
				PHASE_PLACE_FLIGHT,
				PHASE_STAR_APPROACH,
				PHASE_BIRTHDAY_CASTLE_APPROACH,
			]:
				return true
			if _movement_state == "rise":
				return false
			_movement_state = "rise"
			_report_sound_event(EVENT_MOVEMENT_STATE, {"state": _movement_state})
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
			if _journey_phase not in [
				PHASE_FLIGHT,
				PHASE_PLACE_FLIGHT,
				PHASE_STAR_APPROACH,
				PHASE_BIRTHDAY_CASTLE_APPROACH,
			]:
				return true
			if _movement_state == "glide":
				return false
			if _movement_state == "rise":
				_flight_control_cycle_count += 1
			_movement_state = "glide"
			_report_sound_event(EVENT_MOVEMENT_STATE, {"state": _movement_state})
			return true
		INTENT_GROWN_UP_CORNER:
			if _state != PresentationState.COVER:
				return false
			_state = PresentationState.GROWN_UP_CORNER
			_grown_up_corner_visible = true
			return true
		INTENT_ESCAPE:
			exit_requested.emit()
			return true
		INTENT_TOGGLE_SOUND:
			if _state != PresentationState.GROWN_UP_CORNER:
				return false
			_sound_enabled = not _sound_enabled
			_report_sound_event(
				EVENT_SOUND_PREFERENCE_CHANGED,
				{"enabled": _sound_enabled},
			)
			return true
		INTENT_REPLAY:
			if _state != PresentationState.GROWN_UP_CORNER:
				return false
			_report_sound_event(EVENT_REPLAY, {"destination": "opening-storybook"})
			_state = PresentationState.COVER
			_opening_moment_index = 0
			_movement_state = ""
			_reset_flight_motion()
			_reset_current_journey()
			_grown_up_corner_visible = false
			return true
		_:
			return false

func handle_player_action(source: StringName, pressed: bool) -> bool:
	var answered := _answer_player_action(source, pressed)
	if answered:
		_render_presentation()
	return answered


func _answer_player_action(source: StringName, pressed: bool) -> bool:
	if source not in [SOURCE_KEYBOARD_SPACE, SOURCE_POINTER_PRIMARY]:
		return false
	if pressed:
		if _active_action_sources.has(source):
			return false
		var action_was_held := not _active_action_sources.is_empty()
		_active_action_sources[source] = true
		_observed_action_sources[source] = true
		if action_was_held:
			return false
		if _state == PresentationState.OPENING_STORYBOOK_MOMENT:
			var continued := handle_player_intent(INTENT_CONTINUE)
			if continued and _state == PresentationState.ACTIVE_PLAY:
				handle_player_intent(INTENT_ACTION_PRESSED)
			return continued
		if _state == PresentationState.BIRTHDAY_STAR_MOMENT:
			# Turning the page into the next place carries the press straight into Flight
			# Control, exactly as the last Opening Storybook Moment does.
			var turned := handle_player_intent(INTENT_CONTINUE)
			if turned and _state == PresentationState.ACTIVE_PLAY:
				handle_player_intent(INTENT_ACTION_PRESSED)
			return turned
		if _state == PresentationState.CELEBRATION:
			var flew_again := handle_player_intent(INTENT_ACTION_PRESSED)
			if flew_again and _state == PresentationState.ACTIVE_PLAY:
				handle_player_intent(INTENT_ACTION_PRESSED)
			return flew_again
		if _state == PresentationState.ACTIVE_PLAY:
			return handle_player_intent(INTENT_ACTION_PRESSED)
		return false

	if not _active_action_sources.has(source):
		return false
	_active_action_sources.erase(source)
	if not _active_action_sources.is_empty():
		return false
	if _state in [PresentationState.ACTIVE_PLAY, PresentationState.CELEBRATION]:
		return handle_player_intent(INTENT_ACTION_RELEASED)
	return true


func advance_simulation(delta: float) -> bool:
	if _state != PresentationState.ACTIVE_PLAY or not is_finite(delta) or delta <= 0.0:
		return false
	if _flight_tuning.get("automaticForwardMotion", false):
		_flight_distance_stage_widths += _forward_speed() * delta
	var acceleration := _acceleration(_movement_state)
	var previous_speed := _flight_vertical_speed_stage_heights_per_second
	var next_speed := clampf(
		previous_speed + acceleration * delta,
		float(_flight_tuning.get("maximumGlideSpeedStageHeightsPerSecond", -0.48)),
		float(_flight_tuning.get("maximumRiseSpeedStageHeightsPerSecond", 0.6)),
	)
	_flight_altitude_stage_heights += (previous_speed + next_speed) * 0.5 * delta
	_flight_vertical_speed_stage_heights_per_second = next_speed
	var minimum_altitude := float(_flight_tuning.get("minimumAltitudeStageHeights", 0.0))
	var maximum_altitude := float(_flight_tuning.get("maximumAltitudeStageHeights", 1.0))
	if _flight_altitude_stage_heights <= minimum_altitude:
		_flight_altitude_stage_heights = minimum_altitude
		_flight_vertical_speed_stage_heights_per_second = maxf(
			0.0,
			_flight_vertical_speed_stage_heights_per_second,
		)
	elif _flight_altitude_stage_heights >= maximum_altitude:
		_flight_altitude_stage_heights = maximum_altitude
		_flight_vertical_speed_stage_heights_per_second = minf(
			0.0,
			_flight_vertical_speed_stage_heights_per_second,
		)
	return true


func advance_journey(delta: float) -> void:
	if _state != PresentationState.ACTIVE_PLAY or delta <= 0.0:
		return
	_journey_phase_elapsed += delta
	_journey_clock_seconds += delta
	_playful_bump_wobble_seconds = maxf(0.0, _playful_bump_wobble_seconds - delta)
	match _journey_phase:
		PHASE_FLIGHT:
			if _journey_phase_elapsed >= 0.75:
				_enter_place(0)
		PHASE_PLACE_FLIGHT:
			_place_progress = clampf(
				_place_progress + delta / _route_duration_seconds(),
				0.0,
				1.0,
			)
			_advance_place_flight()
		PHASE_STAR_APPROACH:
			_advance_birthday_star_sequence()
		PHASE_BIRTHDAY_CASTLE_APPROACH:
			if _journey_phase_elapsed >= BIRTHDAY_CASTLE_APPROACH_SECONDS:
				_arrive_at_birthday_castle()
	_render_presentation()


func _enter_place(index: int) -> void:
	_place_index = clampi(index, 0, maxi(0, _realized_place_count - 1))
	_journey_phase = PHASE_PLACE_FLIGHT
	_journey_phase_elapsed = 0.0
	_journey_checkpoint = 0
	_place_progress = 0.0
	_place_rung = ""
	_last_crossing_seconds = -INF
	_observed_interactions = []
	_playful_bump_wobble_seconds = 0.0
	_touching_bump_floor = false
	_within_near_miss_band = false
	_near_miss_spent = false
	_last_near_miss_seconds = -INF
	_report_sound_event(EVENT_PLACE_ENTRY, {"place": _current_place().get("id", "")})


func _advance_place_flight() -> void:
	_answer_altitude_crossing()
	_answer_bump_floor()
	_answer_near_miss()
	while (
		_journey_phase == PHASE_PLACE_FLIGHT
		and _journey_checkpoint < ROUTE_MILESTONES.size()
	):
		var milestone: Dictionary = ROUTE_MILESTONES[_journey_checkpoint]
		var milestone_id: StringName = milestone.get("id", &"")
		var milestone_progress := float(milestone.get("progress", 1.0))
		if _place_progress < milestone_progress:
			return
		match milestone_id:
			MILESTONE_ALTITUDE_BAND:
				_report_place_interaction(
					PLACE_CONTENT.interaction_for_altitude(
						_current_place(),
						_single_route_tuning,
						_flight_altitude_stage_heights,
					),
				)
			MILESTONE_ROUTE_COMPLETE:
				_journey_phase = PHASE_STAR_APPROACH
				_journey_phase_elapsed = 0.0
				_journey_checkpoint = 0
				return
		_journey_checkpoint += 1


# A place that answers every crossing follows the child's hand: each time Flight Control
# carries Stella from one rung to another, that rung speaks. The rest between answers
# keeps a hovering child from chattering at a seam and holds the mix to two voices.
func _answer_altitude_crossing() -> void:
	var place := _current_place()
	if not PLACE_CONTENT.awakens_on_every_crossing(place):
		return
	var interaction := PLACE_CONTENT.interaction_for_altitude(
		place,
		_single_route_tuning,
		_flight_altitude_stage_heights,
	)
	var rung: String = interaction.get("id", "")
	if rung == _place_rung:
		return
	_place_rung = rung
	if rung.is_empty():
		return
	if _journey_clock_seconds - _last_crossing_seconds < _crossing_rest_seconds():
		return
	_last_crossing_seconds = _journey_clock_seconds
	_awaken(interaction)


func _crossing_rest_seconds() -> float:
	return float(
		_single_route_tuning.get("crossingRestSeconds", DEFAULT_CROSSING_REST_SECONDS),
	)


# The rung Stella is on when the route offers her a chance answers with its own delight,
# once. A height between two rungs awakens nothing rather than the nearest thing, so the
# quiet middle of Lacewood stays quiet while every height at the Abbey has a bell.
func _report_place_interaction(interaction: Dictionary) -> void:
	var interaction_id: String = interaction.get("id", "")
	if interaction_id.is_empty() or _observed_interactions.has(interaction_id):
		return
	_awaken(interaction)


func _awaken(interaction: Dictionary) -> void:
	var interaction_id: String = interaction.get("id", "")
	if not _observed_interactions.has(interaction_id):
		_observed_interactions.append(interaction_id)
	_report_sound_event(
		EVENT_VIGNETTE_INTERACTION,
		{"place": _current_place().get("id", ""), "interaction": interaction_id},
	)


# Stella meets the Bump Floor where it actually is, so a bump is reported on the frame
# she touches it and not again until she has climbed clear. A child who settles onto the
# floor and stays there gets one wobble, not a wobble every frame; a child who dives
# three times gets three. Nothing accumulates: ADR-0013 leaves a Playful Bump a lone
# wobble with nothing following from meeting several.
func _answer_bump_floor() -> void:
	var contact := _flight_altitude_stage_heights <= PLACE_CONTENT.playful_bump_contact_altitude(
		_flight_tuning,
	)
	var floor_bumps := not PLACE_CONTENT.playful_bump_suppressed(_current_place())
	if contact and floor_bumps and not _touching_bump_floor:
		_report_playful_bump()
	# A place whose floor does not bump still has a floor, and touching it still spends
	# the Near Miss. The Rose Garden rewards flying well, it does not excuse it.
	if contact:
		_near_miss_spent = true
	_touching_bump_floor = contact


# The Near Miss answers the upward crossing out of the band, never the entry into it: on
# the way down the miss has not happened yet and Stella may still meet the floor. It
# rests between answers for the reason the Abbey's bells do, so a child hovering on the
# seam hears one answer rather than a rattle.
func _answer_near_miss() -> void:
	var within := _flight_altitude_stage_heights <= PLACE_CONTENT.near_miss_ceiling(
		_flight_tuning,
	)
	if within and not _within_near_miss_band:
		_near_miss_spent = false
	elif _within_near_miss_band and not within and not _near_miss_spent:
		_report_near_miss()
	_within_near_miss_band = within


func _report_near_miss() -> void:
	if _journey_clock_seconds - _last_near_miss_seconds < _near_miss_rest_seconds():
		return
	_last_near_miss_seconds = _journey_clock_seconds
	_near_miss_count += 1
	_report_sound_event(
		EVENT_NEAR_MISS,
		{
			"place": _current_place().get("id", ""),
			"kind": PLACE_CONTENT.playful_bump_kind(_current_place()),
		},
	)


func _near_miss_rest_seconds() -> float:
	return float(
		_single_route_tuning.get("nearMissRestSeconds", DEFAULT_NEAR_MISS_REST_SECONDS),
	)


func _report_playful_bump() -> void:
	_playful_bump_count += 1
	_playful_bump_wobble_seconds = _playful_bump_wobble_duration()
	_report_sound_event(
		EVENT_PLAYFUL_BUMP,
		{
			"place": _current_place().get("id", ""),
			"kind": PLACE_CONTENT.playful_bump_kind(_current_place()),
		},
	)


func _playful_bump_wobble_duration() -> float:
	return float(
		_flight_tuning.get(
			"playfulBumpWobbleSeconds",
			DEFAULT_PLAYFUL_BUMP_WOBBLE_SECONDS,
		),
	)


func _route_duration_seconds() -> float:
	return float(_single_route_tuning.get("durationSeconds", 18.0))


func _forward_speed() -> float:
	return float(_flight_tuning.get("forwardSpeedStageWidthsPerSecond", 0.0))


func _acceleration(movement_state: String) -> float:
	var acceleration_key := (
		"riseAccelerationStageHeightsPerSecondSquared"
		if movement_state == "rise"
		else "glideAccelerationStageHeightsPerSecondSquared"
	)
	return float(_flight_tuning.get(acceleration_key, 0.0))


func _advance_birthday_star_sequence() -> void:
	var thresholds := [0.45, 1.0, 2.4, 4.9]
	var place: Dictionary = _current_place()
	var birthday_star := PLACE_CONTENT.birthday_star(place)
	var rainbow_path := PLACE_CONTENT.rainbow_path(place)
	var family_guest: String = place.get("familyGuest", "")
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
					{"place": place.get("id", ""), "familyGuest": family_guest},
				)
				_journey_phase = PHASE_BIRTHDAY_STAR_MOMENT
				_state = PresentationState.BIRTHDAY_STAR_MOMENT
		_journey_checkpoint += 1


func _reset_current_journey() -> void:
	_journey_phase = ""
	_journey_phase_elapsed = 0.0
	_journey_checkpoint = 0
	_action_held = false
	_flight_control_cycle_count = 0
	_place_index = -1
	_place_progress = 0.0
	_journey_clock_seconds = 0.0
	_playful_bump_count = 0
	_playful_bump_wobble_seconds = 0.0
	_touching_bump_floor = false
	_near_miss_count = 0
	_within_near_miss_band = false
	_near_miss_spent = false
	_last_near_miss_seconds = -INF
	_birthday_stars = []
	_rainbow_paths = []
	_observed_interactions = []


func _arrive_at_birthday_castle() -> void:
	_journey_phase = PHASE_CELEBRATION
	_journey_phase_elapsed = 0.0
	_state = PresentationState.CELEBRATION
	_movement_state = ""
	_report_sound_event(EVENT_BIRTHDAY_CASTLE_ARRIVAL, {})


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


func _physics_process(delta: float) -> void:
	advance_simulation(delta)


func _process(delta: float) -> void:
	if not is_node_ready() or not is_finite(delta) or delta <= 0.0:
		return
	advance_journey(delta)
	_authored_motion_seconds += delta
	var page_breath := sin(_authored_motion_seconds * 0.55)
	_opening_art.scale = Vector2.ONE * (1.035 + page_breath * 0.006)
	_opening_story_card.position.y = 420.0 + sin(_authored_motion_seconds * 0.72) * 4.0
	var forward_parallax := 1.0 - exp(-_flight_distance_stage_widths * 0.85)
	_flight_background.scale = Vector2.ONE * (1.035 + forward_parallax * 0.025)
	_flight_background.position.x = (
		sin(_authored_motion_seconds * 0.28) * -5.0
		- forward_parallax * 18.0
	)
	_place_background.scale = Vector2.ONE * (1.025 + sin(_authored_motion_seconds * 0.32) * 0.003)
	_place_background.position.x = sin(_authored_motion_seconds * 0.24) * -4.0
	var character_breath := sin(_authored_motion_seconds * 2.1)
	_flight_character.position = Vector2(
		615.0 + sin(_authored_motion_seconds * 0.8) * 5.0,
		lerpf(350.0, -10.0, _flight_altitude_stage_heights) + character_breath * 4.0,
	)
	_flight_character.rotation = clampf(
		-_flight_vertical_speed_stage_heights_per_second * 0.12,
		-0.07,
		0.07,
	)
	_flight_character.scale = Vector2.ONE * (1.0 + character_breath * 0.006)
	_apply_place_traversal_presentation()
	_apply_birthday_castle_approach_presentation()


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("exit_game") and handle_player_intent(INTENT_ESCAPE):
		get_viewport().set_input_as_handled()
		get_tree().quit()
		return
	if handle_player_input_event(event):
		get_viewport().set_input_as_handled()


func handle_player_input_event(event: InputEvent) -> bool:
	var source := _player_action_source(event)
	if source.is_empty():
		return false
	if event is InputEventScreenTouch:
		return handle_player_action(source, event.pressed)
	var pressed := event.is_action_pressed("flight_action", false)
	var released := event.is_action_released("flight_action")
	return (pressed or released) and handle_player_action(source, pressed)


func _layout_storybook_stage() -> void:
	if not is_node_ready():
		return
	var stage_rect := storybook_stage_rect(size)
	_stage.position = stage_rect.position
	_stage.size = stage_rect.size


func _render_presentation() -> void:
	if not is_node_ready() or _rendering:
		return
	_rendering = true
	var content_title := str(_content.get("title", "Princess Rosie and the Seven Birthday Stars"))
	var opening: Dictionary = _current_opening_moment()
	_title_label.text = content_title
	if _state == PresentationState.BIRTHDAY_STAR_MOMENT:
		_opening_eyebrow.text = "A Birthday Star!"
		_opening_title.text = "%s's Rainbow Path" % _current_place().get("familyGuest", "")
		_opening_copy.text = _birthday_star_moment_copy()
	else:
		_opening_eyebrow.text = str(opening.get("eyebrow", "A brave big sister"))
		_opening_title.text = str(opening.get("title", "Rosie and Stella can help"))
		_opening_copy.text = str(opening.get("copy", ""))
	var illustration_id: String = opening.get("illustration", "")
	if _presented_state() == PresentationState.BIRTHDAY_STAR_MOMENT:
		var held: Variant = _place_textures.get(_current_place().get("id", ""))
		if held is Texture2D:
			_opening_art.texture = held
		_opening_art.modulate = BIRTHDAY_STAR_MOMENT_DIM
	else:
		if _opening_textures.has(illustration_id):
			_opening_art.texture = _opening_textures[illustration_id]
		_opening_art.modulate = Color.WHITE
	if _flight_background_texture != null:
		_flight_background.texture = _flight_background_texture
	var place: Dictionary = _current_place()
	var place_texture: Variant = _place_textures.get(place.get("id", ""))
	if place_texture is Texture2D:
		_place_background.texture = place_texture
	if _flight_character_texture != null:
		_flight_character.texture = _flight_character_texture
	var place_visible := _journey_phase in [
		PHASE_PLACE_FLIGHT,
		PHASE_STAR_APPROACH,
		PHASE_BIRTHDAY_STAR_MOMENT,
	]
	var celebration_visible := _journey_phase == PHASE_CELEBRATION
	if _celebration_texture != null:
		_celebration_art.texture = _celebration_texture
		_castle_approach_backdrop.texture = _celebration_texture
	_birthday_castle_approach.configure(
		_rainbow_path_texture,
		int(_celebration().get("returningRainbowPathCount", 0)),
	)
	var castle_approach_visible := _journey_phase == PHASE_BIRTHDAY_CASTLE_APPROACH
	_celebration_art.visible = celebration_visible
	_castle_approach_backdrop.visible = castle_approach_visible
	_birthday_castle_approach.visible = castle_approach_visible
	_flight_background.visible = (
		not place_visible and not castle_approach_visible and not celebration_visible
	)
	_place_background.visible = place_visible
	_place_visuals.visible = place_visible
	_flight_character.visible = not celebration_visible
	_place_visuals.configure_place(
		place,
		PLACE_CONTENT.altitude_ladder(place, _single_route_tuning),
	)
	_place_visuals.set_story_state({
		"phase": _journey_phase,
		"progress": _place_progress,
		"altitude": _flight_altitude_stage_heights,
		"observed_interactions": _observed_interactions,
		"playful_bump_wobble": _playful_bump_wobble_seconds > 0.0,
	})
	_render_birthday_star_presentation()
	_apply_place_traversal_presentation()
	_apply_birthday_castle_approach_presentation()
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
	_pack_badge.text = "EDITION PACK  •  %s" % _pack_revision.to_upper()
	_error_label.text = _launch_error
	_sound_button.text = "Sound: On" if _sound_enabled else "Sound: Off"

	_error_presentation.visible = _state == PresentationState.PACK_ERROR
	_grown_up_corner_overlay.visible = _state == PresentationState.GROWN_UP_CORNER
	_cover_presentation.visible = _state in [
		PresentationState.COVER,
		PresentationState.GROWN_UP_CORNER,
	]
	_opening_presentation.visible = _state in [
		PresentationState.OPENING_STORYBOOK_MOMENT,
		PresentationState.BIRTHDAY_STAR_MOMENT,
	]
	_active_play_presentation.visible = _state in [
		PresentationState.ACTIVE_PLAY,
		PresentationState.CELEBRATION,
	]
	_rendering = false


func _on_begin_pressed() -> void:
	if handle_player_intent(INTENT_BEGIN):
		_render_presentation()


func _on_grown_up_corner_pressed() -> void:
	if handle_player_intent(INTENT_GROWN_UP_CORNER):
		_render_presentation()


func _on_sound_pressed() -> void:
	if handle_player_intent(INTENT_TOGGLE_SOUND):
		_render_presentation()


func _on_continue_button_down() -> void:
	handle_player_action(SOURCE_POINTER_PRIMARY, true)


func _on_continue_button_up() -> void:
	handle_player_action(SOURCE_POINTER_PRIMARY, false)


func _on_replay_pressed() -> void:
	if handle_player_intent(INTENT_REPLAY):
		_render_presentation()


func _report_sound_event(event_id: StringName, parameters: Dictionary) -> void:
	_sound_events.append({"event": str(event_id), "context": parameters.duplicate(true)})
	if _soundscape != null:
		_soundscape.report_event(event_id, parameters)


func _show_opening_moment(index: int) -> void:
	_opening_moment_index = clampi(index, 0, _opening_moments.size() - 1)
	_state = PresentationState.OPENING_STORYBOOK_MOMENT
	var opening := _current_opening_moment()
	var opening_id: String = opening.get("id", "")
	_observed_opening_moments.append(opening_id)
	var semantic_checkpoint: Variant = opening.get("semanticCheckpoint")
	if semantic_checkpoint is Dictionary:
		_observed_opening_checkpoints.append({
			"moment": opening_id,
			"facts": semantic_checkpoint.duplicate(true),
		})
	_report_sound_event(EVENT_OPENING_MOMENT, {"moment": opening.get("id", "")})


func _start_flight() -> void:
	_state = PresentationState.ACTIVE_PLAY
	_movement_state = "flight"
	_reset_flight_motion()


func _reset_flight_motion() -> void:
	_flight_distance_stage_widths = 0.0
	_flight_altitude_stage_heights = float(
		_flight_tuning.get("startingAltitudeStageHeights", 0.5),
	)
	_flight_vertical_speed_stage_heights_per_second = 0.0


func _current_opening_moment() -> Dictionary:
	if _opening_moments.is_empty() or _opening_moment_index >= _opening_moments.size():
		return {}
	var opening: Variant = _opening_moments[_opening_moment_index]
	return opening if opening is Dictionary else {}

func _active_action_source_ids() -> Array[String]:
	return _sorted_source_ids(_active_action_sources)


func _observed_action_source_ids() -> Array[String]:
	return _sorted_source_ids(_observed_action_sources)


func _sorted_source_ids(source_set: Dictionary) -> Array[String]:
	var sources: Array[String] = []
	for source: Variant in source_set:
		sources.append(str(source))
	sources.sort()
	return sources


func _player_action_source(event: InputEvent) -> StringName:
	if event is InputEventScreenTouch:
		return SOURCE_POINTER_PRIMARY
	if not event.is_action("flight_action"):
		return &""
	if event is InputEventKey and event.physical_keycode == KEY_SPACE:
		return SOURCE_KEYBOARD_SPACE
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		return SOURCE_POINTER_PRIMARY
	return &""


func _birthday_star_moment_copy() -> String:
	return str(_current_place().get("birthdayStarMoment", ""))


func _places() -> Array:
	var places: Variant = _content.get("places")
	return places if places is Array else []


func _place_ids() -> Array[String]:
	var place_ids: Array[String] = []
	for place_value: Variant in _places():
		if place_value is Dictionary:
			place_ids.append(str(place_value.get("id", "")))
	return place_ids


func _place_at(index: int) -> Dictionary:
	var places := _places()
	if index < 0 or index >= places.size():
		return {}
	var place: Variant = places[index]
	return place if place is Dictionary else {}


func _current_place() -> Dictionary:
	return _place_at(_place_index)


# Every place is declared in the ordered journey; a place is realized once the
# Edition Pack carries its Place Illustration. The journey flies the realized
# prefix, so approving the next illustration extends it without code changes.
func _validate_places() -> Dictionary:
	var places := _places()
	if places.is_empty():
		return {"ok": false, "error": "Edition Pack declares no places"}
	for place_value: Variant in places:
		if not place_value is Dictionary:
			return {"ok": false, "error": "Place content is invalid"}
		var place: Dictionary = place_value
		for field: String in REQUIRED_PLACE_FIELDS:
			if str(place.get(field, "")).is_empty():
				return {
					"ok": false,
					"error": "Place %s is missing %s" % [place.get("id", "?"), field],
				}
		if not place.get("playfulBump") is Dictionary:
			return {"ok": false, "error": "Place %s has no Playful Bump" % place.get("id", "?")}
		for altitude_band: String in PLACE_CONTENT.ALTITUDE_BANDS:
			if PLACE_CONTENT.interaction(place, altitude_band).is_empty():
				return {
					"ok": false,
					"error": "Place %s has no %s interaction" % [place.get("id", "?"), altitude_band],
				}
		# A rung that names no reachable height would be a delight the child can never
		# awaken, so the journey refuses to launch rather than flying past it in silence.
		for interaction_value: Variant in place.get("interactions", []):
			if not interaction_value is Dictionary:
				return {
					"ok": false,
					"error": "Place %s has invalid interaction content" % place.get("id", "?"),
				}
			var interaction: Dictionary = interaction_value
			if PLACE_CONTENT.altitude_window(interaction, _single_route_tuning).is_empty():
				return {
					"ok": false,
					"error": "Place %s interaction %s answers no height" % [
						place.get("id", "?"),
						interaction.get("id", "?"),
					],
				}
		# A rung whose every reachable height is already touching the Bump Floor is a
		# delight the child cannot hold without bumping — the inferior height ADR-0012
		# forbids — so a floor that swallows one is named rather than flown.
		var stranded := PLACE_CONTENT.rungs_without_safe_height(
			place,
			_single_route_tuning,
			_flight_tuning,
		)
		if not stranded.is_empty():
			return {
				"ok": false,
				"error": "Place %s rungs %s have no height clear of the Bump Floor" % [
					place.get("id", "?"),
					", ".join(stranded),
				],
			}
	return {"ok": true}


func _apply_place_traversal_presentation() -> void:
	if not is_node_ready() or _journey_phase not in [
		PHASE_PLACE_FLIGHT,
		PHASE_STAR_APPROACH,
	]:
		return
	var wobble := _playful_bump_wobble()
	var character_center := Vector2(
		lerpf(300.0, 1040.0, _place_progress),
		lerpf(520.0, 190.0, _flight_altitude_stage_heights) + wobble * 9.0,
	)
	_flight_character.position = character_center - _flight_character.pivot_offset
	_flight_character.scale = Vector2.ONE * 0.65
	_flight_character.rotation = clampf(
		-_flight_vertical_speed_stage_heights_per_second * 0.16,
		-0.12,
		0.12,
	) + wobble * 0.11
	_place_background.scale = Vector2.ONE * 1.12
	_place_background.position.x = (
		-_place_progress * 180.0
		+ sin(_authored_motion_seconds * 0.24) * -4.0
	)


func _apply_birthday_castle_approach_presentation() -> void:
	if not is_node_ready() or _journey_phase != PHASE_BIRTHDAY_CASTLE_APPROACH:
		return
	var progress := clampf(
		_journey_phase_elapsed / BIRTHDAY_CASTLE_APPROACH_SECONDS,
		0.0,
		1.0,
	)
	var character_center := Vector2(
		lerpf(360.0, 790.0, progress),
		lerpf(520.0, 190.0, _flight_altitude_stage_heights),
	)
	_flight_character.position = character_center - _flight_character.pivot_offset
	_flight_character.scale = Vector2.ONE * 0.65
	_flight_character.rotation = clampf(
		-_flight_vertical_speed_stage_heights_per_second * 0.16,
		-0.12,
		0.12,
	)
	_castle_approach_backdrop.scale = Vector2.ONE * lerpf(1.08, 1.0, progress)
	_castle_approach_backdrop.position = -(_castle_approach_backdrop.size * (
		_castle_approach_backdrop.scale - Vector2.ONE
	)) * 0.5


# A Playful Bump reads as a soft rocking that fades out; nothing is lost or blocked.
func _playful_bump_wobble() -> float:
	if _playful_bump_wobble_seconds <= 0.0:
		return 0.0
	var wobble_seconds := maxf(0.01, _playful_bump_wobble_duration())
	return (
		sin(_playful_bump_wobble_seconds * TAU * 2.5)
		* (_playful_bump_wobble_seconds / wobble_seconds)
	)


func _flight_presentation_copy() -> Dictionary:
	match _journey_phase:
		PHASE_PLACE_FLIGHT:
			return {
				"title": "Flying through %s" % _current_place().get("name", "Fairytale Sicily"),
				"instruction": "Hold to rise • release to settle",
			}
		PHASE_STAR_APPROACH:
			return {
				"title": "A Birthday Star is near!",
				"instruction": "It will joyfully fly to Stella",
			}
		PHASE_BIRTHDAY_CASTLE_APPROACH:
			return {
				"title": "The Birthday Castle is near!",
				"instruction": "All seven Rainbow Paths are coming home",
			}
		PHASE_CELEBRATION:
			return {
				"title": "Birthday Castle Celebration!",
				"instruction": "Press to fly again • every Rainbow Path is open",
			}
		_:
			return {
				"title": "Stella is flying!",
				"instruction": "Hold to rise • release to settle",
			}


func _load_journey_media(pack_source: String, prepared_pack: Dictionary) -> Dictionary:
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
	var initial_flight: Variant = _content.get("initialFlight")
	if not initial_flight is Dictionary:
		return {"ok": false, "error": "Edition Pack initial flight content is invalid"}
	var background_id: String = initial_flight.get("background", "")
	var background_media: Dictionary = media_by_id.get(background_id, {})
	var background_path: String = background_media.get("path", "")
	if background_path.is_empty():
		return {"ok": false, "error": "Initial flight background media is missing: %s" % background_id}
	var background_result: Dictionary = _adapter.load_png_texture(pack_source, background_path)
	if not background_result.ok:
		return background_result
	_flight_background_texture = background_result.texture
	_flight_media_paths[background_id] = background_path
	var character_id: String = initial_flight.get("character", "")
	var character_result := _load_transparent_layer(
		pack_source,
		media_by_id,
		character_id,
		"Initial flight character",
	)
	if not character_result.ok:
		return character_result
	_flight_character_texture = character_result.texture
	_flight_character_has_transparency = character_result.has_transparency
	_flight_media_paths[character_id] = character_result.path
	var celebration_loaded := _load_celebration_media(pack_source, media_by_id)
	if not celebration_loaded.ok:
		return celebration_loaded
	var places_loaded := _load_place_media(pack_source, media_by_id)
	if not places_loaded.ok:
		return places_loaded
	return _load_shared_journey_media(pack_source, media_by_id)


# One authored ending, reached identically on every journey, painted once.
func _load_celebration_media(pack_source: String, media_by_id: Dictionary) -> Dictionary:
	var celebration := _celebration()
	if celebration.is_empty():
		return {"ok": false, "error": "Edition Pack declares no celebration"}
	var illustration_id := str(celebration.get("illustration", ""))
	var media: Dictionary = media_by_id.get(illustration_id, {})
	var path: String = media.get("path", "")
	if media.get("role") != "illustration" or path.is_empty():
		return {"ok": false, "error": "Celebration illustration is missing: %s" % illustration_id}
	var result: Dictionary = _adapter.load_png_texture(pack_source, path)
	if not result.ok:
		return result
	_celebration_texture = result.texture
	_celebration_media_path = path
	return {"ok": true}


# The Birthday Star and the Rainbow Path are the same magical objects in every place,
# so the Edition Pack names them once and the shell loads them once.
func _load_shared_journey_media(pack_source: String, media_by_id: Dictionary) -> Dictionary:
	var shared: Variant = _content.get("sharedJourneyMedia")
	if not shared is Dictionary:
		return {"ok": false, "error": "Edition Pack declares no shared journey media"}
	var birthday_star_id := str(shared.get("birthdayStar", ""))
	var star_result := _load_transparent_layer(
		pack_source,
		media_by_id,
		birthday_star_id,
		"Birthday Star",
		"sprite",
	)
	if not star_result.ok:
		return star_result
	_birthday_star_texture = star_result.texture
	_journey_media_paths[birthday_star_id] = star_result.path
	var rainbow_path_id := str(shared.get("rainbowPath", ""))
	var rainbow_result := _load_transparent_layer(
		pack_source,
		media_by_id,
		rainbow_path_id,
		"Rainbow Path",
		"treatment",
	)
	if not rainbow_result.ok:
		return rainbow_result
	_rainbow_path_texture = rainbow_result.texture
	_rainbow_path_media_path = rainbow_result.path
	_journey_media_paths[rainbow_path_id] = rainbow_result.path
	return {"ok": true}


# Every layer laid over the place the child is looking at — Stella, a Family Guest, the
# Birthday Star, the Rainbow Path — has to arrive with genuine transparency around it.
func _load_transparent_layer(
	pack_source: String,
	media_by_id: Dictionary,
	media_id: String,
	description: String,
	role: String = "character-layer",
) -> Dictionary:
	var media: Dictionary = media_by_id.get(media_id, {})
	var path: String = media.get("path", "")
	if media.get("role") != role or path.is_empty():
		return {"ok": false, "error": "%s media is missing: %s" % [description, media_id]}
	var result: Dictionary = _adapter.load_png_texture(pack_source, path)
	if not result.ok:
		return result
	if result.get("has_transparency") != true:
		return {
			"ok": false,
			"error": "%s media needs genuine transparency: %s" % [description, media_id],
		}
	result["path"] = path
	return result


# The ordered journey names every place; this loads the leading run of them whose
# Place Illustration the Edition Pack already carries, and stops at the first one
# still waiting for its approved illustration. Each realized place brings its Family
# Guest, because she is the reason its Birthday Star is worth gathering.
func _load_place_media(pack_source: String, media_by_id: Dictionary) -> Dictionary:
	_realized_place_count = 0
	for place_value: Variant in _places():
		var place: Dictionary = place_value
		var illustration_id: String = place.get("illustration", "")
		var place_media: Dictionary = media_by_id.get(illustration_id, {})
		var place_path: String = place_media.get("path", "")
		if place_media.get("role") != "illustration-layer" or place_path.is_empty():
			break
		var place_result: Dictionary = _adapter.load_png_texture(pack_source, place_path)
		if not place_result.ok:
			return place_result
		var guest_id := PLACE_CONTENT.family_guest_illustration(place)
		var guest_result := _load_transparent_layer(
			pack_source,
			media_by_id,
			guest_id,
			"Family Guest",
		)
		if not guest_result.ok:
			return guest_result
		_place_textures[place.get("id", "")] = place_result.texture
		_place_media_paths[illustration_id] = place_path
		_family_guest_textures[place.get("id", "")] = guest_result.texture
		_journey_media_paths[guest_id] = guest_result.path
		_realized_place_count += 1
	if _realized_place_count == 0:
		return {
			"ok": false,
			"error": "Edition Pack has no Place Illustration for the journey's first place",
		}
	return {"ok": true}


static func default_pack_source() -> String:
	if FileAccess.file_exists(BUNDLED_PACK_SOURCE.path_join("edition.json")):
		return BUNDLED_PACK_SOURCE
	return WORKSPACE_PACK_SOURCE


func _fail_launch(message: String) -> Dictionary:
	_state = PresentationState.PACK_ERROR
	_launch_error = message
	return {"ok": false, "error": message}
