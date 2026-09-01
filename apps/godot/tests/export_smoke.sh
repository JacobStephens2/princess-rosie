#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
godot_bin="${GODOT_BIN:-/Applications/Godot.app/Contents/MacOS/Godot}"
build_dir="$project_dir/build"
app_path="$build_dir/Princess Rosie.app"

grep -q '^binary_format/architecture="universal"$' "$project_dir/export_presets.cfg"
grep -q '^codesign/codesign=0$' "$project_dir/export_presets.cfg"

mkdir -p "$build_dir"
rm -rf "$app_path" "${app_path%.app}.command"

"$godot_bin" --headless --path "$project_dir" --export-debug "macOS Development" "$app_path"
"$project_dir/packaging/apply_adhoc_signature.sh" "$app_path"

PROJECT_DIR="$project_dir" BUILD_DIR="$build_dir" APP_PATH="$app_path" \
  "$project_dir/tests/packaged_app_smoke.sh"
