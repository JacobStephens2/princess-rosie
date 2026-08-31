#!/usr/bin/env bash
set -euo pipefail

# Complement to export_smoke.sh: unzip the release archive and run the same
# deny-network whole-journey packaged smoke against that artifact.

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
version="${1:-v1.0.0-rc.1}"
build_dir="$project_dir/build/release"
archive_path="$build_dir/Princess-Rosie-${version}-macOS.zip"
unpack_dir="$build_dir/unpacked"

if [[ ! -s "$archive_path" ]]; then
  echo "FAIL: release archive is missing: $archive_path" >&2
  echo "Construct it with: apps/godot/packaging/build_release_archive.sh $version" >&2
  exit 1
fi

rm -rf "$unpack_dir"
mkdir -p "$unpack_dir"
/usr/bin/ditto -x -k "$archive_path" "$unpack_dir"
/usr/bin/xattr -cr "$unpack_dir" >/dev/null 2>&1 || true

app_path="$unpack_dir/Princess Rosie.app"
test -d "$app_path"
test -x "$app_path/Contents/MacOS/Princess Rosie and the Seven Birthday Stars"

PROJECT_DIR="$project_dir" BUILD_DIR="$unpack_dir" APP_PATH="$app_path" \
  "$project_dir/tests/packaged_app_smoke.sh"
