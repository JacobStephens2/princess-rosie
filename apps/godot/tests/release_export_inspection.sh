#!/usr/bin/env bash
set -euo pipefail

# Packaging inspection for the macOS Release export: Info.plist, architectures,
# minimum OS metadata, release-template export, and icon presence. Does not
# launch the app; Finder/Dock icon approval remains an owner gate.

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
godot_bin="${GODOT_BIN:-/Applications/Godot.app/Contents/MacOS/Godot}"
presets_path="$project_dir/export_presets.cfg"
smoke_path="$project_dir/tests/export_smoke.sh"
icon_path="$project_dir/packaging/app-icon.icns"
compose_script="$project_dir/packaging/compose_app_icon.gd"
build_dir="$project_dir/build/release"
app_path="$build_dir/Princess Rosie.app"
app_binary="$app_path/Contents/MacOS/Princess Rosie and the Seven Birthday Stars"
info_plist="$app_path/Contents/Info.plist"
packaged_icon="$app_path/Contents/Resources/icon.icns"
console_command="${app_path%.app}.command"
release_template="$HOME/Library/Application Support/Godot/export_templates/4.7.2.stable/macos.zip"
approved_rosie="shared/edition/source-media/flight/rosie-stella.png"
approved_star="shared/edition/source-media/journey/birthday-star.png"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

preset_section() {
  local name="$1"
  python3 - "$presets_path" "$name" <<'PY'
import re
import sys
from pathlib import Path

text = Path(sys.argv[1]).read_text()
want = sys.argv[2]
parts = re.split(r'(?=^\[preset\.\d+\]$)', text, flags=re.MULTILINE)
matched = [part.strip() for part in parts if f'name="{want}"' in part.splitlines()]
if len(matched) != 1:
    sys.exit(1)
print(matched[0])
PY
}

preset_option() {
  local section="$1"
  local key="$2"
  python3 -c 'import sys
section, key = sys.argv[1], sys.argv[2]
prefix = key + "="
for line in section.splitlines():
    if line.startswith(prefix):
        print(line[len(prefix):])
        break
else:
    sys.exit(1)
' "$section" "$key"
}

plist_value() {
  /usr/bin/plutil -extract "$1" raw -- "$info_plist"
}

require_macos_13() {
  local label="$1"
  local value="$2"
  case "$value" in
    13|13.0|13.00|13.0.0) ;;
    *) fail "$label declares minimum macOS $value, expected 13.0" ;;
  esac
}

icns_has_required_sizes() {
  local icns="$1"
  local label="$2"
  local work dest file name
  work="$(mktemp -d "${TMPDIR:-/tmp}/rosie-iconset.XXXXXX")"
  dest="$work/app.iconset"
  /usr/bin/iconutil -c iconset -o "$dest" "$icns" \
    || fail "$label is not a readable .icns"
  local required=(
    icon_16x16.png
    icon_16x16@2x.png
    icon_32x32.png
    icon_32x32@2x.png
    icon_128x128.png
    icon_128x128@2x.png
    icon_256x256.png
    icon_256x256@2x.png
    icon_512x512.png
    icon_512x512@2x.png
  )
  for name in "${required[@]}"; do
    file="$dest/$name"
    if [[ ! -s "$file" ]]; then
      find "$work" -type f -print >&2 || true
      rm -rf "$work"
      fail "$label is missing required icon size $name"
    fi
  done
  rm -rf "$work"
}

test -f "$presets_path" || fail "export_presets.cfg is missing"
test -f "$smoke_path" || fail "the development export smoke path is missing"

grep -q '^name="macOS Development"$' "$presets_path" \
  || fail "the existing macOS Development preset is missing"
grep -q -- '--export-debug "macOS Development"' "$smoke_path" \
  || fail "export_smoke.sh no longer uses the macOS Development preset"

development_preset="$(preset_section "macOS Development")" \
  || fail "could not read the macOS Development preset"
release_preset="$(preset_section "macOS Release")" \
  || fail "a dedicated macOS Release preset is missing"

[[ "$(preset_option "$development_preset" name)" == '"macOS Development"' ]] \
  || fail "macOS Development preset name changed"
[[ "$(preset_option "$release_preset" name)" == '"macOS Release"' ]] \
  || fail "macOS Release preset is not named macOS Release"
[[ "$(preset_option "$release_preset" platform)" == '"macOS"' ]] \
  || fail "macOS Release preset is not a macOS preset"
[[ "$(preset_option "$release_preset" runnable)" == "false" ]] \
  || fail "macOS Release must leave the development preset as the runnable path"

printf '%s\n' "$release_preset" | grep -q '^\[preset\.[0-9][0-9]*\.options\]$' \
  || fail "macOS Release preset is missing its options section"

expect_option() {
  local key="$1"
  local expected="$2"
  local actual
  actual="$(preset_option "$release_preset" "$key")" || fail "macOS Release is missing $key"
  [[ "$actual" == "$expected" ]] || fail "macOS Release $key is $actual, expected $expected"
}

expect_option "custom_template/release" '""'
expect_option "debug/export_console_wrapper" "0"
expect_option "binary_format/architecture" '"universal"'
expect_option "application/short_version" '"1.0.0"'
expect_option "application/min_macos_version_arm64" '"13.0"'
expect_option "application/min_macos_version_x86_64" '"13.0"'
expect_option "codesign/codesign" "0"

build_version="$(preset_option "$release_preset" "application/version")" \
  || fail "macOS Release is missing application/version"
[[ "$build_version" == '"'*'"' ]] || fail "macOS Release application/version is unquoted"
build_version="${build_version%\"}"
build_version="${build_version#\"}"
[[ "$build_version" =~ ^[0-9]+(\.[0-9]+)*$ ]] \
  || fail "bundle build version $build_version is not a monotonic Apple build number"
[[ "$build_version" != "0.1.0" ]] \
  || fail "the release preset still presents itself as 0.1.0"

copyright="$(preset_option "$release_preset" "application/copyright" || true)"
if [[ "$copyright" == *'Private family edition'* ]]; then
  fail "the release preset still presents itself as Private family edition"
fi

icon_setting="$(preset_option "$release_preset" "application/icon")" \
  || fail "macOS Release is missing application/icon"
[[ "$icon_setting" == '"res://packaging/app-icon.icns"' ]] \
  || fail "macOS Release icon is $icon_setting, expected the project app icon"

test -f "$compose_script" || fail "the app icon compose script is missing"
rg -F -q "$approved_rosie" "$compose_script" \
  || fail "the icon compose script does not use the approved Princess Rosie/Stella cutout"
rg -F -q "$approved_star" "$compose_script" \
  || fail "the icon compose script does not use the approved Birthday Star"
if rg -n 'openai|image.generate|image_gen|gpt-image|dall-e|midjourney|stability' -i "$compose_script"; then
  fail "the icon compose script generates a new likeness"
fi

test -s "$icon_path" || fail "the composed .icns is missing"
icns_has_required_sizes "$icon_path" "the composed app icon"

test -s "$release_template" || fail "Godot 4.7.2 macOS export templates are not installed"
release_template_size="$(unzip -l "$release_template" | awk '/godot_macos_release.universal$/ { print $1 }')"
debug_template_size="$(unzip -l "$release_template" | awk '/godot_macos_debug.universal$/ { print $1 }')"
[[ -n "$release_template_size" && -n "$debug_template_size" ]] \
  || fail "the official macOS templates do not contain release and debug binaries"
[[ "$release_template_size" != "$debug_template_size" ]] \
  || fail "release and debug templates are indistinguishable"

mkdir -p "$build_dir"
rm -rf "$app_path" "$console_command"

"$godot_bin" --headless --path "$project_dir" --export-release "macOS Release" "$app_path"

test -d "$app_path" || fail "the release export did not produce Princess Rosie.app"
test -x "$app_binary" || fail "the release app binary is missing or not executable"
test -f "$info_plist" || fail "the release app has no Info.plist"
test ! -e "$console_command" || fail "the release export wrote a console wrapper"

macos_dir="$app_path/Contents/MacOS"
shopt -s nullglob
macos_entries=("$macos_dir"/*)
shopt -u nullglob
if (( ${#macos_entries[@]} != 1 )); then
  printf '%s\n' "${macos_entries[@]}" >&2
  fail "the release app MacOS folder should contain only the game binary"
fi

short_version="$(plist_value CFBundleShortVersionString)"
[[ "$short_version" == "1.0.0" ]] || fail "CFBundleShortVersionString is $short_version, expected 1.0.0"
[[ "$short_version" != "0.1.0" ]] || fail "the release app still presents itself as 0.1.0"

bundle_version="$(plist_value CFBundleVersion)"
[[ "$bundle_version" =~ ^[0-9]+(\.[0-9]+)*$ ]] \
  || fail "CFBundleVersion $bundle_version is not a monotonic Apple build number"
[[ "$bundle_version" != "0.1.0" ]] || fail "CFBundleVersion still presents the app as 0.1.0"

copyright_plist="$(plist_value NSHumanReadableCopyright || true)"
if [[ "$copyright_plist" == *'Private family edition'* ]]; then
  fail "the release app still presents itself as Private family edition"
fi

require_macos_13 "arm64 Info.plist" "$(plist_value LSMinimumSystemVersionByArchitecture.arm64)"
require_macos_13 "x86_64 Info.plist" "$(plist_value LSMinimumSystemVersionByArchitecture.x86_64)"

archs="$(/usr/bin/lipo -archs "$app_binary")"
echo " $archs " | grep -q " arm64 " || fail "the release binary is missing arm64 (archs: $archs)"
echo " $archs " | grep -q " x86_64 " || fail "the release binary is missing x86_64 (archs: $archs)"

binary_size="$(stat -f '%z' "$app_binary")"
delta_release=$(( binary_size - release_template_size ))
delta_release="${delta_release#-}"
delta_debug=$(( binary_size - debug_template_size ))
delta_debug="${delta_debug#-}"
if (( delta_release > 1048576 || delta_debug <= delta_release )); then
  fail "the exported binary size $binary_size is not the official release template (release $release_template_size, debug $debug_template_size)"
fi

test -s "$packaged_icon" || fail "the release app is missing Contents/Resources/icon.icns"
[[ "$(plist_value CFBundleIconFile)" == "icon.icns" ]] \
  || fail "Info.plist does not name icon.icns"
cmp -s "$icon_path" "$packaged_icon" \
  || fail "the packaged icon is not the composed Princess Rosie .icns"
icns_has_required_sizes "$packaged_icon" "the packaged app icon"

echo "PASS: macOS Release export uses the release template, 1.0.0 metadata, macOS 13 universals, and the Princess Rosie icon"
