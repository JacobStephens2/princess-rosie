extends SceneTree

const RUNTIME_EDITION_PACK := preload("res://addons/edition_pack_export/runtime_edition_pack.gd")
const EDITION_PACK_ADAPTER := preload("res://scripts/edition_pack_adapter.gd")
const ACCEPTANCE_TEST := preload("res://tests/acceptance_test.gd")

var test: RefCounted = ACCEPTANCE_TEST.new()


func _init() -> void:
	var pack := RUNTIME_EDITION_PACK.new()
	var fixture_root := ProjectSettings.globalize_path(
		"res://tests/fixtures/runtime-development-pack",
	)
	var development_root := ProjectSettings.globalize_path(ACCEPTANCE_TEST.PACK_ROOT)

	test.expect(
		FileAccess.file_exists(development_root.path_join("source-media/flight/provenance.json")),
		"the authoritative development Edition Pack still keeps provenance",
	)

	var derived: Dictionary = pack.derive(fixture_root)
	test.expect(derived.get("ok") == true, "a development Edition Pack derives: %s" % derived.get("error", "unknown error"))
	var derived_files: Array = derived.get("files", [])
	var derived_paths := _paths(derived_files)

	test.expect(derived_paths.has("edition.json"), "the Runtime Edition Pack keeps a manifest")
	test.expect(derived_paths.has("content.json"), "content needed during play is retained")
	test.expect(derived_paths.has("tuning-intent.json"), "tuning needed during play is retained")
	test.expect(derived_paths.has("media.json"), "the media index needed during play is retained")
	test.expect(
		derived_paths.has("source-media/flight/hero.png"),
		"an illustration referenced during play is retained",
	)
	test.expect(
		derived_paths.has("source-media/soundscape/runtime/chime.wav"),
		"a sound referenced during play is retained",
	)
	test.expect(
		derived_paths.has("source-media/soundscape/music/theme.mp3"),
		"the soundtrack referenced during play is retained",
	)
	test.expect(
		not derived_paths.has("source-media/flight/unused.png"),
		"an unused illustration is excluded",
	)
	test.expect(
		not derived_paths.has("source-media/flight/provenance.json"),
		"family appearance provenance is excluded",
	)
	test.expect(
		not derived_paths.has("source-media/soundscape/masters/chime.wav"),
		"an unused master is excluded",
	)
	test.expect(
		not derived_paths.has("source-media/soundscape/provenance/chime.json"),
		"provider trace records are excluded",
	)
	test.expect(
		not derived_paths.has("source-media/soundscape/runtime-imports/chime.json"),
		"runtime-import records are excluded",
	)
	test.expect(
		not derived_paths.has("source-media/soundscape/catalog-state/chime.json"),
		"catalog/build state is excluded",
	)
	test.expect(
		not derived_paths.has("soundscape/provenance.json"),
		"soundscape provenance is excluded",
	)
	test.expect(
		not derived_paths.has("source-media/soundscape/soundscape-build-report.json"),
		"build reports are excluded",
	)

	var catalog_text := _text_at(derived_files, "soundscape/catalog.json")
	test.expect(not catalog_text.contains("authoring"), "catalog authoring prompts are stripped")
	test.expect(
		not catalog_text.contains("eleven_text_to_sound_v2"),
		"catalog provider identifiers are stripped",
	)
	test.expect(
		catalog_text.contains("runtime-cue.story.confirmation"),
		"the stripped catalog still names the playable cue",
	)

	var source_media_text := _text_at(derived_files, "soundscape/source-media.json")
	test.expect(
		not source_media_text.contains("source-media/soundscape/masters/"),
		"source-media.json does not name excluded master paths",
	)
	test.expect(
		not source_media_text.contains("provenancePath"),
		"source-media.json does not name provenance paths",
	)
	test.expect(
		source_media_text.contains("source-media/soundscape/runtime/chime.wav"),
		"source-media.json still names the runtime cue path",
	)

	test.expect(
		not _bytes_contain(derived_files, "Jacob Stephens"),
		"derived files do not include Jacob Stephens",
	)
	test.expect(
		not _bytes_contain(derived_files, "long straight dirty-blonde hair"),
		"derived files do not include family appearance prompts",
	)
	test.expect(
		not _bytes_contain(derived_files, "traceId"),
		"derived files do not include provider trace identifiers",
	)

	var accepted: Dictionary = pack.validate(derived_files)
	test.expect(
		accepted.get("ok") == true,
		"the derived Runtime Edition Pack validates: %s" % accepted.get("error", "unknown error"),
	)

	var omitted: Array = derived_files.duplicate()
	omitted = omitted.filter(func(file: Variant) -> bool: return file.path != "source-media/flight/hero.png")
	var omitted_report: Dictionary = pack.validate(omitted)
	test.expect(omitted_report.get("ok") == false, "omitting a required runtime illustration fails validation")
	test.expect(
		str(omitted_report.get("error", "")).contains("source-media/flight/hero.png"),
		"the omitted illustration is named in the validation error",
	)

	var polluted: Array = derived_files.duplicate()
	polluted.append({
		"role": "source-media-provenance",
		"path": "source-media/flight/provenance.json",
		"bytes": FileAccess.get_file_as_bytes(fixture_root.path_join("source-media/flight/provenance.json")),
	})
	var polluted_report: Dictionary = pack.validate(polluted)
	test.expect(polluted_report.get("ok") == false, "a forbidden development record fails validation")
	test.expect(
		str(polluted_report.get("error", "")).contains("source-media/flight/provenance.json")
		or str(polluted_report.get("error", "")).contains("Jacob Stephens"),
		"the forbidden record is named in the validation error",
	)

	var release: Dictionary = pack.derive(development_root)
	test.expect(
		release.get("ok") == true,
		"the authoritative development Edition Pack derives: %s" % release.get("error", "unknown error"),
	)
	var release_files: Array = release.get("files", [])
	var release_check: Dictionary = pack.validate(release_files)
	test.expect(
		release_check.get("ok") == true,
		"the derived authoritative Runtime Edition Pack validates: %s" % release_check.get("error", "unknown error"),
	)
	test.expect(
		not _bytes_contain(release_files, "Jacob Stephens"),
		"the Runtime Edition Pack does not include Jacob Stephens",
	)
	test.expect(
		not _bytes_contain(release_files, "long straight dirty-blonde hair"),
		"the Runtime Edition Pack does not include family appearance prompts",
	)
	test.expect(
		not _bytes_contain(release_files, "traceId"),
		"the Runtime Edition Pack does not include provider trace identifiers",
	)
	test.expect(
		not _paths(release_files).has("source-media/lacewood/lacewood-background.png"),
		"the unused Lacewood master illustration is excluded",
	)
	# The last stretch is flown against its own scenery, so the packaged app has to
	# carry it as surely as it carries the celebration it leads to.
	test.expect(
		_paths(release_files).has("source-media/celebration/birthday-castle-approach.png")
		and _paths(release_files).has(
			"source-media/celebration/birthday-castle-celebration.png",
		),
		"the Birthday Castle approach travels with the celebration it leads to: %s"
		% JSON.stringify(_paths(release_files).keys()),
	)
	test.expect(
		not _paths_contain(_paths(release_files), "source-media/soundscape/masters/"),
		"soundscape masters are excluded from the Runtime Edition Pack",
	)
	test.expect(
		not _paths_contain(_paths(release_files), "catalog-state/"),
		"catalog-state records are excluded from the Runtime Edition Pack",
	)
	test.expect(
		not _paths_contain(_paths(release_files), "runtime-imports/"),
		"runtime-import records are excluded from the Runtime Edition Pack",
	)

	var adapter := EDITION_PACK_ADAPTER.new()
	var dest := OS.get_cache_dir().path_join("rosie-runtime-edition-pack-acceptance")
	var written: Dictionary = pack.materialize(release_files, dest)
	test.expect(written.get("ok") == true, "the Runtime Edition Pack materializes for adapter prepare")
	var prepared: Dictionary = adapter.prepare(dest)
	test.expect(
		prepared.get("ok") == true,
		"the Runtime Edition Pack prepares through the Edition Pack adapter: %s" % prepared.get("error", "unknown error"),
	)
	test.expect(
		prepared.get("revision") == ACCEPTANCE_TEST.EXPECTED_PACK_REVISION,
		"the Runtime Edition Pack retains the development revision",
	)
	var content: Dictionary = adapter.load_content(dest, prepared)
	test.expect(content.get("ok") == true, "runtime content loads through the adapter")
	var media: Dictionary = adapter.load_media(dest, prepared)
	test.expect(media.get("ok") == true, "runtime media loads through the adapter")

	var notice_root := ProjectSettings.globalize_path("res://notices")
	var family_notice := FileAccess.get_file_as_string(notice_root.path_join("NOTICE.txt"))
	test.expect(
		family_notice.contains("not licensed for") and family_notice.contains("Private family edition"),
		"the private-family/no-redistribution notice is present",
	)
	var third_party_notice := FileAccess.get_file_as_string(notice_root.path_join("THIRD-PARTY-NOTICES.txt"))
	test.expect(
		third_party_notice.contains("Copyright (c) 2014-present Godot Engine contributors"),
		"the Godot license notice is present",
	)
	test.expect(
		third_party_notice.contains("Juan Linietsky, Ariel Manzur"),
		"the required Godot copyright is present",
	)

	test.finish(self, "Runtime Edition Pack acceptance")


func _paths(files: Array) -> Dictionary:
	var paths := {}
	for file_value: Variant in files:
		if file_value is Dictionary and file_value.get("path") is String:
			paths[file_value.path] = true
	return paths


func _paths_contain(paths: Dictionary, fragment: String) -> bool:
	for path: Variant in paths:
		if str(path).contains(fragment):
			return true
	return false


func _text_at(files: Array, relative_path: String) -> String:
	for file_value: Variant in files:
		if file_value is Dictionary and file_value.get("path") == relative_path:
			var bytes: PackedByteArray = file_value.get("bytes", PackedByteArray())
			return bytes.get_string_from_utf8()
	return ""


func _bytes_contain(files: Array, needle: String) -> bool:
	for file_value: Variant in files:
		if file_value is Dictionary and str(file_value.get("path", "")).ends_with(".json"):
			var bytes: PackedByteArray = file_value.get("bytes", PackedByteArray())
			if bytes.get_string_from_utf8().contains(needle):
				return true
	return false
