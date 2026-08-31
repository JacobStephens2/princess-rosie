#!/usr/bin/env bash
set -euo pipefail

# Refuse a packaged PCK that still contains development Edition Pack records.

pck_path="${1:-}"
if [[ -z "$pck_path" || ! -s "$pck_path" ]]; then
  echo "FAIL: packaged PCK is missing: $pck_path" >&2
  exit 1
fi

fail_if_present() {
  local needle="$1"
  local label="$2"
  if rg -a -q -- "$needle" "$pck_path"; then
    echo "FAIL: packaged PCK contains $label" >&2
    exit 1
  fi
}

fail_if_present 'Jacob Stephens' 'Jacob Stephens'
fail_if_present 'long straight dirty-blonde hair' 'a family appearance prompt'
fail_if_present 'written appearance cues' 'family appearance provenance'
fail_if_present 'ownerManualReviewBy' 'owner review provenance'
fail_if_present 'traceId' 'a provider trace identifier'
fail_if_present 'providerReportedUsage' 'provider usage records'
fail_if_present 'source-media/soundscape/masters/' 'excluded soundscape master paths'
fail_if_present 'catalog-state/' 'catalog-state records'
fail_if_present 'runtime-imports/' 'runtime-import records'
fail_if_present 'source-media/lacewood/lacewood-background.png' 'the unused Lacewood master illustration'

require_present() {
  local needle="$1"
  if ! rg -a -q -- "$needle" "$pck_path"; then
    echo "FAIL: packaged PCK is missing required runtime reference: $needle" >&2
    exit 1
  fi
}

require_present 'edition/content.json'
require_present 'edition/media.json'
require_present 'source-media/flight/rosie-stella.png'
require_present 'source-media/journey/birthday-star.png'
