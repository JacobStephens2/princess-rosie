#!/usr/bin/env bash
set -euo pipefail

# Packaging inspection for the distinct, non-publishing Godot Edition
# verification workflow and release-runbook CI evidence. CI may construct
# the ZIP in order to inspect it; that is not publication.

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
workflow="$repo_root/.github/workflows/verify-godot.yml"
deploy_workflow="$repo_root/.github/workflows/deploy.yml"
runbook="$repo_root/docs/godot-release.md"
acceptance="$repo_root/apps/godot/tests/run_acceptance.sh"
export_inspection="$repo_root/apps/godot/tests/release_export_inspection.sh"
pack_inspect="$repo_root/apps/godot/packaging/inspect_packaged_pck.sh"
pack_validate="$repo_root/apps/godot/packaging/validate_runtime_edition_pack.gd"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

forbid() {
  local needle="$1"
  local label="$2"
  if rg -n -- "$needle" "$workflow"; then
    fail "$label"
  fi
}

test -f "$deploy_workflow" || fail "the Phaser Deploy production workflow is missing"
rg -q '^name: Deploy production$' "$deploy_workflow" \
  || fail "the existing Phaser workflow is no longer named Deploy production"

test -f "$workflow" || fail "the distinct Godot verification workflow is missing"
test -f "$runbook" || fail "the Godot Edition release runbook is missing"
test -f "$acceptance" || fail "the headless Godot acceptance suite is missing"
test -f "$export_inspection" || fail "the release export inspection is missing"
test -f "$pack_inspect" || fail "the packaged PCK inspector is missing"
test -f "$pack_validate" || fail "the Runtime Edition Pack validator is missing"

rg -q '^name: Deploy production$' "$workflow" \
  && fail "the Godot workflow reuses the Phaser Deploy production name"

rg -q 'pull_request:' "$workflow" \
  || fail "the Godot workflow does not run on pull requests"
rg -q 'branches:' "$workflow" \
  || fail "the Godot workflow does not name a branch filter"
rg -q 'main' "$workflow" \
  || fail "the Godot workflow does not run on main"

rg -F -q 'apps/godot/**' "$workflow" \
  || fail "path filters omit Godot code and assets"
rg -q 'shared/\*\*|shared/edition/\*\*' "$workflow" \
  || fail "path filters omit shared Edition Pack inputs"
rg -F -q '.github/workflows/verify-godot.yml' "$workflow" \
  || fail "path filters omit the Godot workflow itself"

rg -q 'runs-on: macos-' "$workflow" \
  || fail "the Godot workflow does not use a macOS runner"

rg -F -q '4.7.2' "$workflow" \
  || fail "the Godot workflow does not pin Godot 4.7.2"
rg -q -- '--version' "$workflow" \
  || fail "the Godot workflow does not verify the installed Godot version"
if rg -n 'mono' -i "$workflow" | rg -v 'not.*mono|reject|forbid|without|Standard'; then
  fail "the Godot workflow installs Godot .NET instead of Standard"
fi

rg -q 'test:godot|run_acceptance\.sh' "$workflow" \
  || fail "the Godot workflow does not run the headless Godot acceptance suite"
rg -q 'validate_runtime_edition_pack' "$workflow" \
  || fail "the Godot workflow does not validate Runtime Edition Pack construction"
rg -q 'inspect_packaged_pck\.sh' "$workflow" \
  || fail "the Godot workflow does not run forbidden-content checks"
rg -q 'release_export_inspection\.sh' "$workflow" \
  || fail "the Godot workflow does not run release metadata checks"
rg -q 'release_archive_inspection\.sh' "$workflow" \
  || fail "the Godot workflow does not run static archive checks"

forbid 'packaged_app_smoke\.sh' \
  "the Godot workflow runs packaged visual smoke, which is a target-MacBook gate"
forbid 'export_smoke\.sh' \
  "the Godot workflow runs the Finder-launching development export smoke"
forbid 'release_archive_smoke\.sh' \
  "the Godot workflow runs the packaged release-archive smoke"
forbid 'gh release' \
  "the Godot workflow publishes a GitHub Release"
forbid 'upload-artifact' \
  "the Godot workflow uploads an Actions artifact"
forbid 'notarytool' \
  "the Godot workflow notarizes"
forbid 'codesign --sign' \
  "the Godot workflow signs with Apple credentials"
forbid 'contents: write' \
  "the Godot workflow is granted contents: write"

rg -q 'contents: read' "$workflow" \
  || fail "the Godot workflow is not limited to contents: read"

rg -F -q 'Deploy production' "$runbook" \
  || fail "the runbook does not name the Phaser Deploy production workflow"
rg -F -q 'verify-godot.yml' "$runbook" \
  || fail "the runbook does not name the Godot verification workflow"
rg -q 'not .*Godot Edition release evidence|Do not treat that workflow as Godot' "$runbook" \
  || fail "the runbook does not distinguish Phaser deployment from Godot CI evidence"
rg -q 'Actions artifact|upload' "$runbook" \
  || fail "the runbook does not say Godot CI does not upload the app archive"
rg -q 'construct.*ZIP.*inspect|inspect.*ZIP' "$runbook" \
  || fail "the runbook does not say Godot CI may construct the ZIP to inspect it"
rg -q 'publication archive' "$runbook" \
  || fail "the runbook does not keep the publication archive on the target MacBook"

echo "PASS: Godot CI workflow verifies construction on relevant PRs and main without publishing"
