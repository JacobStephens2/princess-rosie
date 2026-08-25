class_name PlaceContent
extends RefCounted

# The questions a place's authored data answers. The shell and the place presentation
# module both ask them of the same Edition Pack dictionary, so they ask them here.

const BAND_HIGH := "high"
const BAND_LOW := "low"
const ALTITUDE_BANDS := [BAND_HIGH, BAND_LOW]


static func family_guest_illustration(place: Dictionary) -> String:
	return str(place.get("familyGuestIllustration", ""))


static func birthday_star(place: Dictionary) -> String:
	return str(place.get("birthdayStar", ""))


static func rainbow_path(place: Dictionary) -> String:
	return str(place.get("rainbowPath", ""))


static func interaction(place: Dictionary, altitude_band: String) -> Dictionary:
	for interaction_value: Variant in place.get("interactions", []):
		if (
			interaction_value is Dictionary
			and interaction_value.get("altitudeBand") == altitude_band
		):
			return interaction_value
	return {}


# A place answers the child's height through a ladder of altitude rungs read from the
# top of the Storybook Stage down. Two rungs is the usual shape — one high delight and
# one low — and the two thresholds the Single Route tuning already carries describe
# them, gap and all, so a height between the bands still awakens nothing. A place whose
# delight is finer-grained, like Golden Bell Abbey's four bells, declares a window on
# each interaction instead. Neither shape is a special case: the rungs come from the
# same authored fields every place carries.
static func altitude_ladder(
	place: Dictionary,
	single_route_tuning: Dictionary,
) -> Array[Dictionary]:
	var rungs: Array[Dictionary] = []
	for interaction_value: Variant in place.get("interactions", []):
		if not interaction_value is Dictionary:
			continue
		var interaction: Dictionary = interaction_value
		var window := altitude_window(interaction, single_route_tuning)
		if window.is_empty():
			continue
		rungs.append({
			"interaction": interaction,
			"minimum": window["minimum"],
			"maximum": window["maximum"],
		})
	rungs.sort_custom(
		func(first: Dictionary, second: Dictionary) -> bool:
			return float(first["minimum"]) > float(second["minimum"]),
	)
	return rungs


# The heights one interaction answers to. An empty window means the interaction names no
# reachable height, which the shell refuses at launch rather than flying past in silence.
static func altitude_window(
	interaction: Dictionary,
	single_route_tuning: Dictionary,
) -> Dictionary:
	var altitude_band := str(interaction.get("altitudeBand", ""))
	var minimum := -INF
	var maximum := INF
	if altitude_band == BAND_HIGH:
		minimum = float(single_route_tuning.get("highBandAltitudeMinimum", 0.56))
	elif altitude_band == BAND_LOW:
		maximum = float(single_route_tuning.get("lowBandAltitudeMaximum", 0.52))
	if interaction.has("altitudeAtLeast"):
		minimum = float(interaction["altitudeAtLeast"])
	if interaction.has("altitudeAtMost"):
		maximum = float(interaction["altitudeAtMost"])
	if minimum == -INF and maximum == INF:
		return {}
	if minimum > maximum:
		return {}
	return {"minimum": minimum, "maximum": maximum}


# Which delight this height awakens. Every rung is worth reaching, so the answer is
# whichever rung holds the child rather than whichever one she was supposed to find.
# Rungs are read from the top down, so a height exactly on the seam between two of them
# rings the higher one.
static func interaction_for_altitude(
	place: Dictionary,
	single_route_tuning: Dictionary,
	altitude: float,
) -> Dictionary:
	for rung: Dictionary in altitude_ladder(place, single_route_tuning):
		if altitude >= float(rung["minimum"]) and altitude <= float(rung["maximum"]):
			return rung["interaction"]
	return {}


static func visual_response(place: Dictionary, interaction_id: String) -> String:
	for interaction_value: Variant in place.get("interactions", []):
		if interaction_value is Dictionary and interaction_value.get("id") == interaction_id:
			return str(interaction_value.get("visualResponse", ""))
	return ""


# Golden Bell Abbey answers every crossing between rungs, so a child moving up and down
# keeps making bells rather than exhausting them. Places whose delights awaken once say
# nothing, and answer once. It is a property of how a place responds, not of the shell.
static func awakens_on_every_crossing(place: Dictionary) -> bool:
	return place.get("awakensOnEveryCrossing") == true


# Rosalia's Rose Garden suppresses its Playful Bump so the child's first minutes produce
# only beauty. It is a place data flag, never a separate tutorial mode.
static func playful_bump_suppressed(place: Dictionary) -> bool:
	var playful_bump: Variant = place.get("playfulBump")
	return playful_bump is Dictionary and playful_bump.get("suppressed") == true


static func playful_bump_kind(place: Dictionary) -> String:
	var playful_bump: Variant = place.get("playfulBump")
	return str(playful_bump.get("id", "")) if playful_bump is Dictionary else ""
