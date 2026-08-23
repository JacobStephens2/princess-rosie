#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
godot_bin="${GODOT_BIN:-/Applications/Godot.app/Contents/MacOS/Godot}"
build_dir="$project_dir/build"
app_path="$build_dir/Princess Rosi.app"
app_binary="$app_path/Contents/MacOS/Princess Rosi and the Seven Birthday Stars"
capture_path="$build_dir/storybook-stage.png"
evidence_path="$build_dir/export-smoke-evidence.json"
opening_capture_path="$build_dir/opening-storybook-stage.png"
opening_evidence_path="$build_dir/opening-export-smoke-evidence.json"
flight_capture_path="$build_dir/opening-flight-stage.png"
flight_evidence_path="$build_dir/opening-flight-export-smoke-evidence.json"
journey_capture_path="$build_dir/journey-tracer-stage.png"
journey_evidence_path="$build_dir/journey-tracer-export-smoke-evidence.json"
expected_pack_digest="$(tr -d '\n\r' < "$project_dir/edition-pack.digest")"

mkdir -p "$build_dir"
rm -f "$capture_path" "$evidence_path" "$opening_capture_path" "$opening_evidence_path" \
  "$flight_capture_path" "$flight_evidence_path" "$journey_capture_path" \
  "$journey_evidence_path"

"$godot_bin" --headless --path "$project_dir" --export-debug "macOS Development" "$app_path"

test -x "$app_binary"
lipo "$app_binary" -thin arm64 -output "$app_binary.arm64"
mv "$app_binary.arm64" "$app_binary"
codesign --force --deep --sign - "$app_path"
file "$app_binary" | grep -q "arm64"

sandbox-exec -p '(version 1) (allow default) (deny network*)' "$app_binary" -- --acceptance-smoke \
  "--smoke-capture=$capture_path" \
  "--smoke-evidence=$evidence_path"

test -s "$capture_path"
test -s "$evidence_path"
test "$(stat -f '%z' "$capture_path")" -gt 100000
jq -e --arg expected_pack_digest "$expected_pack_digest" '
  .state == "cover"
  and .window_mode == "windowed"
  and .engine_version == "4.7.2"
  and .pack_digest == $expected_pack_digest
  and .network_requests == 0
  and .capture_sample_colors >= 8
  and .storybook_stage.aspect == "16:9"
  and .storybook_stage.essential_content_cropped == false
  and .storybook_stage.cover_visible == true
  and .storybook_stage.entry_points_visible == true
' "$evidence_path" >/dev/null

sandbox-exec -p '(version 1) (allow default) (deny network*)' "$app_binary" -- --acceptance-smoke \
  "--smoke-state=opening" \
  "--smoke-capture=$opening_capture_path" \
  "--smoke-evidence=$opening_evidence_path"

test -s "$opening_capture_path"
test -s "$opening_evidence_path"
test "$(stat -f '%z' "$opening_capture_path")" -gt 100000
jq -e --arg expected_pack_digest "$expected_pack_digest" '
  .state == "opening_storybook_moment"
  and .opening_moment == "opening.celebration-preparations"
  and .pack_digest == $expected_pack_digest
  and .network_requests == 0
  and .capture_sample_colors >= 8
  and .storybook_stage.aspect == "16:9"
  and .storybook_stage.essential_content_cropped == false
  and .storybook_stage.opening_visible == true
  and .sound_events == [
    {
      "event": "sound-event.opening-storybook-moment",
      "context": {"moment": "opening.celebration-preparations"}
    }
  ]
' "$opening_evidence_path" >/dev/null

sandbox-exec -p '(version 1) (allow default) (deny network*)' "$app_binary" -- --acceptance-smoke \
  "--smoke-state=flight" \
  "--smoke-capture=$flight_capture_path" \
  "--smoke-evidence=$flight_evidence_path"

test -s "$flight_capture_path"
test -s "$flight_evidence_path"
test "$(stat -f '%z' "$flight_capture_path")" -gt 100000
jq -e --arg expected_pack_digest "$expected_pack_digest" '
  .state == "active_play"
  and .movement_state == "glide"
  and .pack_digest == $expected_pack_digest
  and .network_requests == 0
  and .capture_sample_colors >= 8
  and .storybook_stage.aspect == "16:9"
  and .storybook_stage.essential_content_cropped == false
  and .storybook_stage.active_play_visible == true
  and .sound_events == [
    {
      "event": "sound-event.opening-storybook-moment",
      "context": {"moment": "opening.celebration-preparations"}
    },
    {
      "event": "sound-event.opening-storybook-moment",
      "context": {"moment": "opening.scattered-stars"}
    },
    {
      "event": "sound-event.opening-storybook-moment",
      "context": {"moment": "opening.departure"}
    },
    {"event": "sound-event.flight-launch", "context": {}},
    {"event": "sound-event.movement-state", "context": {"state": "flight"}},
    {"event": "sound-event.movement-state", "context": {"state": "rise"}},
    {"event": "sound-event.movement-state", "context": {"state": "glide"}}
  ]
' "$flight_evidence_path" >/dev/null

sandbox-exec -p '(version 1) (allow default) (deny network*)' "$app_binary" -- --acceptance-smoke \
  "--smoke-state=journey" \
  "--smoke-capture=$journey_capture_path" \
  "--smoke-evidence=$journey_evidence_path"

test -s "$journey_capture_path"
test -s "$journey_evidence_path"
test "$(stat -f '%z' "$journey_capture_path")" -gt 100000
jq -e --arg expected_pack_digest "$expected_pack_digest" '
  .state == "celebration"
  and .journey_phase == "celebration"
  and .chosen_route == "cloister.arches"
  and .cloud_rests == 1
  and .birthday_stars == ["birthday-star.lacewood", "birthday-star.cloister"]
  and .rainbow_paths == ["rainbow-path.lacewood", "rainbow-path.cloister"]
  and .path_choices == {
    "path-choice.lacewood": "lacewood.canopy",
    "path-choice.cloister": "cloister.arches"
  }
  and .pack_digest == $expected_pack_digest
  and .network_requests == 0
  and .capture_sample_colors >= 8
  and .storybook_stage.aspect == "16:9"
  and .storybook_stage.essential_content_cropped == false
  and .storybook_stage.celebration_visible == true
  and ([.sound_events[].event] | contains([
    "sound-event.place-entry",
    "sound-event.path-choice-available",
    "sound-event.path-choice-selected",
    "sound-event.vignette-interaction",
    "sound-event.near-miss",
    "sound-event.playful-bump",
    "sound-event.cloud-rest-entered",
    "sound-event.cloud-rest-exited",
    "sound-event.birthday-star-proximity",
    "sound-event.birthday-star-gathered",
    "sound-event.rainbow-path-opened",
    "sound-event.birthday-star-moment",
    "sound-event.birthday-castle-arrival",
    "sound-event.celebration-interaction"
  ]))
' "$journey_evidence_path" >/dev/null

echo "PASS: exported arm64 application launch, cover, opening, active-flight, and audible Lacewood-to-Cloister-to-celebration tracer captures"
