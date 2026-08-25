extends SceneTree

# The Bump Floor is the band at the bottom of the Single Route where a place's Playful
# Bump lives. ADR-0013 makes "no height is correct and none is inferior" an enforced
# invariant rather than a sentence: every rung of every place's Altitude Ladder has to
# keep reachable heights clear of the floor, or the journey refuses to launch.

const STORYBOOK_SHELL := preload("res://scripts/storybook_shell.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")
const PLACE_CONTENT := preload("res://scripts/place_content.gd")

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	var pack_root := ProjectSettings.globalize_path("res://../../shared/edition")
	var content: Dictionary = _read_json(pack_root + "/content.json")
	var tuning: Dictionary = _read_json(pack_root + "/tuning-intent.json")
	var flight: Dictionary = tuning.get("flight", {})
	var single_route: Dictionary = tuning.get("singleRoute", {})

	test.expect(
		not tuning.has("cloudRest"),
		"the Edition Pack carries no Cloud Rest tuning",
	)
	test.expect(
		flight.has("bumpFloorMarginStageHeights")
		and not flight.has("playfulBumpObstacleAltitudeStageHeights"),
		"the Bump Floor is declared as a margin above the lowest reachable height",
	)

	# Nothing about Stella's flight varies with anything that happened earlier in the
	# journey, so the contact altitude is one number for the whole Edition.
	var contact := PLACE_CONTENT.playful_bump_contact_altitude(flight)
	test.expect(
		PLACE_CONTENT.bump_floor_top(flight) > float(
			flight.get("minimumAltitudeStageHeights", 0.0),
		)
		and contact > PLACE_CONTENT.bump_floor_top(flight)
		and contact < float(flight.get("maximumAltitudeStageHeights", 1.0)),
		"the Bump Floor sits inside the reachable corridor",
	)
	test.expect(
		PLACE_CONTENT.near_miss_ceiling(flight) > contact,
		"the Near Miss band sits above the Bump Floor rather than inside it",
	)

	for place_value: Variant in content.get("places", []):
		var place: Dictionary = place_value
		var stranded: Array = PLACE_CONTENT.rungs_without_safe_height(
			place,
			single_route,
			flight,
		)
		test.expect(
			stranded.is_empty(),
			"every rung of %s keeps a height clear of the Bump Floor, not %s" % [
				place.get("name", "?"),
				stranded,
			],
		)

	# Golden Bell Abbey's settle bell is the lowest rung in the Edition, so it is the
	# rung a floor eats first. It is what makes this invariant worth enforcing.
	var abbey: Dictionary = _place_named(content, "abbey")
	test.expect(not abbey.is_empty(), "the Edition Pack declares Golden Bell Abbey")
	var settle := PLACE_CONTENT.altitude_window(
		PLACE_CONTENT.interaction(abbey, "settle"),
		single_route,
	)
	test.expect(
		not settle.is_empty() and float(settle.get("maximum", 0.0)) - contact >= 0.05,
		"the Abbey's settle bell keeps real room above the Bump Floor, not a sliver",
	)

	# A floor fat enough to swallow the settle bell is a content mistake, and the
	# journey has to name it rather than fly a rung the child can never hold.
	var fat_floor := flight.duplicate(true)
	fat_floor["bumpFloorMarginStageHeights"] = 0.5
	test.expect(
		PLACE_CONTENT.rungs_without_safe_height(abbey, single_route, fat_floor).has(
			"golden-bell-settle",
		),
		"a Bump Floor that swallows the settle bell names it",
	)

	var shell := STORYBOOK_SHELL.new()
	test.expect(
		shell.prepare_launch(pack_root).get("ok") == true,
		"the journey launches with the authored Bump Floor",
	)
	# The refusal itself, driven through the shell rather than the helper. The Edition
	# Pack is read from disk and is not the thing under test, so the fat floor is set on
	# the prepared shell and the same validation the launch runs is asked again.
	shell._flight_tuning["bumpFloorMarginStageHeights"] = 0.5
	var refusal: Dictionary = shell._validate_places()
	test.expect(
		refusal.get("ok") == false
		and str(refusal.get("error", "")).contains("Bump Floor"),
		"the journey refuses to launch on a Bump Floor that swallows a rung: %s"
		% JSON.stringify(refusal),
	)
	shell.free()

	test.finish(self, "Bump Floor acceptance")


func _read_json(path: String) -> Dictionary:
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return {}
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	return parsed if parsed is Dictionary else {}


func _place_named(content: Dictionary, place_id: String) -> Dictionary:
	for place_value: Variant in content.get("places", []):
		if place_value is Dictionary and place_value.get("id") == place_id:
			return place_value
	return {}
