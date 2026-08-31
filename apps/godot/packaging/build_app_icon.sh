#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
godot_bin="${GODOT_BIN:-/Applications/Godot.app/Contents/MacOS/Godot}"
png_path="$project_dir/packaging/app-icon.png"
icns_path="$project_dir/packaging/app-icon.icns"
work="$(mktemp -d "${TMPDIR:-/tmp}/rosie-app-icon.XXXXXX")"
iconset="$work/app.iconset"

cleanup() {
  rm -rf "$work"
}
trap cleanup EXIT

"$godot_bin" --headless --path "$project_dir" --script res://packaging/compose_app_icon.gd
test -s "$png_path"

mkdir -p "$iconset"
sips -z 16 16 "$png_path" --out "$iconset/icon_16x16.png" >/dev/null
sips -z 32 32 "$png_path" --out "$iconset/icon_16x16@2x.png" >/dev/null
sips -z 32 32 "$png_path" --out "$iconset/icon_32x32.png" >/dev/null
sips -z 64 64 "$png_path" --out "$iconset/icon_32x32@2x.png" >/dev/null
sips -z 128 128 "$png_path" --out "$iconset/icon_128x128.png" >/dev/null
sips -z 256 256 "$png_path" --out "$iconset/icon_128x128@2x.png" >/dev/null
sips -z 256 256 "$png_path" --out "$iconset/icon_256x256.png" >/dev/null
sips -z 512 512 "$png_path" --out "$iconset/icon_256x256@2x.png" >/dev/null
sips -z 512 512 "$png_path" --out "$iconset/icon_512x512.png" >/dev/null
sips -z 1024 1024 "$png_path" --out "$iconset/icon_512x512@2x.png" >/dev/null
/usr/bin/iconutil -c icns -o "$icns_path" "$iconset"
test -s "$icns_path"
echo "Wrote $icns_path"
