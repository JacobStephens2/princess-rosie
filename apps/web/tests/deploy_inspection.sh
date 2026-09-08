#!/usr/bin/env bash
set -euo pipefail

# In-repo contract for the Web Edition production deploy (issue #118, ADR-0022).
# Live HTTPS checks stay in the Deploy production workflow.
# Uses grep/python3 only so `npm run check` works on GitHub-hosted Ubuntu runners.

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
lockfile="$repo_root/package-lock.json"
workflow="$repo_root/.github/workflows/deploy.yml"
index_html="$repo_root/apps/web/index.html"
context="$repo_root/CONTEXT.md"
runbook="$repo_root/docs/deployment.md"
readme="$repo_root/README.md"
adr="$repo_root/docs/adr/0022-canonical-web-edition-hostname.md"
canonical='https://rosie.stephens.page/'
docroot='/var/www/rosie.stephens.page/public'

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

has() {
  grep -F -q -- "$1" "$2"
}

test -f "$lockfile" || fail "package-lock.json is missing"
test -f "$workflow" || fail "the Deploy production workflow is missing"
test -f "$index_html" || fail "apps/web/index.html is missing"
test -f "$context" || fail "CONTEXT.md is missing"
test -f "$runbook" || fail "docs/deployment.md is missing"
test -f "$readme" || fail "README.md is missing"
test -f "$adr" || fail "ADR-0022 is missing"

grep -q '^name: Deploy production$' "$workflow" \
  || fail "the production workflow is no longer named Deploy production"
has "ffmpeg" "$workflow" \
  || fail "the Deploy production workflow does not install ffmpeg for soundtrack DSP verification"

python3 - "$lockfile" <<'PY' || fail "package-lock.json workspaces are not apps/web, tools/soundscape-build, and tools/media-prepare"
import json, sys
lock = json.load(open(sys.argv[1]))
workspaces = lock.get("packages", {}).get("", {}).get("workspaces", [])
if workspaces != ["apps/web", "tools/soundscape-build", "tools/media-prepare"]:
    raise SystemExit(1)
if "apps/web" not in lock.get("packages", {}):
    raise SystemExit(1)
if lock["packages"]["apps/web"].get("name") != "princess-rosie-web":
    raise SystemExit(1)
if "apps/phaser-original" in lock.get("packages", {}):
    raise SystemExit(1)
PY

has "url: ${canonical}" "$workflow" \
  || fail "the production environment URL is not ${canonical}"
has "https://rosie.stephens.page/" "$workflow" \
  || fail "the live smoke tests do not hit rosie.stephens.page"
has "assets/storybook-rosie-stella-departure.webp" "$workflow" \
  || fail "the live smoke tests omit storybook-rosie-stella-departure.webp"
if has "storybook-rosi-stella-departure.webp" "$workflow"; then
  fail "the live smoke tests still request the retired rosi departure asset"
fi
has "https://rosi.stephens.page/" "$workflow" \
  || fail "the live smoke tests do not confirm HTTPS on the legacy rosi hostname"
has "http://rosi.stephens.page/" "$workflow" \
  || fail "the live smoke tests do not confirm HTTP on the legacy rosi hostname"

has "property=\"og:url\" content=\"${canonical}\"" "$index_html" \
  || fail "apps/web/index.html og:url is not ${canonical}"
has "rel=\"canonical\" href=\"${canonical}\"" "$index_html" \
  || fail "apps/web/index.html canonical href is not ${canonical}"

python3 - "$context" <<'PY' || fail "CONTEXT.md Web Edition still names a hostname"
from pathlib import Path
import sys, re
text = Path(sys.argv[1]).read_text()
match = re.search(r"\*\*Web Edition\*\*:\n(.*?)(?:\n_Avoid_|\n\n)", text, re.S)
if not match:
    raise SystemExit(1)
if "stephens.page" in match.group(1):
    raise SystemExit(1)
PY

has "$docroot" "$runbook" \
  || fail "docs/deployment.md does not use ${docroot}"
has "$canonical" "$runbook" \
  || fail "docs/deployment.md does not advertise ${canonical}"
has "$canonical" "$readme" \
  || fail "README.md does not advertise ${canonical}"

echo "OK: Web Edition production deploy contract"
