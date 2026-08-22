---
status: superseded by ADR-0008
---

# Build matching Godot and Unity Production Editions

Keep the existing Phaser web game unchanged as the Original Edition, and build complete, independently releasable Production Editions in Godot 4.7.2 with GDScript and Unity 6.3 LTS with C#. Both native macOS editions will implement the same canonical player-facing design, content, source art and audio, tuning targets, and acceptance suite so the comparison tests their production workflows and resulting experience rather than two different game designs; after both are evaluated, one will become the canonical Production Edition and the other will be preserved without a promise of indefinite feature parity.

## Consequences

- Native Apple Silicon macOS builds are the primary quality target; web exports and universal macOS builds are secondary portability work.
- Both Production Editions use layered 2D storybook presentation and contain the full opening, seven-place journey, three Path Choices, adaptive Cloud Rest, seven illustrated Storybook Moments, Birthday Castle celebration, replay experience, production media, tests, and distributable application packaging.
- Shared specifications and source media remain engine-neutral, while each implementation uses its engine's native scene, animation, rendering, audio, input, UI, build, and test systems.
