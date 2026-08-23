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

The export smoke test uses the official universal 4.7.2 debug template, thins the packaged executable to arm64, signs it ad hoc, launches it with network access denied, and verifies the opening, the complete Lacewood-to-Birthday-Star sequence, and the Pellegrino Peak visit through the celebration as semantic evidence and Storybook Stage captures under `build/`.

## Hear the offline Soundscape tracer

On the target MacBook, run the audible acceptance harness without `--headless`:

```sh
/Applications/Godot.app/Contents/MacOS/Godot --path apps/godot --script res://tests/soundscape_offline_acceptance.gd
```

It starts the bundled instrumental through the shared mixer, reports and plays approved cues from the immutable Edition Pack, walks one complete Pellegrino Peak visit for the required MacBook-speaker listening pass, then reports the same semantic confirmation against an intentionally missing asset and plays the locally synthesized fallback. The harness makes no network request. The automated acceptance suite separately drives both Lacewood routes, Journey History shimmer, the capped proximity cue, three-bump Cloud Rest and resume, Birthday Star gathering, Rainbow Path travel, and Gram's Birthday Star Moment, then the crossfade onward into Pellegrino Peak: its cool breeze ambience, the one-button flower-petal updraft, its local Playful Bumps and near miss, and Aunt's open-air Birthday Star Moment before the celebration.
