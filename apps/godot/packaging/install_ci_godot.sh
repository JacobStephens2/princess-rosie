#!/usr/bin/env bash
set -euo pipefail

# Install the exact Godot 4.7.2 Standard editor and macOS export templates
# for CI. Does not install Godot .NET. Never publishes.

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

godot_version="4.7.2"
godot_tag="4.7.2-stable"
editor_archive="Godot_v4.7.2-stable_macos.universal.zip"
templates_archive="Godot_v4.7.2-stable_export_templates.tpz"
editor_sha512="38aa16e5bba2083941fc5b3e54be0089bd4cc35e32415f5b9fd9a8a6a7b9818255d44532ea8ef94b5aef56c4b407c2d634fa4f657e4ebe681ebbf59b7bac69ca"
templates_sha512="ca4d71c4d7b81dfc15d1a98baa07534aa95b03fdda78a0075b06672e1648d2e5f40980c9adc28d23e1b92e732ee7bf3461997aa804af74ec2fcd7a93ccb84079"
download_base="https://github.com/godotengine/godot-builds/releases/download/${godot_tag}"

ci_root="${GODOT_CI_ROOT:-${GITHUB_WORKSPACE:-$PWD}/.godot-ci}"
download_dir="$ci_root/downloads"
godot_app="$ci_root/Godot.app"
godot_bin="$godot_app/Contents/MacOS/Godot"
templates_dir="${HOME}/Library/Application Support/Godot/export_templates/${godot_version}.stable"
editor_zip="$download_dir/$editor_archive"
templates_tpz="$download_dir/$templates_archive"

download() {
  local url="$1"
  local dest="$2"
  echo "Downloading $url"
  curl -fL --retry 5 --retry-delay 2 --retry-all-errors -o "$dest" "$url"
}

verify_sha512() {
  local expected="$1"
  local file="$2"
  printf '%s  %s\n' "$expected" "$file" | /usr/bin/shasum -a 512 -c -
}

mkdir -p "$download_dir" "$templates_dir"
rm -rf "$godot_app"

download "$download_base/$editor_archive" "$editor_zip"
verify_sha512 "$editor_sha512" "$editor_zip"
/usr/bin/ditto -x -k "$editor_zip" "$ci_root"
test -x "$godot_bin" || fail "Godot 4.7.2 did not unpack to $godot_bin"
/usr/bin/xattr -cr "$godot_app" >/dev/null 2>&1 || true

download "$download_base/$templates_archive" "$templates_tpz"
verify_sha512 "$templates_sha512" "$templates_tpz"
/usr/bin/unzip -p "$templates_tpz" templates/macos.zip > "$templates_dir/macos.zip"
/usr/bin/unzip -p "$templates_tpz" templates/version.txt > "$templates_dir/version.txt"
test -s "$templates_dir/macos.zip" || fail "Godot 4.7.2 macOS export templates were not extracted"
[[ "$(tr -d '[:space:]' < "$templates_dir/version.txt")" == "${godot_version}.stable" ]] \
  || fail "export templates version.txt is not ${godot_version}.stable"

rm -rf "$download_dir"
export GODOT_BIN="$godot_bin"

echo "Installed Godot $godot_version Standard at $godot_bin"
