# Family Guest passage prototype

Throwaway UI prototype for #73. It asks whether seeing a Family Guest during a
Place's Single Route makes helping her clearer without weakening the Birthday
Star arrival.

Run from the repository root:

```sh
npm run prototype:family-guest-passage
```

Then open
`http://127.0.0.1:4173/apps/godot/prototypes/family-guest-passage/`.

The bottom switcher compares three treatments:

- `?variant=A` — the current Star-side reveal, with no Family Guest in the
  Single Route.
- `?variant=B` — one shared, continuously visible sparkle-companion behavior.
- `?variant=C` — one shared cameo window with per-Place action and placement.

Use the Place selector to compare the same structure across all six Family
Guests. Pause and scrub the passage to compare the mid-passage treatment with
the Birthday Star approach. Variant, Place, progress, and play state stay in the
URL so a specific frame can be shared and reloaded.

This is not Godot Edition implementation code. It uses the real Edition Pack
art in a small browser simulator so scale, attention, and the existing cutouts
can be judged quickly. No winner is encoded here; record the validated verdict
on #73 before implementing it in the shared Place module and data.
