extends SceneTree

const STORYBOOK_SCENE := preload("res://scenes/storybook_shell.tscn")
const EDITION_PACK_ADAPTER := preload("res://scripts/edition_pack_adapter.gd")
const PLACE_CONTENT := preload("res://scripts/place_content.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	_run.call_deferred()


func _run() -> void:
	var adapter := EDITION_PACK_ADAPTER.new()
	var pack_root := ProjectSettings.globalize_path(ACCEPTANCE_TEST.PACK_ROOT)
	var prepared: Dictionary = adapter.prepare(pack_root)
	var content_result: Dictionary = adapter.load_content(pack_root, prepared)
	test.expect(content_result.get("ok") == true, "content.json loads from Edition Pack")
	var places: Array = content_result.get("value", {}).get("places", [])
	test.expect(places.size() == 6, "the Edition Pack declares six places")

	# Seam 1: Data Contract on each Place in the Edition Pack
	var expected_cameos := {
		"rose-garden": {
			"guest": "Mom",
			"action": "tends the waking roses",
			"position": Vector2(0.59, 0.46),
			"width": 0.11,
		},
		"lacewood": {
			"guest": "Gram",
			"action": "follows a silver ribbon",
			"position": Vector2(0.61, 0.44),
			"width": 0.10,
		},
		"abbey": {
			"guest": "Pop",
			"action": "listens beneath the golden bells",
			"position": Vector2(0.60, 0.43),
			"width": 0.10,
		},
		"cloister": {
			"guest": "Beasley",
			"action": "pounces after Stella’s sparkles",
			"position": Vector2(0.60, 0.60),
			"width": 0.09,
		},
		"pellegrino-peak": {
			"guest": "Uncle",
			"action": "watches the flower petals lift",
			"position": Vector2(0.60, 0.45),
			"width": 0.10,
		},
		"sapphire-sea": {
			"guest": "Aunt",
			"action": "waves from the luminous cove",
			"position": Vector2(0.59, 0.45),
			"width": 0.10,
		},
	}

	for place_val: Variant in places:
		var place: Dictionary = place_val
		var place_id := str(place.get("id", ""))
		test.expect(expected_cameos.has(place_id), "place is recognized: %s" % place_id)
		var expected: Dictionary = expected_cameos.get(place_id, {})

		var cameo: Dictionary = PLACE_CONTENT.cameo(place)
		test.expect(not cameo.is_empty(), "place %s declares a cameo dictionary" % place_id)
		test.expect(
			PLACE_CONTENT.cameo_action(place) == expected["action"],
			"place %s cameo action matches spec: %s" % [place_id, PLACE_CONTENT.cameo_action(place)],
		)
		var pos := PLACE_CONTENT.cameo_stage_position(place)
		test.expect(
			pos.is_equal_approx(expected["position"]),
			"place %s cameo stagePosition matches spec: %s vs %s" % [place_id, pos, expected["position"]],
		)
		test.expect(
			is_equal_approx(PLACE_CONTENT.cameo_stage_width(place), float(expected["width"])),
			"place %s cameo stageWidth matches spec: %f vs %f" % [place_id, PLACE_CONTENT.cameo_stage_width(place), expected["width"]],
		)

	# Shell launch validation: Shell refuses a place missing cameo or having invalid cameo
	var shell: StorybookShell = STORYBOOK_SCENE.instantiate()
	root.add_child(shell)
	await process_frame
	test.expect(
		shell.prepare_launch(pack_root).get("ok") == true,
		"storybook shell prepares launch with valid cameos",
	)

	# Verify %CameoFamilyGuest exists as a dedicated node in the scene
	var cameo_node := shell.get_node_or_null("%CameoFamilyGuest") as TextureRect
	test.expect(cameo_node != null, "%CameoFamilyGuest exists as a dedicated node")

	# Seam 2: Scenic presentation, timing window, opacity fade, and clearing before star approach
	const DRIVER := preload("res://tests/place_journey_driver.gd")
	DRIVER.launch(shell)
	DRIVER.advance(shell, 0.75) # enter first place (rose-garden)
	await process_frame

	# Phase 0: Before 0.16 progress - cameo is off-screen / invisible
	_fly_to_progress(shell, 0.10)
	await process_frame
	var pre_stage := shell.storybook_stage_evidence()
	var pre_cameo: Dictionary = pre_stage.get("place_cameo", {})
	test.expect(
		pre_cameo.get("visible") == false and float(pre_cameo.get("opacity", 0.0)) == 0.0,
		"cameo is not visible before 0.16 progress: %s" % JSON.stringify(pre_cameo),
	)

	# Phase 1: Fade-in window (0.16 - 0.22)
	_fly_to_progress(shell, 0.19)
	await process_frame
	var fadein_stage := shell.storybook_stage_evidence()
	var fadein_cameo: Dictionary = fadein_stage.get("place_cameo", {})
	var fadein_opacity := float(fadein_cameo.get("opacity", 0.0))
	test.expect(
		fadein_cameo.get("visible") == true
		and fadein_opacity > 0.0
		and fadein_opacity < 1.0,
		"cameo fades in gently between 0.16 and 0.22 progress (opacity: %f)" % fadein_opacity,
	)

	# Phase 2: Full visibility window (0.22 - 0.43)
	_fly_to_progress(shell, 0.30)
	await process_frame
	var full_stage := shell.storybook_stage_evidence()
	var full_cameo: Dictionary = full_stage.get("place_cameo", {})
	test.expect(
		full_cameo.get("visible") == true
		and is_equal_approx(float(full_cameo.get("opacity", 0.0)), 1.0)
		and full_cameo.get("family_guest") == "Mom"
		and full_cameo.get("action") == "tends the waking roses",
		"cameo is fully visible and identifies Mom and her action: %s" % JSON.stringify(full_cameo),
	)
	test.expect(
		cameo_node != null and cameo_node.texture != null,
		"cameo reuses the approved Family Guest cutout texture",
	)
	var stage_pos: Vector2 = full_cameo.get("stage_position", Vector2.ZERO)
	test.expect(
		is_equal_approx(stage_pos.x, 1280.0 * 0.59) and is_equal_approx(stage_pos.y, 720.0 * 0.46),
		"cameo is positioned at the authored stagePosition (expected ~755.2, 331.2; got %s)" % stage_pos,
	)
	var stage_w: float = float(full_cameo.get("stage_width", 0.0))
	test.expect(
		is_equal_approx(stage_w, 1280.0 * 0.11),
		"cameo size matches authored stageWidth (expected ~140.8; got %f)" % stage_w,
	)

	# Subtle procedural breathe test: scale breathes gently over time
	var initial_scale := cameo_node.scale
	await create_timer(0.12).timeout
	test.expect(not cameo_node.scale.is_equal_approx(initial_scale), "cameo exhibits subtle procedural breathe")

	# Phase 3: Fade-out window (0.43 - 0.49)
	_fly_to_progress(shell, 0.46)
	await process_frame
	var fadeout_stage := shell.storybook_stage_evidence()
	var fadeout_cameo: Dictionary = fadeout_stage.get("place_cameo", {})
	var fadeout_opacity := float(fadeout_cameo.get("opacity", 0.0))
	test.expect(
		fadeout_cameo.get("visible") == true
		and fadeout_opacity > 0.0
		and fadeout_opacity < 1.0,
		"cameo fades out gently between 0.43 and 0.49 progress (opacity: %f)" % fadeout_opacity,
	)

	# Phase 4: Cleared frame from 0.49 through Star approach (0.49 - 0.75)
	_fly_to_progress(shell, 0.60)
	await process_frame
	var cleared_stage := shell.storybook_stage_evidence()
	var cleared_cameo: Dictionary = cleared_stage.get("place_cameo", {})
	test.expect(
		cleared_cameo.get("visible") == false and float(cleared_cameo.get("opacity", 0.0)) == 0.0,
		"cameo clears the frame well before the Birthday Star approach: %s" % JSON.stringify(cleared_cameo),
	)

	# Phase 5: Birthday Star approach arrival (progress >= 0.75)
	for _step: int in 120:
		if shell.presentation_evidence().get("journey_phase") == "birthday-star-approach":
			break
		DRIVER.advance(shell, 0.05)
	await process_frame
	var star_stage := shell.storybook_stage_evidence()
	var star_approach: Dictionary = star_stage.get("birthday_star_approach", {})
	var post_cameo: Dictionary = star_stage.get("place_cameo", {})
	test.expect(
		post_cameo.get("visible") == false,
		"cameo remains off-screen during Birthday Star approach",
	)
	test.expect(
		star_approach.get("family_guest_visible") == true,
		"Family Guest arrives beside the Birthday Star at the arrival",
	)

	# Seam 3: Scenic non-interactivity (no collision, no Near Miss, no sound events)
	test.expect(
		shell.presentation_evidence().get("near_misses") == 0,
		"cameo does not trigger Near Miss",
	)
	test.expect(
		shell.presentation_evidence().get("playful_bumps") == 0,
		"cameo does not trigger Playful Bump",
	)
	for event_item: Dictionary in shell.sound_event_evidence():
		test.expect(
			not str(event_item.get("event", "")).contains("cameo"),
			"soundscape remains untouched with ambient silence for cameo: %s" % event_item.get("event", ""),
		)

	shell.queue_free()
	await process_frame

	# Architectural Uniformity: Beasley in Cloister of Clouds uses identical pipeline
	var cloister_shell: StorybookShell = STORYBOOK_SCENE.instantiate()
	root.add_child(cloister_shell)
	await process_frame
	cloister_shell.prepare_launch(pack_root)
	DRIVER.fly_to_place(cloister_shell, 3)
	await process_frame
	test.expect(
		cloister_shell.presentation_evidence().get("place") == "cloister",
		"arrived in Cloister of Clouds",
	)
	_fly_to_progress(cloister_shell, 0.30)
	await process_frame
	var cloister_cameo: Dictionary = cloister_shell.storybook_stage_evidence().get("place_cameo", {})
	test.expect(
		cloister_cameo.get("visible") == true
		and cloister_cameo.get("family_guest") == "Beasley"
		and cloister_cameo.get("action") == "pounces after Stella’s sparkles"
		and is_equal_approx(cloister_cameo.get("stage_position", Vector2.ZERO).x, 1280.0 * 0.60)
		and is_equal_approx(cloister_cameo.get("stage_position", Vector2.ZERO).y, 720.0 * 0.60)
		and is_equal_approx(float(cloister_cameo.get("stage_width", 0.0)), 1280.0 * 0.09),
		"Beasley follows the exact same shared engine pipeline without exceptions: %s"
		% JSON.stringify(cloister_cameo),
	)
	_fly_to_progress(cloister_shell, 0.60)
	await process_frame
	test.expect(
		cloister_shell.storybook_stage_evidence().get("place_cameo", {}).get("visible") == false,
		"Beasley cameo clears the stage before arrival",
	)
	cloister_shell.queue_free()
	await process_frame

	test.finish(self, "place cameo acceptance")


static func _fly_to_progress(shell: StorybookShell, target: float) -> void:
	const DRIVER := preload("res://tests/place_journey_driver.gd")
	for _step: int in 600:
		if float(shell.presentation_evidence().get("place_progress", 0.0)) >= target:
			break
		DRIVER.advance(shell, 0.02)

