#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
godot_bin="${GODOT_BIN:-/Applications/Godot.app/Contents/MacOS/Godot}"
build_dir="$project_dir/build"
app_path="$build_dir/Princess Rosi.app"
app_binary="$app_path/Contents/MacOS/Princess Rosi and the Seven Birthday Stars"
capture_path="$build_dir/storybook-stage.png"
evidence_path="$build_dir/export-smoke-evidence.json"
expected_pack_digest="$(tr -d '\n\r' < "$project_dir/edition-pack.digest")"

mkdir -p "$build_dir"
rm -f "$capture_path" "$evidence_path"

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

echo "PASS: exported arm64 application launch and Storybook Stage capture"
