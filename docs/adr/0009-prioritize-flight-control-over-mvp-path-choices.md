# Prioritize Flight Control over MVP Path Choices

Manual play of Zélie's Lacewood showed that stopping at a fork and committing Stella to a fixed route did not feel like controlling her flight: the invisible press-duration selection window could appear unresponsive, and Space could not change Stella's height after selection. The MVP will therefore use one continuous Single Route through every place, with automatic forward travel and immediate hold-to-rise, release-to-settle Flight Control. Path Choices and Journey History are deferred until the complete single-route MVP passes manual play for flight feel. This supersedes the Path Choice, route-specific celebration, and Journey History portions of ADR-0004 and ADR-0005, plus ADR-0007's requirement to validate private Journey History at each production milestone; the one-button, no-failure journey, distinct place-vignette, and remaining semantic-parity decisions stay active.

## Consequences

- Every active passage keeps Flight Control available for several deliberate rise-and-settle cycles. Place-specific interactions layer onto that control instead of replacing it.
- Lacewood becomes a 15–20-second corridor combining silver ribbons and rose lights. Height affects optional delight interactions and Playful Bumps, while the Birthday Star, story progress, and one canonical Lacewood celebration echo remain guaranteed.
- Space and pointer press-and-hold provide the same control. A hold entering flight responds immediately; a hold entering a Storybook Moment cannot skip it without a release and deliberate new press.
- Safe flight limits never stop forward motion. Cloud Rest remains a brief consequence after nearby Playful Bumps and resumes automatically with all progress preserved.
- Active Path Choice and Journey History behavior leaves the runtime, Edition Contract, parity scenarios, persistence, and tests. Reusable source artwork remains available for a possible post-MVP reconsideration.
