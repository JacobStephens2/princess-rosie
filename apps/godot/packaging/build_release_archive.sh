#!/usr/bin/env bash
set -euo pipefail

# Construct the GitHub macOS asset and SHA-256 checksum locally.
# Never publishes, signs, or notarizes.

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

usage() {
  fail "usage: $0 <version> [--source-revision <sha>]"
}

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
repo_root="${ROSIE_RELEASE_REPO_ROOT:-$(cd "$project_dir/../.." && pwd)}"

version="${1:-}"
[[ -n "$version" ]] || usage
shift || true

source_revision_ref=""
while (($# > 0)); do
  case "$1" in
    --source-revision)
      [[ $# -ge 2 ]] || usage
      source_revision_ref="$2"
      shift 2
      ;;
    *)
      usage
      ;;
  esac
done

[[ "$version" =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-rc\.[0-9]+)?$ ]] \
  || fail "unsupported or malformed version: $version"

test -d "$repo_root/.git" || test -f "$repo_root/.git" \
  || fail "release repository is missing: $repo_root"

if [[ -n "$(git -C "$repo_root" status --porcelain --untracked-files=all)" ]]; then
  fail "source revision is dirty; commit or restore the working tree first"
fi

head_revision="$(git -C "$repo_root" rev-parse HEAD)"
if [[ -n "$source_revision_ref" ]]; then
  intended_revision="$(git -C "$repo_root" rev-parse --verify "${source_revision_ref}^{commit}")" \
    || fail "unintended source revision: $source_revision_ref"
else
  intended_revision="$(git -C "$repo_root" rev-parse --verify "origin/main^{commit}")" \
    || fail "missing release prerequisite: origin/main"
fi
if tagged_revision="$(git -C "$repo_root" rev-parse --verify "${version}^{commit}" 2>/dev/null)"; then
  if [[ "$tagged_revision" != "$intended_revision" ]]; then
    fail "version $version is fixed at $tagged_revision; changed game code requires another RC tag"
  fi
fi
if [[ "$head_revision" != "$intended_revision" ]]; then
  fail "unintended source revision: HEAD is $head_revision, expected $intended_revision"
fi

godot_bin="${GODOT_BIN:-/Applications/Godot.app/Contents/MacOS/Godot}"
presets_path="$project_dir/export_presets.cfg"
icon_path="$project_dir/packaging/app-icon.icns"
notice_root="$project_dir/notices"
development_pack_root="${ROSIE_DEVELOPMENT_PACK_ROOT:-$project_dir/../../shared/edition}"
release_template="${HOME}/Library/Application Support/Godot/export_templates/4.7.2.stable/macos.zip"
short_version="${version#v}"
short_version="${short_version%%-rc.*}"

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

test -f "$presets_path" || fail "missing release prerequisite: export_presets.cfg"
release_preset="$(preset_section "macOS Release")" \
  || fail "missing release prerequisite: macOS Release preset"
[[ "$(preset_option "$release_preset" platform)" == '"macOS"' ]] \
  || fail "macOS Release preset is not a macOS preset"
[[ "$(preset_option "$release_preset" "application/short_version")" == "\"$short_version\"" ]] \
  || fail "version $version does not match the release preset short version"
[[ "$(preset_option "$release_preset" "codesign/codesign")" == "0" ]] \
  || fail "macOS Release must not require Apple signing credentials"

test -x "$godot_bin" || fail "missing release prerequisite: Godot 4.7.2 at $godot_bin"
godot_version="$("$godot_bin" --version)"
[[ "$godot_version" == 4.7.2* ]] \
  || fail "missing release prerequisite: Godot 4.7.2 (found $godot_version)"

test -s "$release_template" \
  || fail "missing release prerequisite: Godot 4.7.2 macOS export templates"
test -s "$icon_path" || fail "missing release prerequisite: Princess Rosie app icon"
test -s "$notice_root/NOTICE.txt" \
  || fail "missing release prerequisite: NOTICE.txt"
test -s "$notice_root/THIRD-PARTY-NOTICES.txt" \
  || fail "missing release prerequisite: THIRD-PARTY-NOTICES.txt"
test -d "$development_pack_root" \
  || fail "missing release prerequisite: development Edition Pack"

"$godot_bin" --headless --path "$project_dir" \
  --script res://packaging/validate_runtime_edition_pack.gd \
  -- "$development_pack_root" \
  || fail "Runtime Edition Pack derivation failed"

build_dir="$project_dir/build/release"
app_path="$build_dir/Princess Rosie.app"
app_binary="$app_path/Contents/MacOS/Princess Rosie and the Seven Birthday Stars"
pck_path="$app_path/Contents/Resources/Princess Rosie and the Seven Birthday Stars.pck"
archive_name="Princess-Rosie-${version}-macOS.zip"
archive_path="$build_dir/$archive_name"
checksum_path="$archive_path.sha256"
inspect_pck="$project_dir/packaging/inspect_packaged_pck.sh"

mkdir -p "$build_dir"
rm -rf "$app_path" "${app_path%.app}.command" "$archive_path" "$checksum_path"

"$godot_bin" --headless --path "$project_dir" \
  --export-release "macOS Release" "$app_path"
test -d "$app_path" || fail "the release export did not produce Princess Rosie.app"
test -x "$app_binary" || fail "the release app binary is missing or not executable"
test -s "$pck_path" || fail "the release app is missing its packaged Runtime Edition Pack"
test ! -e "${app_path%.app}.command" || fail "the release export wrote a console wrapper"
"$inspect_pck" "$pck_path"

stage="$(mktemp -d "${TMPDIR:-/tmp}/rosie-release-stage.XXXXXX")"
cleanup_stage() {
  rm -rf "$stage"
}
trap cleanup_stage EXIT

/usr/bin/ditto "$app_path" "$stage/Princess Rosie.app"
cp "$notice_root/NOTICE.txt" "$stage/NOTICE.txt"
cp "$notice_root/THIRD-PARTY-NOTICES.txt" "$stage/THIRD-PARTY-NOTICES.txt"
/usr/bin/xattr -cr "$stage" >/dev/null 2>&1 || true
find "$stage" -name .DS_Store -delete

source_date_epoch="$(git -C "$repo_root" log -1 --format=%ct "$intended_revision")"
timestamp="$(TZ=UTC /bin/date -u -r "$source_date_epoch" +%Y%m%d%H%M.%S)"
TZ=UTC find "$stage" -exec /usr/bin/touch -t "$timestamp" {} +

/usr/bin/ditto -c -k --norsrc --noextattr "$stage" "$archive_path"
test -s "$archive_path" || fail "the release archive was not written"

checksum="$(/usr/bin/shasum -a 256 "$archive_path" | awk '{print $1}')"
printf '%s  %s\n' "$checksum" "$archive_name" > "$checksum_path"
test -s "$checksum_path" || fail "the SHA-256 checksum file was not written"

echo "Wrote $archive_path"
echo "Wrote $checksum_path"
