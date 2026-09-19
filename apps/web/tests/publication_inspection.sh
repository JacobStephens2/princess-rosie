#!/usr/bin/env bash
set -euo pipefail

# In-repo contract for publication (issue #183, issue #184, issue #186, issue #189, ADR-0025, ADR-0026).
# Uses grep and python3 so `npm run check` works on GitHub-hosted Ubuntu runners.
# git ls-files names the tracked-file set; git show reads origin/main's glossary.
# --history additionally walks reachable objects of a clone (issue #189).

usage() {
  echo "usage: $0 [--history] [repo]" >&2
  exit 2
}

check_history=false
target_repo=""
while (($# > 0)); do
  case "$1" in
    --history)
      check_history=true
      shift
      ;;
    -*)
      usage
      ;;
    *)
      [[ -z "$target_repo" ]] || usage
      target_repo="$1"
      shift
      ;;
  esac
done

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
if [[ -n "$target_repo" ]]; then
  repo_root="$(cd "$target_repo" && pwd)"
fi
license="$repo_root/LICENSE"
media_terms="$repo_root/MEDIA-TERMS.md"
godot_notice="$repo_root/apps/godot/notices/NOTICE.txt"
skills_notice="$repo_root/.agents/skills/LICENSE"
readme="$repo_root/README.md"
contributing="$repo_root/CONTRIBUTING.md"
tracker="$repo_root/docs/agents/issue-tracker.md"
context="$repo_root/CONTEXT.md"
adr_0014="$repo_root/docs/adr/0014-package-only-player-facing-files-in-release-builds.md"
adr_0017="$repo_root/docs/adr/0017-allow-pre-acceptance-candidate-assets-to-be-replaced.md"
adr_0025="$repo_root/docs/adr/0025-publish-the-development-record.md"
adr_0026="$repo_root/docs/adr/0026-license-code-under-mit-and-keep-media-view-only.md"
adr_0027="$repo_root/docs/adr/0027-approve-mureka-as-a-non-us-provider-exception.md"
mureka_research="$repo_root/docs/research/mureka-distribution-rights.md"
publication_runbook="$repo_root/docs/publication.md"
rewrite_script="$repo_root/tools/rewrite-publication-history.sh"
root_manifest="$repo_root/package.json"
web_manifest="$repo_root/apps/web/package.json"
soundscape_manifest="$repo_root/tools/soundscape-build/package.json"
media_prepare_manifest="$repo_root/tools/media-prepare/package.json"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

has() {
  grep -F -q -- "$1" "$2"
}

test -f "$license" || fail "LICENSE is missing"
test -f "$media_terms" || fail "MEDIA-TERMS.md is missing"
test -f "$godot_notice" || fail "the Godot Edition notice is missing"
test -f "$skills_notice" || fail "the vendored skills MIT notice is missing"
test -f "$readme" || fail "README.md is missing"
test -f "$contributing" || fail "CONTRIBUTING.md is missing"
test -f "$tracker" || fail "the tracker documentation is missing"
test -f "$context" || fail "CONTEXT.md is missing"
test -f "$adr_0014" || fail "ADR-0014 is missing"
test -f "$adr_0017" || fail "ADR-0017 is missing"
test -f "$adr_0025" || fail "ADR-0025 is missing"
test -f "$adr_0026" || fail "ADR-0026 is missing"
test -f "$adr_0027" || fail "ADR-0027 is missing"
test -f "$mureka_research" || fail "docs/research/mureka-distribution-rights.md is missing"
has "written confirmation" "$mureka_research" \
  || fail "docs/research/mureka-distribution-rights.md does not record Mureka's written confirmation"
has "does not constitute a violation of Section 4.1" "$mureka_research" \
  || fail "docs/research/mureka-distribution-rights.md does not record that publishing Output does not violate API Service Agreement §4.1"
test -f "$publication_runbook" || fail "docs/publication.md is missing"
test -f "$rewrite_script" || fail "the history rewrite script is missing"
test -f "$root_manifest" || fail "the root package manifest is missing"
test -f "$web_manifest" || fail "the Web Edition package manifest is missing"
test -f "$soundscape_manifest" || fail "the soundscape-build package manifest is missing"
test -f "$media_prepare_manifest" || fail "the media-prepare package manifest is missing"

has "MIT License" "$license" \
  || fail "LICENSE is not an MIT license"
has "Permission is hereby granted" "$license" \
  || fail "LICENSE is missing the MIT permission grant"

has "all rights reserved" "$media_terms" \
  || fail "MEDIA-TERMS.md does not keep the media all rights reserved"
has "view-only" "$media_terms" \
  || fail "MEDIA-TERMS.md does not keep the media view-only"
has "machine-learning training" "$media_terms" \
  || fail "MEDIA-TERMS.md does not forbid machine-learning training"
has "shared/" "$media_terms" \
  || fail "MEDIA-TERMS.md does not name the shared edition media tree"
has "apps/web/public/assets" "$media_terms" \
  || fail "MEDIA-TERMS.md does not name the Web Edition public assets"
has "built site" "$media_terms" \
  || fail "MEDIA-TERMS.md does not name the built site"

if has "deferred" "$godot_notice"; then
  fail "the Godot Edition notice still uses deferred-audit language"
fi
has "archived" "$godot_notice" \
  || fail "the Godot Edition notice does not describe the archived edition"
has "MIT" "$godot_notice" \
  || fail "the Godot Edition notice does not follow the MIT code terms"
has "media terms" "$godot_notice" \
  || fail "the Godot Edition notice does not follow the media terms"

has "Copyright (c) 2026 Matt Pocock" "$skills_notice" \
  || fail "the vendored skills notice is missing Matt Pocock's copyright line"
has "MIT License" "$skills_notice" \
  || fail "the vendored skills notice is not the mattpocock/skills MIT text"

has "](LICENSE)" "$readme" \
  || fail "README.md does not link the license"
has "](MEDIA-TERMS.md)" "$readme" \
  || fail "README.md does not link the media terms"

has "**PRs as a request surface: yes.**" "$tracker" \
  || fail "the tracker documentation does not flag external pull requests as a request surface"

has "Her full given name" "$context" \
  || fail "CONTEXT.md Princess Zélie glossary no longer withholds her full given name"

has "superseded in part by ADR-0025" "$adr_0014" \
  || fail "ADR-0014 is missing its ADR-0025 status note"
has "amended by ADR-0025" "$adr_0017" \
  || fail "ADR-0017 is missing its ADR-0025 status note"
has "Publish the development record" "$adr_0025" \
  || fail "ADR-0025 does not record the decision to publish"
has "License code under MIT" "$adr_0026" \
  || fail "ADR-0026 does not record the split license"
has "Approve Mureka as a non-US provider exception" "$adr_0027" \
  || fail "ADR-0027 does not record the Mureka exception"

has "tools/rewrite-publication-history.sh" "$publication_runbook" \
  || fail "docs/publication.md does not name the rewrite script"
has "--throwaway-clone" "$publication_runbook" \
  || fail "docs/publication.md does not require a throwaway clone"
has "publication_inspection.sh --history" "$publication_runbook" \
  || fail "docs/publication.md does not run the publication inspection history flag"
has "#190" "$publication_runbook" \
  || fail "docs/publication.md does not name issue #190 as the rewrite gate"
has "#191" "$publication_runbook" \
  || fail "docs/publication.md does not name issue #191 as the visibility gate"
has 'commented "go"' "$publication_runbook" \
  || fail "docs/publication.md does not gate irreversible steps on the owner's go"
has "v1.0.0-rc.1" "$publication_runbook" \
  || fail "docs/publication.md does not name release-candidate tag v1.0.0-rc.1"
has "v1.0.0-rc.2" "$publication_runbook" \
  || fail "docs/publication.md does not name release-candidate tag v1.0.0-rc.2"
has "v1.0.0-rc.3" "$publication_runbook" \
  || fail "docs/publication.md does not name release-candidate tag v1.0.0-rc.3"
has "gh release edit" "$publication_runbook" \
  || fail "docs/publication.md does not update release notes"
has "--visibility public" "$publication_runbook" \
  || fail "docs/publication.md does not change repository visibility to public"
has "--accept-visibility-change-consequences" "$publication_runbook" \
  || fail "docs/publication.md does not accept visibility-change consequences"
has "vulnerability-alerts" "$publication_runbook" \
  || fail "docs/publication.md does not enable Dependabot alerts"
has "automated-security-fixes" "$publication_runbook" \
  || fail "docs/publication.md does not enable Dependabot security updates"
has "secret_scanning_push_protection" "$publication_runbook" \
  || fail "docs/publication.md does not enable secret-scanning push protection"
has "environments/production" "$publication_runbook" \
  || fail "docs/publication.md does not require a reviewer on the production environment"
has "git-filter-repo" "$publication_runbook" \
  || fail "docs/publication.md does not name git-filter-repo"
has "apps/godot/edition-pack.zip" "$publication_runbook" \
  || fail "docs/publication.md does not name the edition-pack archive path"

has "--throwaway-clone" "$rewrite_script" \
  || fail "the history rewrite script does not require --throwaway-clone"
has "apps/godot/edition-pack.zip" "$rewrite_script" \
  || fail "the history rewrite script does not drop the edition-pack archive"
has "--replace-message" "$rewrite_script" \
  || fail "the history rewrite script does not replace the full given name in commit and tag messages"

python3 - "$root_manifest" "$web_manifest" "$soundscape_manifest" "$media_prepare_manifest" <<'PY' \
  || fail "the root and workspace manifests do not declare the MIT license"
import json, sys
for path in sys.argv[1:]:
    data = json.load(open(path))
    if data.get("license") != "MIT":
        raise SystemExit(1)
PY

python3 - "$repo_root" <<'PY' || fail "a forbidden publication string is present in a tracked file"
import re, subprocess, sys

repo_root = sys.argv[1]
# Pieces are not the name; do not concatenate them in comments or commits.
encoded = "".join(chr(n) for n in (
    65, 122, 233, 108, 105, 101,
))
placeholder = "Her full given name"
try:
    glossary = subprocess.check_output(
        ["git", "-C", repo_root, "show", "origin/main:CONTEXT.md"],
        text=True,
        stderr=subprocess.DEVNULL,
    )
    match = re.search(
        r"\*\*Princess Zélie\*\*:.*?\n_Avoid_:\s*([^,\n]+)",
        glossary,
        re.S,
    )
    if match:
        candidate = match.group(1).strip()
        if (
            candidate
            and encoded not in candidate
            and placeholder not in candidate
        ):
            print(
                "FAIL: origin/main's Avoid token is neither the placeholder nor the encoded given name",
                file=sys.stderr,
            )
            raise SystemExit(1)
except subprocess.CalledProcessError:
    pass
given_name = encoded.encode("utf-8")
private_family = " ".join(("private", "family")).encode("ascii")
# Pieces are not the path; do not concatenate them in comments or commits.
macos_home = bytes(n for n in (47, 85, 115, 101, 114, 115, 47))
linux_home = bytes(n for n in (47, 104, 111, 109, 101, 47))
hits = {
    "the full given name": [],
    "the private-family wording": [],
    "an absolute home-directory path": [],
}

listed = subprocess.check_output(["git", "-C", repo_root, "ls-files", "-z"])
for raw in listed.split(b"\0"):
    if not raw:
        continue
    path = raw.decode()
    try:
        data = open(f"{repo_root}/{path}", "rb").read()
    except OSError:
        continue
    if given_name in data:
        hits["the full given name"].append(path)
    if private_family in data.lower():
        hits["the private-family wording"].append(path)
    if macos_home in data or linux_home in data:
        hits["an absolute home-directory path"].append(path)

failed = False
for label, paths in hits.items():
    if paths:
        failed = True
        print(f"FAIL: {label} is present in tracked files: {', '.join(paths)}", file=sys.stderr)
if failed:
    raise SystemExit(1)
PY

python3 - "$repo_root" <<'PY' || fail "a Web Edition soundtrack piece has no Mureka provenance record"
import json, subprocess, sys
from pathlib import Path

repo_root = Path(sys.argv[1])
listed = subprocess.check_output(
    ["git", "-C", str(repo_root), "ls-files", "-z", "--", "apps/web/public/assets/audio"],
)
mp3s = sorted(
    raw.decode()
    for raw in listed.split(b"\0")
    if raw.endswith(b".mp3")
)
if not mp3s:
    print("FAIL: the Web Edition audio assets have no soundtrack pieces", file=sys.stderr)
    raise SystemExit(1)

provenance_path = repo_root / "shared" / "edition" / "soundscape" / "provenance.json"
try:
    provenance = json.loads(provenance_path.read_text())
except (OSError, json.JSONDecodeError):
    print("FAIL: the soundscape provenance schema is missing or invalid", file=sys.stderr)
    raise SystemExit(1)

covered = set()
for record in provenance.get("records") or []:
    if not isinstance(record, dict):
        continue
    role = str(record.get("role", ""))
    provider = str(record.get("provider", "")).lower()
    asset = str(record.get("asset", "")).replace("\\", "/")
    if role != "provenance.commercial-generated-soundtrack":
        continue
    if "mureka" not in provider or not asset:
        continue
    covered.add(asset)

missing = [path for path in mp3s if path not in covered]
if missing:
    print(
        "FAIL: Web Edition soundtrack pieces have no Mureka provenance record: "
        + ", ".join(missing),
        file=sys.stderr,
    )
    raise SystemExit(1)
PY

if $check_history; then
  python3 - "$repo_root" <<'PY' || fail "publication history is not clean"
import subprocess
import sys

repo_root = sys.argv[1]
# Pieces are not the name; do not concatenate them in comments or commits.
encoded = "".join(chr(n) for n in (
    65, 122, 233, 108, 105, 101,
)).encode("utf-8")
archive_path = b"apps/godot/edition-pack.zip"
tags = ("v1.0.0-rc.1", "v1.0.0-rc.2", "v1.0.0-rc.3")
failed = False

for tag in tags:
    try:
        subprocess.check_output(
            ["git", "-C", repo_root, "rev-parse", "--verify", f"{tag}^{{commit}}"],
            stderr=subprocess.DEVNULL,
        )
    except subprocess.CalledProcessError:
        print(f"FAIL: release-candidate tag {tag} does not resolve", file=sys.stderr)
        failed = True

listed = subprocess.check_output(
    ["git", "-C", repo_root, "rev-list", "--objects", "--all"]
)
archive_hits = False
for line in listed.splitlines():
    path = line.split(b" ", 1)[1] if b" " in line else b""
    if path == archive_path:
        archive_hits = True
        break
if archive_hits:
    print("FAIL: the edition-pack archive is present in history", file=sys.stderr)
    failed = True

commits = subprocess.check_output(
    ["git", "-C", repo_root, "rev-list", "--all"]
).split()
name_hits = False
if commits:
    grep = subprocess.run(
        [
            "git",
            "-C",
            repo_root,
            "grep",
            "-F",
            "-q",
            "-e",
            encoded.decode(),
        ]
        + [c.decode() for c in commits],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    if grep.returncode == 0:
        name_hits = True

log = subprocess.check_output(
    ["git", "-C", repo_root, "log", "--all", "--format=%B"]
)
if encoded in log:
    name_hits = True

tags_listed = subprocess.check_output(
    [
        "git",
        "-C",
        repo_root,
        "for-each-ref",
        "--format=%(objectname) %(objecttype)",
        "refs/tags",
    ],
    text=True,
)
for line in tags_listed.splitlines():
    if not line.strip():
        continue
    oid, kind = line.split()
    if kind != "tag":
        continue
    body = subprocess.check_output(["git", "-C", repo_root, "cat-file", "tag", oid])
    if encoded in body:
        name_hits = True
        break

if name_hits:
    print("FAIL: the full given name is present in history", file=sys.stderr)
    failed = True

if failed:
    raise SystemExit(1)
PY
fi

echo "OK: publication contract"
