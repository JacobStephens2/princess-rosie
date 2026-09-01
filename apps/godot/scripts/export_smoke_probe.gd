extends Node

const SMOKE_FLAG := "--acceptance-smoke"
const CAPTURE_ARGUMENT := "--smoke-capture="
const EVIDENCE_ARGUMENT := "--smoke-evidence="
const STATE_ARGUMENT := "--smoke-state="

var _flight_samples: Array[Dictionary] = []
var _whole_journey_evidence: Dictionary = {}


func run_if_requested(shell: StorybookShell) -> void:
	var arguments := OS.get_cmdline_user_args()
	if not arguments.has(SMOKE_FLAG):
		return

	var capture_path := _argument_value(arguments, CAPTURE_ARGUMENT)
	var evidence_path := _argument_value(arguments, EVIDENCE_ARGUMENT)
	if capture_path.is_empty() or evidence_path.is_empty():
		push_error("Export smoke requires capture and evidence paths")
		get_tree().quit(2)
		return
	var requested_state := _argument_value(arguments, STATE_ARGUMENT)
	if requested_state in ["opening", "flight", "place-flight", "journey"]:
		var begin_button := shell.get_node_or_null("%BeginButton") as Button
		if begin_button == null:
			push_error("Export smoke could not find the Begin control")
			get_tree().quit(5)
			return
		begin_button.pressed.emit()
		await get_tree().process_frame
	if requested_state in ["flight", "place-flight", "journey"]:
		await _start_flight_with_real_inputs()
	if requested_state == "flight":
		await get_tree().create_timer(0.35).timeout
		_emit_keyboard_action(false)
		await get_tree().process_frame
	if requested_state in ["place-flight", "journey"]:
		await _fly_high_then_low(shell)
	if requested_state == "place-flight":
		_emit_pointer_action(true)
		await get_tree().create_timer(0.6).timeout
		_record_altitude(shell, "pointer-rise")
		_emit_pointer_action(false)
		await get_tree().process_frame
	if requested_state == "journey":
		await _complete_journey(shell)

	for _frame: int in 4:
		await get_tree().process_frame
	var image := get_viewport().get_texture().get_image()
	var capture_error := image.save_png(capture_path)
	if capture_error != OK:
		push_error("Could not save Storybook Stage capture: %s" % error_string(capture_error))
		get_tree().quit(3)
		return

	var evidence := shell.presentation_evidence()
	evidence["capture_sample_colors"] = _sample_color_count(image)
	evidence["storybook_stage"] = shell.storybook_stage_evidence()
	evidence["smoke_flight_samples"] = _flight_samples.duplicate(true)
	evidence["whole_journey"] = _whole_journey_evidence.duplicate(true)
	evidence["sound_events"] = shell.sound_event_evidence()
	var evidence_file := FileAccess.open(evidence_path, FileAccess.WRITE)
	if evidence_file == null:
		push_error("Could not write export smoke evidence: %s" % error_string(FileAccess.get_open_error()))
		get_tree().quit(4)
		return
	evidence_file.store_string(JSON.stringify(evidence, "  "))
	evidence_file.close()
	var scene_tree := get_tree()
	var quit_timer := scene_tree.create_timer(0.1)
	quit_timer.timeout.connect(scene_tree.quit.bind(0))
	shell.queue_free()


func _start_flight_with_real_inputs() -> void:
	_emit_keyboard_action(true)
	await get_tree().process_frame
	_emit_keyboard_action(false)
	await get_tree().process_frame
	_emit_pointer_action(true)
	await get_tree().process_frame
	_emit_pointer_action(false)
	await get_tree().process_frame
	# The final Storybook press remains held so it carries directly into Flight Control.
	_emit_keyboard_action(true)
	await get_tree().process_frame


func _fly_high_then_low(shell: StorybookShell) -> void:
	await get_tree().create_timer(2.78).timeout
	_record_altitude(shell, "held-rise")
	_emit_keyboard_action(false)
	await get_tree().create_timer(2.24).timeout
	_record_altitude(shell, "released-settle")


# The smoke run traverses the exported game's complete public journey with the same
# Space and primary-pointer inputs a child uses. Simulation time advances in-process so
# this remains a quick build check instead of replaying the authored minutes in real time.
func _complete_journey(shell: StorybookShell) -> void:
	var declared_places: Array = shell.presentation_evidence().get("places", [])
	for place_index: int in declared_places.size():
		# Alternate the public controls while Flight Control remains one shared action.
		if place_index % 2 == 0:
			_emit_keyboard_action(true)
			await get_tree().process_frame
			_emit_keyboard_action(false)
		else:
			_emit_pointer_action(true)
			await get_tree().process_frame
			_emit_pointer_action(false)
		await get_tree().process_frame
		_advance_shell(shell, 24.0)
		var moment: Dictionary = shell.presentation_evidence()
		if (
			moment.get("state") != "birthday_star_moment"
			or moment.get("birthday_stars", []).size() != place_index + 1
			or moment.get("rainbow_paths", []).size() != place_index + 1
		):
			push_error(
				"Export smoke dead-ended in place %d: %s"
				% [place_index, JSON.stringify(moment)],
			)
			get_tree().quit(8)
			return
		await _turn_the_birthday_star_page()

	var approach: Dictionary = shell.presentation_evidence()
	var approach_stage: Dictionary = shell.storybook_stage_evidence()
	if (
		approach.get("journey_phase") != "birthday-castle-approach"
		or approach_stage.get("birthday_castle_approach", {}).get("visible") != true
	):
		push_error("Export smoke missed the Birthday Castle approach: %s" % JSON.stringify(approach))
		get_tree().quit(9)
		return
	var approach_duration_seconds := float(approach.get("route_duration_seconds", 0.0))
	if approach_duration_seconds <= 0.0:
		push_error("Export smoke found no authored Birthday Castle approach duration")
		get_tree().quit(10)
		return
	_advance_shell(shell, approach_duration_seconds + 0.1)
	await get_tree().process_frame
	var celebration: Dictionary = shell.presentation_evidence()
	var celebration_stage: Dictionary = shell.storybook_stage_evidence()
	if celebration.get("state") != "celebration":
		push_error("Export smoke did not reach the celebration: %s" % JSON.stringify(celebration))
		get_tree().quit(11)
		return
	var visited_locations := _visited_places(shell)
	visited_locations.append("birthday-castle")
	_whole_journey_evidence = {
		"visited_locations": visited_locations,
		"celebration": {
			"state": celebration.get("state"),
			"journey_phase": celebration.get("journey_phase"),
			"birthday_stars": celebration.get("birthday_stars", []).duplicate(),
			"rainbow_paths": celebration.get("rainbow_paths", []).duplicate(),
			"returning_rainbow_paths": approach_stage.get(
				"birthday_castle_approach",
				{},
			).get("rainbow_path_count", 0),
			"visible": celebration_stage.get("celebration_visible", false),
		},
	}

	# Fly Again is part of the smoke rather than an isolated reset assertion: the same
	# packaged process must leave the child in a genuinely playable first place.
	_emit_pointer_action(true)
	await get_tree().process_frame
	_emit_pointer_action(false)
	await get_tree().process_frame
	var fly_again: Dictionary = shell.presentation_evidence()
	_whole_journey_evidence["fly_again"] = {
		"state": fly_again.get("state"),
		"journey_phase": fly_again.get("journey_phase"),
		"place": fly_again.get("place"),
		"birthday_stars": fly_again.get("birthday_stars", []).duplicate(),
		"rainbow_paths": fly_again.get("rainbow_paths", []).duplicate(),
	}


func _advance_shell(shell: StorybookShell, seconds: float) -> void:
	for _frame: int in ceili(seconds * 60.0):
		shell.advance_simulation(1.0 / 60.0)
		shell.advance_journey(1.0 / 60.0)


func _visited_places(shell: StorybookShell) -> Array[String]:
	var visited: Array[String] = []
	for sound_event: Dictionary in shell.sound_event_evidence():
		if sound_event.get("event") == "sound-event.place-entry":
			visited.append(str(sound_event.get("context", {}).get("place", "")))
	return visited


# The held flight input must not advance the moment. A release and new press does.
func _turn_the_birthday_star_page() -> void:
	_emit_keyboard_action(true)
	await get_tree().process_frame
	_emit_keyboard_action(false)
	await get_tree().process_frame
	_emit_keyboard_action(true)
	await get_tree().process_frame
	_emit_keyboard_action(false)
	await get_tree().process_frame


func _record_altitude(shell: StorybookShell, label: String) -> void:
	var evidence := shell.presentation_evidence()
	_flight_samples.append({
		"label": label,
		"altitude": evidence.get("flight", {}).get("altitude_stage_heights", 0.0),
		"progress": evidence.get("place_progress", 0.0),
	})


func _sample_color_count(image: Image) -> int:
	var sampled_colors: Dictionary = {}
	for x_index: int in 12:
		for y_index: int in 8:
			var x := mini(image.get_width() - 1, int((x_index + 0.5) * image.get_width() / 12.0))
			var y := mini(image.get_height() - 1, int((y_index + 0.5) * image.get_height() / 8.0))
			sampled_colors[image.get_pixel(x, y).to_rgba32()] = true
	return sampled_colors.size()


func _emit_keyboard_action(pressed: bool) -> void:
	var event := InputEventKey.new()
	event.physical_keycode = KEY_SPACE
	event.pressed = pressed
	Input.parse_input_event(event)


func _emit_pointer_action(pressed: bool) -> void:
	var event := InputEventMouseButton.new()
	event.button_index = MOUSE_BUTTON_LEFT
	event.pressed = pressed
	Input.parse_input_event(event)


func _argument_value(arguments: PackedStringArray, prefix: String) -> String:
	for argument in arguments:
		if argument.begins_with(prefix):
			return argument.trim_prefix(prefix)
	return ""
