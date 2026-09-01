#!/usr/bin/env bash
set -euo pipefail

# Packaging inspection for the deterministic Godot Edition release archive
# and SHA-256 checksum. Does not publish, sign, or notarize.

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
repo_root="$(cd "$project_dir/../.." && pwd)"
command_path="$project_dir/packaging/build_release_archive.sh"
build_dir="$project_dir/build/release"
archive_name="Princess-Rosie-v1.0.0-rc.1-macOS.zip"
archive_path="$build_dir/$archive_name"
checksum_path="$archive_path.sha256"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

expect_fail() {
  local label="$1"
  shift
  local output=""
  local status=0
  set +e
  output="$("$@" 2>&1)"
  status=$?
  set -e
  if (( status == 0 )); then
    printf '%s\n' "$output" >&2
    fail "$label"
  fi
  printf '%s\n' "$output"
}

test -f "$command_path" || fail "the release archive command is missing"
test -x "$command_path" || fail "the release archive command is not executable"

malformed_output="$(expect_fail "the command accepted a malformed version" \
  "$command_path" "not-a-version")"
printf '%s\n' "$malformed_output" | grep -qi 'version' \
  || fail "a malformed version is not described as a version failure"

expect_fail "the command accepted a version without the v prefix" \
  "$command_path" "1.0.0-rc.1" >/dev/null
expect_fail "the command accepted a two-digit version" \
  "$command_path" "v1.0" >/dev/null
expect_fail "the command accepted a compact rc label" \
  "$command_path" "v1.0.0-rc1" >/dev/null
expect_fail "the command accepted an unsupported prerelease label" \
  "$command_path" "v1.0.0-beta.1" >/dev/null

git_fixture="$(mktemp -d "${TMPDIR:-/tmp}/rosie-release-git.XXXXXX")"
cleanup_git_fixture() {
  rm -rf "$git_fixture"
}
trap cleanup_git_fixture EXIT
git -C "$git_fixture" init -q -b main
git -C "$git_fixture" config user.name "Princess Rosie"
git -C "$git_fixture" config user.email "rosie@example.test"
printf 'clean\n' > "$git_fixture/README"
git -C "$git_fixture" add README
git -C "$git_fixture" commit -q -m "first"
first_revision="$(git -C "$git_fixture" rev-parse HEAD)"
printf 'second\n' > "$git_fixture/README"
git -C "$git_fixture" add README
git -C "$git_fixture" commit -q -m "second"
source_revision="$(git -C "$git_fixture" rev-parse HEAD)"
git -C "$git_fixture" remote add origin "$git_fixture"
git -C "$git_fixture" update-ref refs/remotes/origin/main "$source_revision"

git -C "$git_fixture" tag --no-sign v1.0.0-rc.1 "$first_revision"
fixed_tag_output="$(
  expect_fail "the command rebuilt an existing version from different game bytes" \
    env ROSIE_RELEASE_REPO_ROOT="$git_fixture" \
    "$command_path" "v1.0.0-rc.1" --source-revision "$source_revision"
)"
printf '%s\n' "$fixed_tag_output" | grep -qi 'tag\|fixed\|another RC' \
  || fail "an existing-tag mismatch is not described as requiring another RC"
git -C "$git_fixture" tag -d v1.0.0-rc.1 >/dev/null

printf 'dirty\n' > "$git_fixture/UNTRACKED"
dirty_output="$(
  expect_fail "the command accepted a dirty source revision" \
    env ROSIE_RELEASE_REPO_ROOT="$git_fixture" \
    "$command_path" "v1.0.0-rc.1" --source-revision "$source_revision"
)"
rm -f "$git_fixture/UNTRACKED"
printf '%s\n' "$dirty_output" | grep -qi 'dirty' \
  || fail "a dirty source revision is not described as dirty"

unintended_output="$(
  expect_fail "the command accepted an unintended source revision" \
    env ROSIE_RELEASE_REPO_ROOT="$git_fixture" \
    "$command_path" "v1.0.0-rc.1" --source-revision "$first_revision"
)"
printf '%s\n' "$unintended_output" | grep -qi 'revision' \
  || fail "an unintended source revision is not described as a revision failure"

with_release_git_root() {
  env ROSIE_RELEASE_REPO_ROOT="$git_fixture" "$@"
}

contract_output="$(
  expect_fail "the command accepted a version that does not match the release preset" \
    with_release_git_root "$command_path" "v9.9.9" --source-revision "$source_revision"
)"
printf '%s\n' "$contract_output" | grep -qi 'version' \
  || fail "a version-contract mismatch is not described as a version failure"

godot_output="$(
  expect_fail "the command accepted a missing Godot binary" \
    with_release_git_root GODOT_BIN="/no/such/godot" "$command_path" "v1.0.0-rc.1" \
    --source-revision "$source_revision"
)"
printf '%s\n' "$godot_output" | grep -qi 'godot\|prerequisite' \
  || fail "a missing Godot binary is not described as a missing prerequisite"

empty_home="$(mktemp -d "${TMPDIR:-/tmp}/rosie-release-home.XXXXXX")"
template_output="$(
  expect_fail "the command accepted missing macOS export templates" \
    with_release_git_root HOME="$empty_home" "$command_path" "v1.0.0-rc.1" \
    --source-revision "$source_revision"
)"
rmdir "$empty_home"
printf '%s\n' "$template_output" | grep -qi 'template\|prerequisite' \
  || fail "missing export templates are not described as a missing prerequisite"

malformed_pack="$project_dir/tests/fixtures/malformed-pack"
pack_output="$(
  expect_fail "the command accepted unresolved runtime references" \
    with_release_git_root ROSIE_DEVELOPMENT_PACK_ROOT="$malformed_pack" \
    "$command_path" "v1.0.0-rc.1" --source-revision "$source_revision"
)"
printf '%s\n' "$pack_output" | grep -qi 'runtime\|edition pack\|reference\|forbidden' \
  || fail "an invalid Runtime Edition Pack is not described as a pack failure"

if rg -n 'gh release|notarytool|altool|APPLE_ID|GH_TOKEN|codesign .*--(sign|force)|apply_adhoc_signature' \
  "$command_path"; then
  fail "the construction command publishes, notarizes, or signs"
fi
rg -q -- '--export-release "macOS Release"' "$command_path" \
  || fail "the command does not use the macOS Release preset"
rg -q -- '--export-debug "macOS Development"' "$project_dir/tests/export_smoke.sh" \
  || fail "the development export smoke path is no longer usable"
rg -q 'packaged_app_smoke.sh' "$project_dir/tests/export_smoke.sh" \
  || fail "export_smoke.sh no longer shares the packaged journey smoke"
rg -q 'packaged_app_smoke.sh' "$project_dir/tests/release_archive_smoke.sh" \
  || fail "the release archive smoke does not share the packaged journey smoke"
rg -F -q 'deny network*' "$project_dir/tests/packaged_app_smoke.sh" \
  || fail "the packaged journey smoke lost its deny-network assertion"
rg -F -q '.whole_journey.visited_locations == [' "$project_dir/tests/packaged_app_smoke.sh" \
  || fail "the packaged journey smoke lost its whole-journey assertion"

runbook="$repo_root/docs/godot-release.md"
test -f "$runbook" || fail "the Godot Edition release runbook is missing"
rg -F -q 'build_release_archive.sh v1.0.0-rc.2' "$runbook" \
  || fail "the runbook does not document the release archive command"
rg -F -q 'repackage_release_candidate.sh' "$runbook" \
  || fail "the runbook does not document target-Mac candidate repackaging"
rg -F -q 'release_candidate_repackage_inspection.sh' "$runbook" \
  || fail "the runbook does not document fixed-tag packaging inspection"
rg -q 'Control-click|Open Anyway' "$runbook" \
  || fail "the runbook does not document untrusted Release Candidate opening"
rg -q 'Developer ID|notariz' "$runbook" \
  || fail "the runbook does not document future credentialed signing"
rg -q 'gh release' "$runbook" \
  || fail "the runbook does not document GitHub upload"
rg -F -q 'shasum -a 256 -c' "$runbook" \
  || fail "the runbook does not document checksum verification"
rg -F -q 'ADR-0017' "$runbook" \
  || fail "the runbook does not document asset-replacement rules"

unpack_dir="$(mktemp -d "${TMPDIR:-/tmp}/rosie-release-unpack.XXXXXX")"
cleanup_all() {
  cleanup_git_fixture
  rm -rf "$unpack_dir"
}
trap cleanup_all EXIT

with_release_git_root "$command_path" "v1.0.0-rc.1" --source-revision "$source_revision"
test -s "$archive_path" || fail "the command did not produce $archive_name"
test -s "$checksum_path" || fail "the command did not produce a separate SHA-256 file"
test ! -e "$build_dir/Princess Rosie.command" \
  || fail "the release archive export wrote a console wrapper"

checksum_body="$(cat "$checksum_path")"
printf '%s\n' "$checksum_body" | grep -F -q "$archive_name" \
  || fail "the checksum file does not name the exact archive"
[[ "$checksum_body" =~ ^[0-9a-f]{64}"  $archive_name"$ ]] \
  || fail "the checksum file is not a standard SHA-256 line for $archive_name"

(
  cd "$build_dir"
  /usr/bin/shasum -a 256 -c "$archive_name.sha256"
) >/dev/null || fail "the checksum file cannot be verified with shasum"

listing="$(/usr/bin/zipinfo -1 "$archive_path")"
[[ -n "$listing" ]] || fail "the archive listing is empty"
top_level="$(printf '%s\n' "$listing" | awk -F/ 'NF && $1 != "" {print $1}' | LC_ALL=C sort -u)"
expected="$(printf '%s\n' "NOTICE.txt" "Princess Rosie.app" "THIRD-PARTY-NOTICES.txt")"
[[ "$top_level" == "$expected" ]] \
  || fail "the archive listing top level is not Princess Rosie.app, NOTICE.txt, and THIRD-PARTY-NOTICES.txt: $top_level"
appledouble="$(printf '%s\n' "$listing" | grep -E '(^|/)\._' || true)"
[[ -z "$appledouble" ]] \
  || fail "the archive listing includes AppleDouble members"

rm -rf "$unpack_dir"
mkdir -p "$unpack_dir"
/usr/bin/ditto -x -k "$archive_path" "$unpack_dir"

unpacked_app="$unpack_dir/Princess Rosie.app"
unpacked_binary="$unpacked_app/Contents/MacOS/Princess Rosie and the Seven Birthday Stars"
unpacked_plist="$unpacked_app/Contents/Info.plist"
unpacked_icon="$unpacked_app/Contents/Resources/icon.icns"
unpacked_pck="$unpacked_app/Contents/Resources/Princess Rosie and the Seven Birthday Stars.pck"

test -d "$unpacked_app" || fail "unzipping did not produce Princess Rosie.app at the top level"
test -x "$unpacked_binary" || fail "unzipping did not preserve the executable bit"
test -f "$unpacked_plist" || fail "unzipping did not preserve the app bundle Info.plist"
test -s "$unpacked_icon" || fail "unzipping did not preserve the app icon"
test -s "$unpacked_pck" || fail "unzipping did not preserve the packaged Runtime Edition Pack"
test -s "$unpack_dir/NOTICE.txt" \
  || fail "the archive is missing the top-level private-use notice"
test -s "$unpack_dir/THIRD-PARTY-NOTICES.txt" \
  || fail "the archive is missing the top-level third-party notices"
rg -F -q 'not licensed for' "$unpack_dir/NOTICE.txt" \
  || fail "the private-family/no-redistribution notice is incomplete"
rg -F -q 'Copyright (c) 2014-present Godot Engine contributors' \
  "$unpack_dir/THIRD-PARTY-NOTICES.txt" \
  || fail "Godot license notice is missing from third-party notices"
rg -F -q 'Juan Linietsky, Ariel Manzur' "$unpack_dir/THIRD-PARTY-NOTICES.txt" \
  || fail "required Godot copyright is missing from third-party notices"

forbidden_pck="$(mktemp "${TMPDIR:-/tmp}/rosie-forbidden.XXXXXX")"
printf 'Jacob Stephens\n' > "$forbidden_pck"
expect_fail "the packaged PCK inspector accepted forbidden development-pack contents" \
  "$project_dir/packaging/inspect_packaged_pck.sh" "$forbidden_pck" >/dev/null
rm -f "$forbidden_pck"

"$project_dir/packaging/inspect_packaged_pck.sh" "$unpacked_pck"

first_checksum="$(awk '{print $1}' "$checksum_path")"
with_release_git_root "$command_path" "v1.0.0-rc.1" --source-revision "$source_revision"
second_checksum="$(awk '{print $1}' "$checksum_path")"
[[ "$first_checksum" == "$second_checksum" ]] \
  || fail "repeated construction from the same revision did not yield the same checksum"

echo "PASS: release archive command constructs a deterministic unsigned macOS ZIP without publishing or signing"
