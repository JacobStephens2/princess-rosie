#!/usr/bin/env bash
set -euo pipefail

# Target-Mac inspection for the post-construction RC packaging repair. This
# intentionally invokes credential-free ad-hoc signing and must never run in CI.

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

usage() {
  fail "usage: $0 <version> <source-archive>"
}

expect_fail() {
  local label="$1"
  shift
  local output=""
  local exit_code=0
  set +e
  output="$("$@" 2>&1)"
  exit_code=$?
  set -e
  if (( exit_code == 0 )); then
    printf '%s\n' "$output" >&2
    fail "$label"
  fi
  printf '%s\n' "$output"
}

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
repo_root="$(cd "$project_dir/../.." && pwd)"
command_path="$project_dir/packaging/repackage_release_candidate.sh"
version="${1:-}"
source_archive="${2:-}"
[[ -n "$version" && -n "$source_archive" ]] || usage
archive_name="Princess-Rosie-${version}-macOS.zip"

test -x "$command_path" || fail "the release-candidate repackage command is missing"
test -s "$source_archive" || fail "the source archive is missing: $source_archive"
test -s "$source_archive.sha256" || fail "the source checksum is missing: $source_archive.sha256"

if rg -n 'GODOT_BIN|--export-(debug|release)|build_release_archive' "$command_path"; then
  fail "the repackage command rebuilds game code instead of repairing archive bytes"
fi
rg -q 'apply_adhoc_signature.sh' "$command_path" \
  || fail "the repackage command does not apply the target-Mac ad-hoc signature"

inspection_root="$project_dir/build/repackage-inspection"
bad_checksum_root="$(mktemp -d "${TMPDIR:-/tmp}/rosie-bad-checksum.XXXXXX")"
bad_output_root="$(mktemp -d "${TMPDIR:-/tmp}/rosie-bad-output.XXXXXX")"
first_dir="$inspection_root/first"
second_dir="$inspection_root/second"
first_archive="$first_dir/$archive_name"
second_archive="$second_dir/$archive_name"
source_extract="$(mktemp -d "${TMPDIR:-/tmp}/rosie-source-archive.XXXXXX")"
candidate_extract="$(mktemp -d "${TMPDIR:-/tmp}/rosie-candidate-archive.XXXXXX")"
dirty_marker="$repo_root/.rosie-repackage-dirty-test"

cleanup() {
  rm -rf "$bad_checksum_root" "$bad_output_root" "$source_extract" "$candidate_extract"
  rm -f "$dirty_marker"
}
trap cleanup EXIT

ln -s "$source_archive" "$bad_checksum_root/$archive_name"
printf 'not the candidate\n' > "$bad_checksum_root/other-file"
(
  cd "$bad_checksum_root"
  /usr/bin/shasum -a 256 other-file > "$archive_name.sha256"
)
bad_checksum_output="$(
  expect_fail "the command accepted a checksum for another file" \
    "$command_path" "$version" "$bad_checksum_root/$archive_name" "$bad_output_root"
)"
printf '%s\n' "$bad_checksum_output" | grep -qi 'checksum\|archive name' \
  || fail "a checksum for another file is not described as a checksum failure"

test ! -e "$dirty_marker" || fail "dirty-tree test marker already exists"
printf 'dirty\n' > "$dirty_marker"
dirty_output="$(
  expect_fail "the command accepted an uncommitted implementation" \
    "$command_path" "$version" "$source_archive" "$bad_output_root" \
    --command-revision "$(git -C "$repo_root" rev-parse HEAD)"
)"
rm -f "$dirty_marker"
printf '%s\n' "$dirty_output" | grep -qi 'dirty' \
  || fail "an uncommitted implementation is not described as dirty"

rm -rf "$inspection_root"
mkdir -p "$first_dir" "$second_dir"
source_hash_before="$(/usr/bin/shasum -a 256 "$source_archive" | awk '{print $1}')"
command_revision="$(git -C "$repo_root" rev-parse HEAD)"

"$command_path" "$version" "$source_archive" "$first_dir" \
  --command-revision "$command_revision"
"$command_path" "$version" "$source_archive" "$second_dir" \
  --command-revision "$command_revision"

test -s "$first_archive" || fail "the first repaired archive was not written"
test -s "$first_archive.sha256" || fail "the first repaired checksum was not written"
test -s "$second_archive" || fail "the second repaired archive was not written"
first_hash="$(awk '{print $1}' "$first_archive.sha256")"
second_hash="$(awk '{print $1}' "$second_archive.sha256")"
[[ "$first_hash" == "$second_hash" ]] \
  || fail "repackaging the same source archive was not deterministic"
(
  cd "$first_dir"
  /usr/bin/shasum -a 256 -c "$archive_name.sha256"
) >/dev/null || fail "the repaired checksum does not verify the repaired archive"

source_hash_after="$(/usr/bin/shasum -a 256 "$source_archive" | awk '{print $1}')"
[[ "$source_hash_before" == "$source_hash_after" ]] \
  || fail "the repackage command modified its source archive"

listing="$(/usr/bin/zipinfo -1 "$first_archive")"
top_level="$(printf '%s\n' "$listing" | awk -F/ 'NF && $1 != "" {print $1}' | LC_ALL=C sort -u)"
expected="$(printf '%s\n' "NOTICE.txt" "Princess Rosie.app" "THIRD-PARTY-NOTICES.txt")"
[[ "$top_level" == "$expected" ]] \
  || fail "the repaired archive changed the agreed top-level layout: $top_level"
appledouble="$(printf '%s\n' "$listing" | grep -E '(^|/)\._' || true)"
[[ -z "$appledouble" ]] || fail "the repaired archive includes AppleDouble members"

/usr/bin/ditto -x -k "$source_archive" "$source_extract"
/usr/bin/ditto -x -k "$first_archive" "$candidate_extract"
source_app="$source_extract/Princess Rosie.app"
candidate_app="$candidate_extract/Princess Rosie.app"
pck_relative="Contents/Resources/Princess Rosie and the Seven Birthday Stars.pck"
test -s "$source_app/$pck_relative" || fail "the source archive has no packaged game"
test -s "$candidate_app/$pck_relative" || fail "the repaired archive has no packaged game"
source_pck_hash="$(/usr/bin/shasum -a 256 "$source_app/$pck_relative" | awk '{print $1}')"
candidate_pck_hash="$(/usr/bin/shasum -a 256 "$candidate_app/$pck_relative" | awk '{print $1}')"
[[ "$source_pck_hash" == "$candidate_pck_hash" ]] \
  || fail "the packaging-only repair changed the packaged game bytes"

"$project_dir/packaging/inspect_adhoc_signature.sh" "$candidate_app"

echo "PASS: fixed-tag archive bytes repackage deterministically without rebuilding the game"
