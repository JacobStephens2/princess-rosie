#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
godot_bin="${GODOT_BIN:-/Applications/Godot.app/Contents/MacOS/Godot}"
build_dir="$project_dir/build"
app_path="$build_dir/Princess Rosie.app"
app_binary="$app_path/Contents/MacOS/Princess Rosie and the Seven Birthday Stars"
capture_path="$build_dir/storybook-stage.png"
evidence_path="$build_dir/export-smoke-evidence.json"
opening_capture_path="$build_dir/opening-storybook-stage.png"
opening_evidence_path="$build_dir/opening-export-smoke-evidence.json"
flight_capture_path="$build_dir/opening-flight-stage.png"
flight_evidence_path="$build_dir/opening-flight-export-smoke-evidence.json"
place_flight_capture_path="$build_dir/place-flight-stage.png"
place_flight_evidence_path="$build_dir/place-flight-export-smoke-evidence.json"
journey_capture_path="$build_dir/journey-stage.png"
journey_evidence_path="$build_dir/journey-export-smoke-evidence.json"
network_probe_trace_path="$build_dir/network-probe.log"
network_trace_path="$build_dir/export-smoke-network.log"
expected_pack_revision="$(jq -r '.revision' "$project_dir/../../shared/edition/edition.json")"
network_trace_pid=""
offline_sandbox_profile='(version 1) (allow default) (deny network*) (allow network-outbound (literal "/private/var/run/syslog"))'

stop_network_trace() {
  if [[ -n "$network_trace_pid" ]]; then
    kill "$network_trace_pid" 2>/dev/null || true
    wait "$network_trace_pid" 2>/dev/null || true
    network_trace_pid=""
  fi
}

start_network_trace() {
  local trace_path="$1"
  /usr/bin/log stream --style compact --level debug \
    --predicate 'eventMessage CONTAINS[c] "deny" AND eventMessage CONTAINS[c] "network"' \
    > "$trace_path" 2>&1 &
  network_trace_pid="$!"
  sleep 1
  if ! kill -0 "$network_trace_pid" 2>/dev/null; then
    echo "FAIL: macOS network-denial tracer did not stay running" >&2
    wait "$network_trace_pid" 2>/dev/null || true
    network_trace_pid=""
    exit 1
  fi
}

trap stop_network_trace EXIT

grep -q '^binary_format/architecture="universal"$' "$project_dir/export_presets.cfg"
grep -q '^codesign/codesign=0$' "$project_dir/export_presets.cfg"

mkdir -p "$build_dir"
rm -f "$capture_path" "$evidence_path" "$opening_capture_path" "$opening_evidence_path" \
  "$flight_capture_path" "$flight_evidence_path" "$place_flight_capture_path" \
  "$place_flight_evidence_path" "$journey_capture_path" "$journey_evidence_path" \
  "$build_dir/lacewood-flight-stage.png" \
  "$build_dir/lacewood-flight-export-smoke-evidence.json" \
  "$build_dir/lacewood-tracer-stage.png" \
  "$build_dir/lacewood-tracer-export-smoke-evidence.json" \
  "$build_dir/lacewood-path-choice-stage.png" \
  "$build_dir/lacewood-path-choice-export-smoke-evidence.json" \
  "$build_dir/lacewood-traversal-stage.png" \
  "$build_dir/lacewood-traversal-export-smoke-evidence.json" \
  "$network_probe_trace_path" "$network_trace_path"

"$godot_bin" --headless --path "$project_dir" --export-debug "macOS Development" "$app_path"

test -x "$app_binary"
pck_path="$app_path/Contents/Resources/Princess Rosie and the Seven Birthday Stars.pck"
test -s "$pck_path"
if rg -a -q 'Jacob Stephens' "$pck_path"; then
  echo "FAIL: packaged PCK contains Jacob Stephens" >&2
  exit 1
fi
if rg -a -q 'long straight dirty-blonde hair' "$pck_path"; then
  echo "FAIL: packaged PCK contains a family appearance prompt" >&2
  exit 1
fi
if rg -a -q 'written appearance cues' "$pck_path"; then
  echo "FAIL: packaged PCK contains family appearance provenance" >&2
  exit 1
fi
if rg -a -q 'ownerManualReviewBy' "$pck_path"; then
  echo "FAIL: packaged PCK contains owner review provenance" >&2
  exit 1
fi
if rg -a -q 'traceId' "$pck_path"; then
  echo "FAIL: packaged PCK contains a provider trace identifier" >&2
  exit 1
fi
if rg -a -q 'providerReportedUsage' "$pck_path"; then
  echo "FAIL: packaged PCK contains provider usage records" >&2
  exit 1
fi
if rg -a -q 'source-media/soundscape/masters/' "$pck_path"; then
  echo "FAIL: packaged PCK contains excluded soundscape master paths" >&2
  exit 1
fi
if rg -a -q 'catalog-state/' "$pck_path"; then
  echo "FAIL: packaged PCK contains catalog-state records" >&2
  exit 1
fi
if rg -a -q 'runtime-imports/' "$pck_path"; then
  echo "FAIL: packaged PCK contains runtime-import records" >&2
  exit 1
fi
if rg -a -q 'source-media/lacewood/lacewood-background.png' "$pck_path"; then
  echo "FAIL: packaged PCK contains the unused Lacewood master illustration" >&2
  exit 1
fi

for notice_name in NOTICE.txt THIRD-PARTY-NOTICES.txt; do
  for notice_path in "$build_dir/$notice_name" "$app_path/Contents/Resources/$notice_name"; do
    if [[ ! -s "$notice_path" ]]; then
      echo "FAIL: release notice is missing: $notice_path" >&2
      exit 1
    fi
  done
done
if ! rg -F -q 'not licensed for' "$build_dir/NOTICE.txt"; then
  echo "FAIL: private-family/no-redistribution notice is incomplete" >&2
  exit 1
fi
if ! rg -F -q 'Copyright (c) 2014-present Godot Engine contributors' "$build_dir/THIRD-PARTY-NOTICES.txt"; then
  echo "FAIL: Godot license notice is missing from third-party notices" >&2
  exit 1
fi
if ! rg -F -q 'Juan Linietsky, Ariel Manzur' "$build_dir/THIRD-PARTY-NOTICES.txt"; then
  echo "FAIL: required Godot copyright is missing from third-party notices" >&2
  exit 1
fi
file "$app_binary" | grep -q "arm64"
if codesign --verify --deep --strict "$app_path" >/dev/null 2>&1; then
  echo "FAIL: export unexpectedly produced a signed application" >&2
  exit 1
fi
if spctl --assess --type execute "$app_path" >/dev/null 2>&1; then
  echo "FAIL: export unexpectedly produced a Gatekeeper-approved application" >&2
  exit 1
fi

launch_started_seconds="$SECONDS"
open -W -n "$app_path" --args -- --acceptance-smoke \
  "--smoke-capture=$capture_path" \
  "--smoke-evidence=$evidence_path"
launch_elapsed_seconds="$((SECONDS - launch_started_seconds))"
if (( launch_elapsed_seconds > 5 )); then
  echo "FAIL: LaunchServices took ${launch_elapsed_seconds}s to reach the cover" >&2
  exit 1
fi

start_network_trace "$network_probe_trace_path"
sandbox-exec -p '(version 1) (allow default) (deny network*)' \
  /usr/bin/nc -G 1 127.0.0.1 9 >/dev/null 2>&1 || true
sleep 1
stop_network_trace
if ! rg -q 'Sandbox: nc\([0-9]+\) deny\([0-9]+\) network-' "$network_probe_trace_path"; then
  echo "FAIL: macOS network-denial tracer did not observe its control probe" >&2
  exit 1
fi

if rg -n \
  'HTTPRequest|HTTPClient|TCPServer|StreamPeerTCP|PacketPeerUDP|WebSocketPeer|WebRTCPeerConnection|ENetMultiplayerPeer|https?://' \
  "$project_dir/scripts" "$project_dir/scenes" "$project_dir/project.godot"; then
  echo "FAIL: runtime networking API or URL found in the packaged project" >&2
  exit 1
fi

start_network_trace "$network_trace_path"

test -s "$capture_path"
test -s "$evidence_path"
test "$(stat -f '%z' "$capture_path")" -gt 100000
jq -e --arg expected_pack_revision "$expected_pack_revision" '
  .state == "cover"
  and .window_mode == "fullscreen"
  and .engine_version == "4.7.2"
  and .pack_revision == $expected_pack_revision
  and .capture_sample_colors >= 8
  and .storybook_stage.aspect == "16:9"
  and .storybook_stage.essential_content_cropped == false
  and .storybook_stage.cover_visible == true
  and .storybook_stage.entry_points_visible == true
' "$evidence_path" >/dev/null

sandbox-exec -p "$offline_sandbox_profile" "$app_binary" -- --acceptance-smoke \
  "--smoke-state=opening" \
  "--smoke-capture=$opening_capture_path" \
  "--smoke-evidence=$opening_evidence_path"

test -s "$opening_capture_path"
test -s "$opening_evidence_path"
test "$(stat -f '%z' "$opening_capture_path")" -gt 100000
jq -e --arg expected_pack_revision "$expected_pack_revision" '
  .state == "opening_storybook_moment"
  and .opening_moment == "opening.celebration-preparations"
  and .pack_revision == $expected_pack_revision
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

sandbox-exec -p "$offline_sandbox_profile" "$app_binary" -- --acceptance-smoke \
  "--smoke-state=flight" \
  "--smoke-capture=$flight_capture_path" \
  "--smoke-evidence=$flight_evidence_path"

test -s "$flight_capture_path"
test -s "$flight_evidence_path"
test "$(stat -f '%z' "$flight_capture_path")" -gt 100000
jq -e --arg expected_pack_revision "$expected_pack_revision" '
  .state == "active_play"
  and .movement_state == "glide"
  and .active_action_sources == []
  and .observed_action_sources == ["keyboard.space", "pointer.primary"]
  and .pack_revision == $expected_pack_revision
  and .capture_sample_colors >= 8
  and .storybook_stage.aspect == "16:9"
  and .storybook_stage.essential_content_cropped == false
  and .storybook_stage.active_play_visible == true
  and .storybook_stage.flight_background_visible == true
  and .storybook_stage.flight_character_visible == true
  and .observed_opening_moments == [
    "opening.celebration-preparations",
    "opening.scattered-stars",
    "opening.departure"
  ]
  and .flight.automatic_forward_motion == true
  and .flight.character_layer_has_transparency == true
  and .flight.distance_stage_widths > 0
  and .sound_events == [
    {"event": "sound-event.opening-storybook-moment", "context": {"moment": "opening.celebration-preparations"}},
    {"event": "sound-event.opening-storybook-moment", "context": {"moment": "opening.scattered-stars"}},
    {"event": "sound-event.opening-storybook-moment", "context": {"moment": "opening.departure"}},
    {"event": "sound-event.flight-launch", "context": {}},
    {"event": "sound-event.movement-state", "context": {"state": "flight"}},
    {"event": "sound-event.movement-state", "context": {"state": "rise"}},
    {"event": "sound-event.movement-state", "context": {"state": "glide"}}
  ]
' "$flight_evidence_path" >/dev/null

sandbox-exec -p "$offline_sandbox_profile" "$app_binary" -- --acceptance-smoke \
  "--smoke-state=place-flight" \
  "--smoke-capture=$place_flight_capture_path" \
  "--smoke-evidence=$place_flight_evidence_path"

test -s "$place_flight_capture_path"
test -s "$place_flight_evidence_path"
test "$(stat -f '%z' "$place_flight_capture_path")" -gt 100000
jq -e --arg expected_pack_revision "$expected_pack_revision" '
  .state == "active_play"
  and .journey_phase == "place-flight"
  and .place == "rose-garden"
  and .place_progress > 0.3
  and .place_progress < 0.5
  and .observed_action_sources == ["keyboard.space", "pointer.primary"]
  and .observed_interactions == ["awakening-roses", "petal-drift"]
  and .playful_bumps_suppressed == true
  and .route_duration_seconds == 13
  and .safe_limits_preserve_forward_motion == true
  and .smoke_flight_samples[0].label == "held-rise"
  and .smoke_flight_samples[1].label == "released-settle"
  and .smoke_flight_samples[2].label == "pointer-rise"
  and .smoke_flight_samples[0].altitude > .smoke_flight_samples[1].altitude
  and .smoke_flight_samples[2].altitude > .smoke_flight_samples[1].altitude
  and .pack_revision == $expected_pack_revision
  and .capture_sample_colors >= 8
  and .storybook_stage.aspect == "16:9"
  and .storybook_stage.essential_content_cropped == false
  and .storybook_stage.place_background_visible == true
  and .storybook_stage.flight_character_visible == true
  and .storybook_stage.place_composition == {
    "place": "rose-garden",
    "tint": "#ffd7e6",
    "single_corridor_visible": true,
    "fork_visible": false,
    "atmospheric_motion": true,
    "high_interaction_visible": true,
    "low_interaction_visible": true,
    "observed_visual_responses": ["roses-open-wide", "petals-drift-upward"],
    "place_tint_applied": true,
    "playful_bump_wobble_visible": false
  }
  and (has("chosen_route") | not)
  and (has("path_choices") | not)
  and (has("journey_history") | not)
' "$place_flight_evidence_path" >/dev/null

sandbox-exec -p "$offline_sandbox_profile" "$app_binary" -- --acceptance-smoke \
  "--smoke-state=journey" \
  "--smoke-capture=$journey_capture_path" \
  "--smoke-evidence=$journey_evidence_path"

test -s "$journey_capture_path"
test -s "$journey_evidence_path"
test "$(stat -f '%z' "$journey_capture_path")" -gt 100000
jq -e --arg expected_pack_revision "$expected_pack_revision" '
  .state == "active_play"
  and .journey_phase == "place-flight"
  and .place == "rose-garden"
  and .birthday_stars == []
  and .rainbow_paths == []
  and .whole_journey.visited_locations == [
    "rose-garden",
    "lacewood",
    "abbey",
    "cloister",
    "pellegrino-peak",
    "sapphire-sea",
    "birthday-castle"
  ]
  and .whole_journey.celebration.state == "celebration"
  and .whole_journey.celebration.journey_phase == "celebration"
  and .whole_journey.celebration.birthday_stars == [
    "birthday-star.rose-garden",
    "birthday-star.lacewood",
    "birthday-star.abbey",
    "birthday-star.cloister",
    "birthday-star.pellegrino-peak",
    "birthday-star.sapphire-sea"
  ]
  and .whole_journey.celebration.rainbow_paths == [
    "rainbow-path.rose-garden",
    "rainbow-path.lacewood",
    "rainbow-path.abbey",
    "rainbow-path.cloister",
    "rainbow-path.pellegrino-peak",
    "rainbow-path.sapphire-sea"
  ]
  and .whole_journey.celebration.returning_rainbow_paths == 6
  and .whole_journey.celebration.visible == true
  and .whole_journey.fly_again.state == "active_play"
  and .whole_journey.fly_again.journey_phase == "place-flight"
  and .whole_journey.fly_again.place == "rose-garden"
  and .whole_journey.fly_again.birthday_stars == []
  and .whole_journey.fly_again.rainbow_paths == []
  and .observed_action_sources == ["keyboard.space", "pointer.primary"]
  and .journey_progress_persisted == false
  and .pack_revision == $expected_pack_revision
  and .capture_sample_colors >= 8
  and .storybook_stage.aspect == "16:9"
  and .storybook_stage.essential_content_cropped == false
  and .storybook_stage.active_play_visible == true
  and .storybook_stage.celebration_visible == false
  and (has("chosen_route") | not)
  and (has("path_choices") | not)
  and (has("journey_history") | not)
  and ([.sound_events[].event] | contains([
    "sound-event.place-entry",
    "sound-event.vignette-interaction",
    "sound-event.playful-bump",
    "sound-event.birthday-star-proximity",
    "sound-event.birthday-star-gathered",
    "sound-event.rainbow-path-opened",
    "sound-event.birthday-star-moment"
  ]))
' "$journey_evidence_path" >/dev/null

sleep 1
stop_network_trace
if rg -q 'Sandbox: Princess Rosie.*deny\([0-9]+\) network-' "$network_trace_path"; then
  echo "FAIL: packaged journey attempted a runtime network request" >&2
  rg 'Sandbox: Princess Rosie.*deny\([0-9]+\) network-' "$network_trace_path" >&2
  exit 1
fi

echo "PASS: unsigned LaunchServices launch, offline whole journey, celebration, and Fly Again"
