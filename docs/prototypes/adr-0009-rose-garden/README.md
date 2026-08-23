# PROTOTYPE — ADR-0009 Rose Garden Flight Presentation

Throwaway branch-only experiment for
[ADR-0009](../../adr/0009-revise-the-existing-phaser-edition.md). It exists to
let the owner judge one question on a desktop:

> Does Rosalia's Rose Garden read as **clearly prettier** when the Flight
> Presentation is composed from a full-Stage Place Illustration plus the
> approved Princess Rosie-and-Stella cutout, instead of primitive procedural
> scenery and a primitive character drawing?

Nothing here is production code. Delete the whole thing when the decision is
recorded.

## Run it

```
npm install
npm run dev
```

Then open <http://localhost:5173/?flight=after>. A floating **PROTOTYPE** bar sits
at the bottom of the page; every control reloads with a new search param and
prints the full prototype state.

| Param | Meaning | Default |
| --- | --- | --- |
| `flight` | `before` (today's procedural art) / `after` (Place Illustration + cutout) | `after` |
| `character` | On-screen width of the cutout silhouette, in Stage pixels | `300` |
| `parallax` | Illustration drift, `0` = perfectly still painting | `0.05` |
| `motion` | Restrained engine-native motion on illustration and cutout | `1` |
| `bodies` | Draw the Arcade bodies, to judge Playful Bump fairness | `0` |

Flip **Before / After** repeatedly on the same flight — that A/B is the whole
point of the prototype.

## Scope

Deliberately narrow, per ADR-0009: flight launch → Rosalia's Rose Garden → its
first Birthday Star Moment. Later places keep their existing procedural
presentation so the journey still runs past the first star. This prototype does
**not** build the production media pipeline, rename the application, generate a
clean star-free Place Illustration, deploy, or port Godot place vignettes.

## Media

The committed, owner-approved canonical bytes from
`feature/godot-production-edition`, copied here with their provenance intact:

- `shared/edition/source-media/flight/rose-garden-background.png`
  — sha256 `da9eabdb…1ba6c81`, 1672×941
- `shared/edition/source-media/flight/rosie-stella.png`
  — sha256 `5b711626…273e62532`, 1536×1024 RGBA
- `shared/edition/source-media/flight/provenance.json`

Both hashes were verified against `provenance.json` after export. The untracked
`shared/edition/source-media/tracer/` files in the edition-comparison worktree
were **not** used.

## Constraints honoured

- The independently authored Arcade body stays on the player **container**. The
  cutout is added as a child image inside that container; no collision bound is
  ever derived from the cutout's 1536×1024 transparent canvas.
- The Place Illustration is uniformly scaled (cover fit plus a small overscan).
  It is never stretched, and never turned into a scrolling panorama.
- Existing journey mechanics, obstacles, Birthday Star, Family Guest, Rainbow
  Path, Cloud Rest and controls are untouched.

## Where the throwaway code lives

- `src/game/PROTOTYPE-flight-presentation.ts` — the whole experiment
- `src/game/RosiGameScene.ts` — five clearly marked `PROTOTYPE (ADR-0009)` hooks
- `src/main.ts` — bar mount, physics-debug flag, evidence hook
- `src/style.css` — the bar's styles, appended at the end of the file

See [FINDINGS.md](FINDINGS.md) for what the experiment taught.
