extends Node

const SMOKE_FLAG := "--acceptance-smoke"
const CAPTURE_ARGUMENT := "--smoke-capture="
const EVIDENCE_ARGUMENT := "--smoke-evidence="
const STATE_ARGUMENT := "--smoke-state="

var _flight_samples: Array[Dictionary] = []


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
	evidence["network_requests"] = 0
	evidence["capture_sample_colors"] = _sample_color_count(image)
	evidence["storybook_stage"] = shell.storybook_stage_evidence()
	evidence["smoke_flight_samples"] = _flight_samples.duplicate(true)
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
	await get_tree().create_timer(3.85).timeout
	_record_altitude(shell, "held-rise")
	_emit_keyboard_action(false)
	await get_tree().create_timer(3.1).timeout
	_record_altitude(shell, "released-settle")


# The journey's first place suppresses its Playful Bump, so the smoke run flies it
# through to its Birthday Star Moment, turns the page, and meets Cloud Rest in the
# second place.
func _complete_journey(shell: StorybookShell) -> void:
	await _reach_birthday_star_moment(shell, 20.0)
	await _turn_the_birthday_star_page()
	# The second place answers the same two altitude bands before its low encounters.
	_emit_keyboard_action(true)
	await get_tree().create_timer(3.85).timeout
	_emit_keyboard_action(false)
	await get_tree().create_timer(3.1).timeout
	for input_kind: String in ["keyboard", "pointer"]:
		if input_kind == "keyboard":
			_emit_keyboard_action(true)
		else:
			_emit_pointer_action(true)
		await get_tree().create_timer(0.1).timeout
		if input_kind == "keyboard":
			_emit_keyboard_action(false)
		else:
			_emit_pointer_action(false)
	var rest_deadline_ms := Time.get_ticks_msec() + 10_000
	while (
		int(shell.presentation_evidence().get("cloud_rests", 0)) < 1
		and Time.get_ticks_msec() < rest_deadline_ms
	):
		await get_tree().process_frame
	if int(shell.presentation_evidence().get("cloud_rests", 0)) != 1:
		push_error(
			"Export smoke did not reach automatic Cloud Rest: %s"
			% JSON.stringify(shell.presentation_evidence()),
		)
		get_tree().quit(8)
		return
	var resume_deadline_ms := Time.get_ticks_msec() + 2_000
	while (
		shell.presentation_evidence().get("journey_phase") == "cloud-rest"
		and Time.get_ticks_msec() < resume_deadline_ms
	):
		await get_tree().process_frame
	if shell.presentation_evidence().get("journey_phase") != "place-flight":
		push_error("Export smoke did not resume automatically from Cloud Rest")
		get_tree().quit(9)
		return
	_emit_keyboard_action(true)
	# Gentle help after the Cloud Rest lengthens the remaining travel through the place.
	await _reach_birthday_star_moment(shell, 12.0)
	await _turn_the_birthday_star_page()
	await get_tree().create_timer(0.35).timeout


func _reach_birthday_star_moment(shell: StorybookShell, timeout_seconds: float) -> void:
	var deadline_ms := Time.get_ticks_msec() + int(timeout_seconds * 1000.0)
	while (
		shell.presentation_evidence().get("state") != "birthday_star_moment"
		and Time.get_ticks_msec() < deadline_ms
	):
		await get_tree().process_frame
	if shell.presentation_evidence().get("state") != "birthday_star_moment":
		push_error("Export smoke did not reach the guaranteed Birthday Star Moment")
		get_tree().quit(7)


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
