# Godot Edition release

Use this runbook to construct, verify, and later publish a private Godot Edition
Release Candidate. Construction is local and never publishes. Credentialed
signing, notarization, and `gh release` remain separate steps. See ADR-0017
and ADR-0018.

The Phaser Edition at [rosi.stephens.page](https://rosi.stephens.page/) is a
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
artifact. Finder launch, packaged visual smoke, audio judgment, signing, and
publication remain target-MacBook gates on the verification issue. The
publication archive for `gh release` is still built on the target MacBook.

## 1. Construct the archive

Start from a clean working tree at the intended revision. For the GitHub
candidate that is the exact green `origin/main` commit.

```sh
apps/godot/packaging/build_release_archive.sh v1.0.0-rc.1
```

To construct from a clean revision that is not `origin/main` (a pull request
or a local packaging check), name that revision:

```sh
apps/godot/packaging/build_release_archive.sh v1.0.0-rc.1 \
  --source-revision "$(git rev-parse HEAD)"
```

The command refuses an unsupported or malformed version, a dirty or unintended
source revision, missing Godot 4.7.2 / export-template / notice / icon
prerequisites, unresolved runtime references, and forbidden development-pack
contents. It uses the `macOS Release` preset and does not read Apple or GitHub
credentials.

It writes, without uploading:

- `apps/godot/build/release/Princess-Rosie-v1.0.0-rc.1-macOS.zip`
- `apps/godot/build/release/Princess-Rosie-v1.0.0-rc.1-macOS.zip.sha256`

The ZIP top level is `Princess Rosie.app`, `NOTICE.txt`, and
`THIRD-PARTY-NOTICES.txt`.

Inspect construction without launching:

```sh
apps/godot/tests/release_archive_inspection.sh
```

## 2. Verify the checksum and unzip

```sh
cd apps/godot/build/release
shasum -a 256 -c Princess-Rosie-v1.0.0-rc.1-macOS.zip.sha256
mkdir -p unpacked
ditto -x -k Princess-Rosie-v1.0.0-rc.1-macOS.zip unpacked
```

`ditto` preserves the executable bit, bundle structure, and icon. Confirm
`unpacked/Princess Rosie.app` opens as an application bundle.

Exercise the unzipped archive with the same deny-network whole-journey smoke
as the development export. This complements `apps/godot/tests/export_smoke.sh`
and does not replace it:

```sh
apps/godot/tests/release_archive_smoke.sh v1.0.0-rc.1
```

## 3. Open an unsigned Release Candidate

Private Release Candidates may remain unsigned (ADR-0018). macOS Gatekeeper
will not treat the downloaded app as signed.

On the target MacBook:

1. Verify the checksum of the downloaded ZIP, then unzip with `ditto` as above.
2. In Finder, Control-click `Princess Rosie.app` and choose **Open**.
3. Confirm the warning and open the app.
4. If macOS still blocks it, open **System Settings → Privacy & Security**,
   find the blocked-app message, and choose **Open Anyway**.

Do not disable Gatekeeper globally. Escape exits the game.

Owner Finder/Dock icon approval, packaged visual judgment, audio judgment, and
this unsigned launch remain human gates on the verification issue. They do not
replace the automated archive inspection.

## 4. Upload, download, and verify a GitHub asset

Construction does not publish. Publication of `v1.0.0-rc.1` is a later
deliberate `gh release` step on the verification issue:

1. Tag only the exact freshly green `origin/main` commit. The tag never moves.
2. Publish a prerelease (not a draft) whose notes start with
   `Status: awaiting owner acceptance` and distinguish the supported
   Apple Silicon target from packaged but unverified Intel compatibility
   (ADR-0016).
3. Attach the ZIP and the `.sha256` file under those exact names.
4. Download both assets through GitHub. Do not reuse the locally built copies
   as the acceptance artifact.
5. Verify the downloaded checksum with `shasum -a 256 -c` before unzipping.
6. Unzip, open through the unsigned flow above, and play the full journey and
   Fly Again.

## 5. Replace assets before acceptance

A candidate's Git tag stays fixed. Notes and packaging-only assets may be
replaced before owner acceptance, with a new checksum and an explicit
replacement note in the release. A code change requires a new RC tag.

If a code change supersedes an unaccepted candidate, remove the large archive
to conserve storage. Keep the tag, the release entry, the checksum, and a
pointer to the replacement candidate. See ADR-0017.

Owner acceptance freezes that candidate's notes and assets.

## 6. Future credentialed signing and notarization

Stable `v1.0.0` must be signed with a Developer ID Application identity,
notarized by Apple, and accepted again as a downloaded artifact. Signing
changes the bytes, so a signed candidate is a new RC even when it comes from
the same tag's source revision.

The project owner retains Apple credentials and completes account or keychain
steps the release command cannot perform. The construction command must stay
usable without those credentials. See ADR-0018.
