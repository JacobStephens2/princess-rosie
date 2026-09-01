#!/usr/bin/env bash
set -euo pipefail

# Repair an already-constructed Release Candidate archive on the target Mac.
# The input archive remains untouched: only the copied app receives a
# credential-free ad-hoc signature before the agreed ZIP is reconstructed.

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

usage() {
  fail "usage: $0 <version> <source-archive> <output-directory> [--command-revision <sha>]"
}

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
repo_root="$(cd "$project_dir/../.." && pwd)"
version="${1:-}"
source_argument="${2:-}"
output_argument="${3:-}"
[[ -n "$version" && -n "$source_argument" && -n "$output_argument" ]] || usage
shift 3

command_revision_ref=""
while (($# > 0)); do
  case "$1" in
    --command-revision)
      [[ $# -ge 2 ]] || usage
      command_revision_ref="$2"
      shift 2
      ;;
    *)
      usage
      ;;
  esac
done

[[ "$version" =~ ^v[0-9]+\.[0-9]+\.[0-9]+-rc\.[0-9]+$ ]] \
  || fail "unsupported or malformed Release Candidate version: $version"

test -s "$source_argument" || fail "source archive is missing: $source_argument"
source_dir="$(cd "$(dirname "$source_argument")" && pwd)"
source_archive="$source_dir/$(basename "$source_argument")"
archive_name="Princess-Rosie-${version}-macOS.zip"
[[ "$(basename "$source_archive")" == "$archive_name" ]] \
  || fail "source archive must be named $archive_name"
source_checksum="$source_archive.sha256"
test -s "$source_checksum" || fail "source checksum is missing: $source_checksum"

checksum_body="$(cat "$source_checksum")"
[[ "$checksum_body" =~ ^[0-9a-f]{64}"  $archive_name"$ ]] \
  || fail "source checksum must contain exactly one SHA-256 line naming $archive_name"
declared_checksum="${checksum_body%% *}"
actual_checksum="$(/usr/bin/shasum -a 256 "$source_archive" | awk '{print $1}')"
[[ "$declared_checksum" == "$actual_checksum" ]] \
  || fail "source archive does not match its SHA-256 checksum"

test -d "$repo_root/.git" || test -f "$repo_root/.git" \
  || fail "release repository is missing: $repo_root"
if [[ -n "$(git -C "$repo_root" status --porcelain --untracked-files=all)" ]]; then
  fail "repackage implementation is dirty; commit or restore the working tree first"
fi
head_revision="$(git -C "$repo_root" rev-parse HEAD)"
if [[ -n "$command_revision_ref" ]]; then
  intended_command_revision="$(
    git -C "$repo_root" rev-parse --verify "${command_revision_ref}^{commit}"
  )" || fail "unintended command revision: $command_revision_ref"
else
  intended_command_revision="$(git -C "$repo_root" rev-parse --verify "origin/main^{commit}")" \
    || fail "missing repackage prerequisite: origin/main"
fi
[[ "$head_revision" == "$intended_command_revision" ]] \
  || fail "unintended command revision: HEAD is $head_revision, expected $intended_command_revision"

tag_revision="$(git -C "$repo_root" rev-parse --verify "${version}^{commit}")" \
  || fail "release tag is missing: $version"
source_date_epoch="$(git -C "$repo_root" log -1 --format=%ct "$tag_revision")"
timestamp="$(TZ=UTC /bin/date -u -r "$source_date_epoch" +%Y%m%d%H%M.%S)"

mkdir -p "$output_argument"
output_dir="$(cd "$output_argument" && pwd)"
output_archive="$output_dir/$archive_name"
output_checksum="$output_archive.sha256"
[[ "$output_archive" != "$source_archive" ]] \
  || fail "output directory must differ from the source archive directory"

listing="$(/usr/bin/zipinfo -1 "$source_archive")"
[[ -n "$listing" ]] || fail "source archive listing is empty"
top_level="$(printf '%s\n' "$listing" | awk -F/ 'NF && $1 != "" {print $1}' | LC_ALL=C sort -u)"
expected="$(printf '%s\n' "NOTICE.txt" "Princess Rosie.app" "THIRD-PARTY-NOTICES.txt")"
[[ "$top_level" == "$expected" ]] \
  || fail "source archive has an unexpected top-level layout: $top_level"
appledouble="$(printf '%s\n' "$listing" | grep -E '(^|/)\._' || true)"
[[ -z "$appledouble" ]] || fail "source archive includes AppleDouble members"

stage="$(mktemp -d "${TMPDIR:-/tmp}/rosie-rc-repackage.XXXXXX")"
cleanup() {
  rm -rf "$stage"
}
trap cleanup EXIT

/usr/bin/ditto -x -k "$source_archive" "$stage"
app_path="$stage/Princess Rosie.app"
pck_path="$app_path/Contents/Resources/Princess Rosie and the Seven Birthday Stars.pck"
test -d "$app_path" || fail "source archive is missing Princess Rosie.app"
test -s "$pck_path" || fail "source archive is missing the packaged game"
test -s "$stage/NOTICE.txt" || fail "source archive is missing NOTICE.txt"
test -s "$stage/THIRD-PARTY-NOTICES.txt" \
  || fail "source archive is missing THIRD-PARTY-NOTICES.txt"

pck_hash_before="$(/usr/bin/shasum -a 256 "$pck_path" | awk '{print $1}')"
"$project_dir/packaging/apply_adhoc_signature.sh" "$app_path"
pck_hash_after="$(/usr/bin/shasum -a 256 "$pck_path" | awk '{print $1}')"
[[ "$pck_hash_before" == "$pck_hash_after" ]] \
  || fail "ad-hoc packaging repair changed the packaged game bytes"

/usr/bin/xattr -cr "$stage" >/dev/null 2>&1 || true
find "$stage" -name .DS_Store -delete
TZ=UTC find "$stage" -exec /usr/bin/touch -t "$timestamp" {} +
"$project_dir/packaging/inspect_adhoc_signature.sh" "$app_path"

rm -f "$output_archive" "$output_checksum"
/usr/bin/ditto -c -k --norsrc --noextattr "$stage" "$output_archive"
test -s "$output_archive" || fail "repaired archive was not written"
checksum="$(/usr/bin/shasum -a 256 "$output_archive" | awk '{print $1}')"
printf '%s  %s\n' "$checksum" "$archive_name" > "$output_checksum"

echo "Wrote $output_archive"
echo "Wrote $output_checksum"
