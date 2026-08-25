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


static func visual_response(place: Dictionary, interaction_id: String) -> String:
	for interaction_value: Variant in place.get("interactions", []):
		if interaction_value is Dictionary and interaction_value.get("id") == interaction_id:
			return str(interaction_value.get("visualResponse", ""))
	return ""


# Rosalia's Rose Garden suppresses its Playful Bump so the child's first minutes produce
# only beauty. It is a place data flag, never a separate tutorial mode.
static func playful_bump_suppressed(place: Dictionary) -> bool:
	var playful_bump: Variant = place.get("playfulBump")
	return playful_bump is Dictionary and playful_bump.get("suppressed") == true


static func playful_bump_kind(place: Dictionary) -> String:
	var playful_bump: Variant = place.get("playfulBump")
	return str(playful_bump.get("id", "")) if playful_bump is Dictionary else ""
