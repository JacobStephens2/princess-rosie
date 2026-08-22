#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
godot_bin="${GODOT_BIN:-/Applications/Godot.app/Contents/MacOS/Godot}"
build_dir="$project_dir/build"
app_path="$build_dir/Princess Rosi.app"
app_binary="$app_path/Contents/MacOS/Princess Rosi and the Seven Birthday Stars"
capture_path="$build_dir/storybook-stage.png"
evidence_path="$build_dir/export-smoke-evidence.json"

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
jq -e '
  .state == "cover"
  and .window_mode == "windowed"
  and .engine_version == "4.7.2"
  and .pack_digest == "sha256:03898d8b734cd94d98ae8130dda328fee62bbbfc52faa3e22c5c5edaefac1c9e"
  and .network_requests == 0
  and .storybook_stage.aspect == "16:9"
  and .storybook_stage.essential_content_cropped == false
' "$evidence_path" >/dev/null

echo "PASS: exported arm64 application launch and Storybook Stage capture"
