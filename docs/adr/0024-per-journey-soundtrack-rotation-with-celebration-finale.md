# Per-journey soundtrack rotation with celebration finale

Rotate among four distinct Flight Soundtracks across journeys, transitioning to a dedicated Celebration Theme at the Birthday Castle.

## Context

Princess Rosie and the Seven Birthday Stars is a replayable storybook web game for young children. When played multiple times in a single sitting, looping a single two-minute soundtrack continuously across all flights and restarts causes listener fatigue for parents sitting alongside the child. Individual places take only ~20 seconds to fly through, making per-place musical score changes frantic and jarring for a gentle storybook experience.

## Decision

1. **Per-journey rotation**: Each journey plays one looping Flight Soundtrack through the opening storybook moments and all six flight places, lasting ~2.5 minutes.
2. **Dedicated celebration theme**: Arriving at the Birthday Castle celebration screen (and confetti burst) smoothly crossfades into a distinct, joyful Celebration Theme.
3. **Rotation on Fly Again**: Tapping Fly Again chooses the next Flight Soundtrack via a non-repeating shuffle, persisted in `localStorage` so restarting the browser does not reset to Track 1.
4. **Catalog**: Four Flight Soundtracks (waltz, pastoral lilt, playful marimba/celesta, and epic soaring) plus one Celebration Theme, keeping total audio asset payload under ~10 MB.
5. **Acoustic consistency**: All tracks adhere to the Fairytale Soundscape (gentle, nonverbal, storybook acoustic instrumentation) and are evaluated with Gemini 3.8 Flash and human listening passes.

## Considered Options

- **Per-place tracks**: Rejected because each place lasts only ~20 seconds; frequent track changes break the serene, cohesive flight feel.
- **Continuous playlist**: Rejected because music transitions would fall arbitrarily mid-flight or mid-story rather than aligning with narrative arrival and restart milestones.
- **Single perpetual loop**: Rejected because repeated playthroughs cause severe parental ear fatigue.
