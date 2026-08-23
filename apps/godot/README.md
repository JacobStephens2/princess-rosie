# Godot Production Edition

This application is locked to Godot 4.7.2 Standard, GDScript, and Forward+ on Apple Silicon macOS.

## Run in the editor

Open `project.godot` with the exact 4.7.2 editor, or run:

```sh
/Applications/Godot.app/Contents/MacOS/Godot --path apps/godot
```

The application prepares `edition-pack.zip` against the binding in `edition-pack.digest` before showing the cover and retains that exact Edition Contract digest. The ZIP is a byte-for-byte bundle of the immutable files under `shared/edition/`; presentation textures live separately under `assets/` so Godot can import them normally.

## Verify

Run the focused public-seam acceptance suite:

```sh
npm run test:godot
apps/godot/tests/export_smoke.sh
```

The export smoke test uses the official universal 4.7.2 debug template, thins the packaged executable to arm64, signs it ad hoc, launches it with network access denied, and verifies both opening and complete Lacewood-to-Birthday-Star semantic evidence and Storybook Stage captures under `build/`.

## Hear the offline Soundscape tracer

On the target MacBook, run the audible acceptance harness without `--headless`:

```sh
/Applications/Godot.app/Contents/MacOS/Godot --path apps/godot --script res://tests/soundscape_offline_acceptance.gd
```

It starts the bundled instrumental through the shared mixer, reports and plays approved cues from the immutable Edition Pack, plays the Golden Bell Abbey courtyard ambience, its responsive bell phrase, a Playful Bump and near miss, and Pop's Birthday Star Moment, then reports the same semantic confirmation against an intentionally missing asset and plays the locally synthesized fallback. The harness makes no network request. It is also the harness for the required MacBook built-in speaker and headphone listening pass.

The automated acceptance suite separately drives both Lacewood routes, Journey History shimmer, the capped proximity cue, three-bump Cloud Rest and resume, Birthday Star gathering, Rainbow Path travel, Gram's Birthday Star Moment, and then the complete Golden Bell Abbey vignette through to Pop's Birthday Star Moment and the celebration.
