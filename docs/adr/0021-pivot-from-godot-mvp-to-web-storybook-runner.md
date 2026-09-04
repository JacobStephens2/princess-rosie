# Pivot from Godot MVP to Web Storybook Runner

The Godot native development experience created high iteration friction for autonomous AI agents and disrupted human multitasking by taking over the Mac display during automated test runs. Furthermore, continuous auto-hover flight lacked tactile playfulness. We are returning to the web stack (Phaser 4.2.1, TypeScript, Vite) deployed to `rosie.stephens.page` and pivoting gameplay to a child-friendly "Storybook Runner" featuring "Gallop and Flutter" movement inspired by Yoshi's Crafted World Mellow Mode.

This supersedes ADR-0011, ADR-0012, ADR-0013, and ADR-0016.

## Consequences

- `apps/godot` is archived; the Web Edition becomes the sole canonical edition under active development.
- Automated testing runs headlessly via Playwright and Vitest in background processes without screen hijacking or stealing OS window focus.
- Gameplay switches from continuous hovering flight to an auto-runner where Princess Rosie rides Stella across Storybook Ground, tapping to jump, holding to flutter-glide over playful obstacles, and launching from themed springboards into high-altitude star sparkle trails.
- Failure remains forbidden: colliding with an obstacle results in a Playful Stumble (a soft wobble and brief slowdown) rather than a fail state or life loss, preserving forward momentum for a four-year-old.
- Approved 16:9 Place Illustrations serve as scenic backdrops for 30–45 second authored courses ending at each Family Guest's Rainbow Archway.
