# Godot Edition

This application is locked to Godot 4.7.2 Standard, GDScript, and Forward+ on Apple Silicon macOS.

## Run in the editor

Open `project.godot` with the exact 4.7.2 editor, or run:

```sh
/Applications/Godot.app/Contents/MacOS/Godot --path apps/godot
```

The editor and development acceptance suite prepare the complete authoritative Edition Pack from `shared/edition/` before showing the cover and retain its revision. `shared/edition/` is the engine-neutral development store: approved play media sit beside prompts, provenance, provider records, catalog/build state, unused masters, and other reproducibility evidence.

Exporting derives a Runtime Edition Pack from that development tree instead of copying `shared/edition/**` wholesale. The derived pack contains only the content, tuning, illustrations, and sounds referenced during offline play, staged unmodified under `res://edition`, where the packaged game looks first. Prompts, provenance, provider identifiers and usage records, catalog/build state, runtime-import records, unused masters, and other development-only files stay out of the PCK. A private-family/no-redistribution notice and the required Godot and third-party notices are copied alongside the exported application. See ADR-0014 and `addons/edition_pack_export/`.

## Export and play

Build the local macOS application with the existing `macOS Development` preset by running:

```sh
apps/godot/tests/export_smoke.sh
```

The finished application is `apps/godot/build/Princess Rosie.app`. The private-family notice and Godot/third-party notices sit next to it in `apps/godot/build/` and inside the app bundle's Resources. Reveal the application in Finder and double-click it to play the same artifact the smoke test exercised. It opens on the cover in fullscreen; Escape exits. The cover's Grown-up Corner contains only Sound on/off and replay the story. The preset leaves project code signing disabled; the official template executable retains Godot's upstream signature, but the assembled application has no valid project signature and fails strict signature and Gatekeeper assessment. Notarization and distribution are intentionally out of scope. A full provider-terms/public-distribution audit remains deferred until a public release is planned.

## Release export

Godot Edition v1 uses a dedicated `macOS Release` preset that is separate from `macOS Development`. The release preset exports a universal binary with the official 4.7.2 release template, bundle short version `1.0.0`, no console wrapper, and the Princess Rosie app icon. It does not replace the development preset or `apps/godot/tests/export_smoke.sh`.

The supported release target is macOS 13 and newer on Apple Silicon, matching the MacBook on which artifacts are accepted. The application remains a universal binary, so Intel hardware is packaged, but Intel compatibility is not independently play-tested. See ADR-0016.

The Finder and Dock icon is composed only from the approved Princess Rosie-and-Stella cutout and golden Birthday Star already in the Edition Pack, placed on a sapphire jewel field. Rebuild it with `apps/godot/packaging/build_app_icon.sh`. Owner approval of that icon in Finder and the Dock is a Release Candidate gate, not a substitute for the automated inspection.

Inspect the release export without launching the app:

```sh
apps/godot/tests/release_export_inspection.sh
```

The inspection checks Info.plist, architectures, macOS 13 minimum-version metadata, that the official release template was used, and that the `.icns` is present with the required macOS icon sizes. The inspected application is `apps/godot/build/release/Princess Rosie.app`.

## Verify

Run the focused public-seam acceptance suite:

```sh
npm run test:godot
apps/godot/tests/export_smoke.sh
apps/godot/tests/release_export_inspection.sh
```

The export smoke test uses the official universal 4.7.2 debug template without app-specific signing. After export it inspects the PCK for surnames, family appearance prompts, provider trace identifiers, and excluded master/provenance paths, and checks that the release notices shipped alongside the app. It opens the application through macOS LaunchServices, the same path Finder uses, and requires the fullscreen cover within five seconds. It then completes the packaged journey under a deny-network sandbox while watching macOS denial events; a control probe first proves that the watcher can observe an attempted connection. The test verifies the Opening Storybook Moments, Space and primary-pointer Flight Control, every declared Place and its Birthday Star and Rainbow Path, six returning Rainbow Paths at the Birthday Castle with Dad's Castle Star already shining, the celebration, and Fly Again returning to a playable Rosalia's Rose Garden. Semantic evidence, network traces, and Storybook Stage captures are written under `build/`.

Issue #55 corrected the content model to six flyable Places, one Family Guest per Place, with Dad already waiting at the Birthday Castle. Those six Places plus the Birthday Castle are the seven journey locations. Six Birthday Stars scatter and open six Rainbow Paths; Dad keeps the Castle Star safe, already shining before the recovered Stars join it over the celebration. The packaging smoke asserts those counts explicitly instead of inventing a seventh Place passage that is absent from the Edition Pack.

On 2026-08-30 the packaged artifact was interactively launched through Finder twice: the Sound-on run reached the celebration and proved Fly Again, while the Sound-off run reached the celebration and proved Escape exits. The visual journey, Space, primary pointer, Grown-up Corner, and reset paths passed. This is not a substitute for the project owner's auditory authority. Before handing the game to a child, the owner must play once on MacBook speakers and once on headphones, intentionally earn a Near Miss, and confirm Flight Control feel, Playful Bump gentleness, Near Miss reassurance, audio-loop smoothness, Place distinction, and celebration warmth. Record completion against the affected selections in `docs/media-prompts.md` as required by `docs/agents/audio-evaluation.md`.

Zélie's Lacewood is one uninterrupted picture-book corridor. Stella moves forward automatically for roughly eighteen seconds while holding Space or the pointer raises her and releasing settles her immediately. Silver ribbons and rose lights respond at different heights, the Bump Floor along the bottom of the corridor wobbles her if she settles all the way onto it, and every flight continues to the guaranteed Birthday Star without a fork or timing window.

A Playful Bump only rocks Stella, and nothing follows from meeting several: every bump is a lone wobble. There is one game mode, so nothing about the flight changes because of anything that happened earlier in the journey. The Bump Floor is declared as a margin above the lowest reachable height, and the journey refuses to launch if it would leave any rung of any place's Altitude Ladder without a height clear of it — so every delight stays flyable without bumping. Swooping close to the floor and rising away without touching it earns a Near Miss, which is the one response in the journey earned by flying well, and it answers in every place including those whose floor does not bump. See [ADR-0013](../../docs/adr/0013-keep-one-game-mode-and-answer-low-flight-with-a-floor.md).

## Hear the offline Soundscape tracer

On the target MacBook, run the audible acceptance harness without `--headless`:

```sh
/Applications/Godot.app/Contents/MacOS/Godot --path apps/godot --script res://tests/soundscape_offline_acceptance.gd
```

It starts the bundled instrumental through the shared mixer, reports and plays approved cues from the immutable Edition Pack, then reports the same semantic confirmation against an intentionally missing asset and plays the locally synthesized fallback. The harness makes no network request. The automated acceptance suite separately drives Space and pointer Flight Control, high and low Lacewood responses, the capped proximity cue, the Bump Floor and its earned Near Miss, Birthday Star gathering, Rainbow Path travel, and Gram's combined Birthday Star Moment.
