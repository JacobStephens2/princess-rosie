#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
godot_bin="${GODOT_BIN:-/Applications/Godot.app/Contents/MacOS/Godot}"
log_dir="${TMPDIR:-/tmp}/rosi-godot-acceptance"

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
  lacewood_tracer_acceptance.gd
  cloister_tracer_acceptance.gd
  edition_contract_tracer_acceptance.gd
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
