# Godot Production Edition

This application is locked to Godot 4.7.2 Standard, GDScript, and Forward+ on Apple Silicon macOS.

## Run in the editor

Open `project.godot` with the exact 4.7.2 editor, or run:

```sh
/Applications/Godot.app/Contents/MacOS/Godot --path apps/godot
```

The application prepares `edition-pack.zip` before showing the cover and retains its exact Edition Contract digest. The ZIP is a byte-for-byte bundle of the immutable files under `shared/edition/`; presentation textures live separately under `assets/` so Godot can import them normally.

## Verify

Run each focused public-seam acceptance test:

```sh
/Applications/Godot.app/Contents/MacOS/Godot --headless --path apps/godot --script res://tests/edition_pack_acceptance.gd
/Applications/Godot.app/Contents/MacOS/Godot --headless --path apps/godot --script res://tests/shell_launch_acceptance.gd
/Applications/Godot.app/Contents/MacOS/Godot --headless --path apps/godot --script res://tests/presentation_transition_acceptance.gd
apps/godot/tests/export_smoke.sh
```

The export smoke test uses the official universal 4.7.2 debug template, thins the packaged executable to arm64, signs it ad hoc, launches it with network access denied, and verifies its semantic evidence and Storybook Stage capture under `build/`.
