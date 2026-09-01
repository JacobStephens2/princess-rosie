#!/usr/bin/env bash
set -euo pipefail

# Require a valid ad-hoc signature with no trusted signing identity. An invalid
# Prehensile Tales signature makes Gatekeeper call a quarantined download damaged;
# no signature at all makes current macOS launchd refuse to spawn the executable.

app_path="${1:-}"
if [[ -z "$app_path" || ! -d "$app_path" ]]; then
	echo "FAIL: ad-hoc signature inspection is missing the application bundle: $app_path" >&2
	exit 1
fi

verify_status=0
verify_output="$(/usr/bin/codesign --verify --deep --strict "$app_path" 2>&1)" || verify_status=$?

if (( verify_status != 0 )); then
	echo "FAIL: the application does not have a valid ad-hoc signature: $verify_output" >&2
	exit 1
fi

signature_output="$(/usr/bin/codesign --display --verbose=4 "$app_path" 2>&1)"
if ! printf '%s\n' "$signature_output" | grep -F -q 'Signature=adhoc'; then
	echo "FAIL: the application is not ad-hoc signed: $signature_output" >&2
	exit 1
fi
if ! printf '%s\n' "$signature_output" | grep -F -q 'TeamIdentifier=not set'; then
	echo "FAIL: the application unexpectedly has a signing-team identity: $signature_output" >&2
	exit 1
fi

assessment_status=0
spctl_output="$(/usr/sbin/spctl --assess --type execute --verbose=4 "$app_path" 2>&1)" \
	|| assessment_status=$?
if (( assessment_status == 0 )); then
	echo "FAIL: Gatekeeper unexpectedly trusts the ad-hoc-signed application" >&2
	exit 1
fi
if printf '%s\n' "$spctl_output" | grep -qi 'signature indicates they must be present'; then
	echo "FAIL: Gatekeeper still sees a leftover export-template signature: $spctl_output" >&2
	exit 1
fi
