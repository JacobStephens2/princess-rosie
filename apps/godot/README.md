# Godot Edition

This application is locked to Godot 4.7.2 Standard, GDScript, and Forward+ on Apple Silicon macOS.

## Run in the editor

Open `project.godot` with the exact 4.7.2 editor, or run:

```sh
/Applications/Godot.app/Contents/MacOS/Godot --path apps/godot
```

The application prepares the Edition Pack directly from `shared/edition/` before showing the cover and retains its revision. `shared/edition/` is the engine-neutral content and media store; presentation textures live separately under `assets/` so Godot can import them normally. Exporting stages every file the manifest declares into the application unmodified, under `res://edition`, so the packaged game reads the same bytes the editor does. See `addons/edition_pack_export/`.

## Verify

Run the focused public-seam acceptance suite:

```sh
npm run test:godot
apps/godot/tests/export_smoke.sh
```

The export smoke test uses the official universal 4.7.2 debug template, thins the packaged executable to arm64, signs it ad hoc, and launches it with network access denied. It verifies the opening, active flight, continuous Lacewood Flight Control, and complete Lacewood-to-Birthday-Star semantic evidence and Storybook Stage captures under `build/`.

Zélie's Lacewood is one uninterrupted picture-book corridor. Stella moves forward automatically for roughly eighteen seconds while holding Space or the pointer raises her and releasing settles her immediately. Silver ribbons and rose lights respond at different heights, the Bump Floor along the bottom of the corridor wobbles her if she settles all the way onto it, and every flight continues to the guaranteed Birthday Star without a fork or timing window.

A Playful Bump only rocks Stella, and nothing follows from meeting several: every bump is a lone wobble. There is one game mode, so nothing about the flight changes because of anything that happened earlier in the journey. The Bump Floor is declared as a margin above the lowest reachable height, and the journey refuses to launch if it would leave any rung of any place's Altitude Ladder without a height clear of it — so every delight stays flyable without bumping. Swooping close to the floor and rising away without touching it earns a Near Miss, which is the one response in the journey earned by flying well, and it answers in every place including those whose floor does not bump. See [ADR-0013](../../docs/adr/0013-keep-one-game-mode-and-answer-low-flight-with-a-floor.md).

## Hear the offline Soundscape tracer

On the target MacBook, run the audible acceptance harness without `--headless`:

```sh
/Applications/Godot.app/Contents/MacOS/Godot --path apps/godot --script res://tests/soundscape_offline_acceptance.gd
```

It starts the bundled instrumental through the shared mixer, reports and plays approved cues from the immutable Edition Pack, then reports the same semantic confirmation against an intentionally missing asset and plays the locally synthesized fallback. The harness makes no network request. The automated acceptance suite separately drives Space and pointer Flight Control, high and low Lacewood responses, the capped proximity cue, the Bump Floor and its earned Near Miss, Birthday Star gathering, Rainbow Path travel, and Gram's combined Birthday Star Moment.
