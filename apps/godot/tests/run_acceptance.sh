#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
godot_bin="${GODOT_BIN:-/Applications/Godot.app/Contents/MacOS/Godot}"
log_dir="${TMPDIR:-/tmp}/rosie-godot-acceptance"

mkdir -p "$log_dir"
"$godot_bin" \
  --headless \
  --editor \
  --quit \
  --path "$project_dir" \
  --log-file "$log_dir/import.log"

tests=(
  edition_pack_acceptance.gd
  opening_media_acceptance.gd
  shell_launch_acceptance.gd
  presentation_transition_acceptance.gd
  one_action_input_acceptance.gd
  flight_motion_acceptance.gd
  flight_media_acceptance.gd
  journey_media_acceptance.gd
  presentation_motion_acceptance.gd
  lacewood_tracer_acceptance.gd
  lacewood_flight_control_acceptance.gd
  lacewood_interaction_acceptance.gd
  cloud_rest_auto_resume_acceptance.gd
  cloud_rest_gentle_help_acceptance.gd
  lacewood_presentation_acceptance.gd
  soundscape_player_acceptance.gd
  godot_audio_adapter_acceptance.gd
)

for test_script in "${tests[@]}"; do
  "$godot_bin" \
    --headless \
    --path "$project_dir" \
    --log-file "$log_dir/${test_script%.gd}.log" \
    --script "res://tests/$test_script"
done
