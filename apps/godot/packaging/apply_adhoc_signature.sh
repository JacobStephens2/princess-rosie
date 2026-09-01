#!/usr/bin/env bash
set -euo pipefail

# Godot's official macOS template is signed by Prehensile Tales B.V. Assembling
# the Runtime Edition Pack and icon invalidates that signature. Replace it with
# a credential-free ad-hoc signature so launchd accepts the executable while
# Gatekeeper still requires the documented Control-click opening flow (ADR-0018).

app_path="${1:-}"
if [[ -z "$app_path" || ! -d "$app_path" ]]; then
	echo "FAIL: missing application bundle to ad-hoc sign: $app_path" >&2
	exit 1
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
/usr/bin/codesign --remove-signature --deep "$app_path"
/usr/bin/codesign --force --deep --sign - "$app_path"
"$script_dir/inspect_adhoc_signature.sh" "$app_path"
