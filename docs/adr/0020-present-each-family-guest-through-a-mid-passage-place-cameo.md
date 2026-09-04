# Present each Family Guest through a mid-passage Place Cameo

ADR-0019 deferred `#73`. The throwaway prototype evaluated three treatments: a Star-side reveal only (Variant A), a continuous sparkle companion (Variant B), and a mid-passage Place Cameo (Variant C). Variant C won: a single brief scenic sighting establishes whom the Place is for while clearing the Storybook Stage well before the Birthday Star approach, preserving the distinct arrival climax without competing with Flight Control or reading unnaturally on adult guests.

## Consequences

- Each Place declares a `cameo` dictionary in `content.json` specifying normalized `stagePosition`, `stageWidth`, and descriptive `action`. Timing (`0.16`–`0.49` progress) and a gentle opacity fade are standardized in the shared engine.
- Zero new art assets are introduced: each cameo reuses the existing approved `family-guest-<id>.png` cutout with a subtle procedural breathe.
- The cameo is strictly a non-interactive scenic vignette: it has no collision, does not affect the Bump Floor or Near Misses, does not trigger Altitude Ladder rungs, and emits no automatic soundscape cues.
