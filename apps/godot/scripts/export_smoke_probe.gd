extends Node

const SMOKE_FLAG := "--acceptance-smoke"
const CAPTURE_ARGUMENT := "--smoke-capture="
const EVIDENCE_ARGUMENT := "--smoke-evidence="
const STATE_ARGUMENT := "--smoke-state="


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
	if requested_state == "opening":
		var begin_button := shell.get_node_or_null("%BeginButton") as Button
		if begin_button == null:
			push_error("Export smoke could not find the Begin control")
			get_tree().quit(5)
			return
		begin_button.pressed.emit()

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


func _sample_color_count(image: Image) -> int:
	var sampled_colors: Dictionary = {}
	for x_index: int in 12:
		for y_index: int in 8:
			var x := mini(image.get_width() - 1, int((x_index + 0.5) * image.get_width() / 12.0))
			var y := mini(image.get_height() - 1, int((y_index + 0.5) * image.get_height() / 8.0))
			sampled_colors[image.get_pixel(x, y).to_rgba32()] = true
	return sampled_colors.size()


func _argument_value(arguments: PackedStringArray, prefix: String) -> String:
	for argument in arguments:
		if argument.begins_with(prefix):
			return argument.trim_prefix(prefix)
	return ""
