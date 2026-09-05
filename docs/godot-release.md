# Godot Edition release

Use this runbook to construct, verify, and later publish a private Godot Edition
Release Candidate. Construction is local and never publishes. Credentialed
signing, notarization, and `gh release` remain separate steps. See ADR-0017
and ADR-0018.

The Web Edition at [rosie.stephens.page](https://rosie.stephens.page/) is a
different artifact. Its evidence is the `Deploy production` workflow in
`.github/workflows/deploy.yml`. Do not treat that workflow as Godot Edition
release evidence.

Godot Edition construction evidence is the `Verify Godot Edition` workflow in
`.github/workflows/verify-godot.yml`. It runs on relevant pull requests and
`main`, installs and checks Godot 4.7.2 Standard, runs the headless acceptance
suite, and performs Runtime Edition Pack, release-export, and static archive
inspections that do not need Finder. Those inspections may construct the ZIP
in order to list it, checksum it, and prove forbidden content is absent.
That construction is inspection, not publication. The workflow never publishes
a GitHub Release and does not upload the large app archive as an Actions
artifact. Finder launch, packaged visual smoke, audio judgment, ad-hoc signing,
and publication remain target-MacBook gates on the verification issue. The
publication archive for `gh release` is still repaired and verified on the
target MacBook.

## 1. Construct the archive

Start from a clean working tree at the intended revision. The Birthday Castle
Approach game changes require the next candidate tag; fixed `v1.0.0-rc.1` cannot be
rebuilt with them. For the next GitHub candidate, use the exact green
`origin/main` commit:

```sh
apps/godot/packaging/build_release_archive.sh v1.0.0-rc.2
```

To construct from a clean revision that is not `origin/main` (a pull request
or a local packaging check), name that revision:

```sh
apps/godot/packaging/build_release_archive.sh v1.0.0-rc.2 \
  --source-revision "$(git rev-parse HEAD)"
```

The command refuses an unsupported or malformed version, a dirty or unintended
source revision, missing Godot 4.7.2 / export-template / notice / icon
prerequisites, unresolved runtime references, and forbidden development-pack
contents, and an existing version tag that points at different game bytes. It
uses the `macOS Release` preset and does not read Apple or GitHub credentials.
It also does not sign: CI may construct this unsigned inspection ZIP without
crossing a target-Mac publication gate.

It writes, without uploading:

- `apps/godot/build/release/Princess-Rosie-v1.0.0-rc.2-macOS.zip`
- `apps/godot/build/release/Princess-Rosie-v1.0.0-rc.2-macOS.zip.sha256`

The ZIP top level is `Princess Rosie.app`, `NOTICE.txt`, and
`THIRD-PARTY-NOTICES.txt`.

Inspect construction without launching:

```sh
apps/godot/tests/release_archive_inspection.sh
```

Do not publish the construction ZIP directly. The assembled app still carries
the official template's now-invalid signature and must pass through the
target-Mac repair below.

## 2. Repackage the candidate on the target MacBook

The repackage command accepts archive bytes rather than a source checkout. It
verifies the adjacent source checksum, preserves the packaged game bytes,
replaces the invalid template signature with a credential-free ad-hoc
signature, and writes a deterministic candidate ZIP and checksum.

For a new code-bearing candidate, first create its annotated tag on the exact
green source commit. The tag is immutable; the command verifies it to derive
the deterministic archive timestamp. Do not create or move a tag for a local
packaging experiment.

```sh
apps/godot/packaging/repackage_release_candidate.sh \
  v1.0.0-rc.2 \
  apps/godot/build/release/Princess-Rosie-v1.0.0-rc.2-macOS.zip \
  apps/godot/build/candidate
```

The command requires a clean implementation at `origin/main`. For a local
check of a reviewed commit that has not landed, name it explicitly with
`--command-revision "$(git rev-parse HEAD)"`.

For a packaging-only replacement on an existing fixed tag, use the original
ZIP and `.sha256` downloaded from that GitHub Release as the input. Do not
rebuild from the current checkout: a game-code change requires a new RC tag.
The command verifies the tag but neither moves it nor rebuilds game code. It
does not publish or modify its source archive.

Inspect this target-only step twice for determinism and unchanged PCK bytes:

```sh
apps/godot/tests/release_candidate_repackage_inspection.sh \
  v1.0.0-rc.1 \
  /path/to/downloaded/Princess-Rosie-v1.0.0-rc.1-macOS.zip
```

This inspection invokes ad-hoc signing and therefore is not part of
`.github/workflows/verify-godot.yml`.

## 3. Verify the checksum and unzip

```sh
cd apps/godot/build/candidate
shasum -a 256 -c Princess-Rosie-v1.0.0-rc.2-macOS.zip.sha256
mkdir -p unpacked
ditto -x -k Princess-Rosie-v1.0.0-rc.2-macOS.zip unpacked
```

`ditto` preserves the executable bit, bundle structure, and icon. Confirm
`unpacked/Princess Rosie.app` opens as an application bundle.

Exercise the unzipped archive with the same deny-network whole-journey smoke
as the development export. This complements `apps/godot/tests/export_smoke.sh`
and does not replace it:

```sh
ROSIE_RELEASE_ARCHIVE_DIR="$PWD/apps/godot/build/candidate" \
  apps/godot/tests/release_archive_smoke.sh v1.0.0-rc.2
```

## 4. Open a Release Candidate without Developer ID signing

Private Release Candidates do not require Apple distribution credentials
(ADR-0018). Target-Mac repackaging replaces the invalid leftover Godot
export-template signature with a credential-free ad-hoc signature. That gives
macOS valid local integrity metadata, but no Developer ID identity: Gatekeeper
still rejects an ordinary quarantined launch and offers the Control-click
opening flow instead of calling the bundle damaged.

On the target MacBook:

1. Verify the checksum of the downloaded ZIP, then unzip with `ditto` as above.
2. In Finder, Control-click `Princess Rosie.app` and choose **Open**.
3. Confirm the warning and open the app.
4. If macOS still blocks it, open **System Settings → Privacy & Security**,
   find the blocked-app message, and choose **Open Anyway**.

Do not disable Gatekeeper globally. Escape exits the game.

Owner Finder/Dock icon approval, packaged visual judgment, audio judgment, and
this untrusted launch remain human gates on the verification issue. They do not
replace the automated archive inspection.

## 5. Upload, download, and verify a GitHub asset

Construction and repackaging do not publish. Publication of `v1.0.0-rc.2` is
a later deliberate `gh release` step on the verification issue:

1. Push the already-created tag. Confirm that it still points at the exact
   freshly green `origin/main` commit; the tag never moves.
2. Publish a prerelease (not a draft) whose notes start with
   `Status: awaiting owner acceptance` and distinguish the supported
   Apple Silicon target from packaged but unverified Intel compatibility
   (ADR-0016).
3. Attach the repaired candidate ZIP and its `.sha256` file under those exact
   names.
4. Download both assets through GitHub. Do not reuse the locally built copies
   as the acceptance artifact.
5. Verify the downloaded checksum with `shasum -a 256 -c` before unzipping.
6. Unzip, open through the Control-click flow above, and play the full journey
   and Fly Again.

## 6. Replace assets before acceptance

A candidate's Git tag stays fixed. Notes and packaging-only assets may be
replaced before owner acceptance, with a new checksum and an explicit
replacement note in the release. A code change requires a new RC tag.
For a packaging-only replacement, repackage the downloaded candidate bytes and
use the target-Mac inspection to prove the packaged-game bytes are unchanged.
That is the only permissible same-tag replacement for fixed `v1.0.0-rc.1`;
the Birthday Castle Approach game change belongs to `v1.0.0-rc.2` or later.

If a code change supersedes an unaccepted candidate, remove the large archive
to conserve storage. Keep the tag, the release entry, the checksum, and a
pointer to the replacement candidate. See ADR-0017.

Owner acceptance freezes that candidate's notes and assets.

## 7. Future credentialed signing and notarization

Stable `v1.0.0` must be signed with a Developer ID Application identity,
notarized by Apple, and accepted again as a downloaded artifact. Signing
changes the bytes, so a signed candidate is a new RC even when it comes from
the same tag's source revision.

The project owner retains Apple credentials and completes account or keychain
steps the release command cannot perform. The construction command must stay
usable without those credentials. See ADR-0018.
