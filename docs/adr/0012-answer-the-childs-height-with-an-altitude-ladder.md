# Answer the child's height with an altitude ladder

A place answers the child's height through an ordered ladder of altitude rungs read from its own data, not through a fixed pair of high and low bands. Each interaction names the window of heights it answers to, and the route asks five times along its length which rung Stella is on; the rung she is on awakens its delight. A place may also say that it answers every crossing from one rung to another, in which case the ladder follows Flight Control continuously rather than being spent once. Gaps between rungs stay silent, so a height between two delights awakens nothing rather than the nearest thing.

This refines ADR-0011's `places[]` schema, which said each place carries exactly two altitude-band interactions, one high and one low. Two rungs remains the usual shape and the only shape five of the six places use: their high and low interactions take their windows from the two Single Route thresholds the tuning already carried, so their behaviour is unchanged. Golden Bell Abbey needs four, because its four approved bell cues are a mapping from height to bell and a two-rung ladder can only ever ring two of them.

## Consequences

- `PlaceContent` resolves the ladder from an interaction's `altitudeBand` plus optional `altitudeAtLeast` and `altitudeAtMost` fields. The shell samples it; the place presentation module paints one row per rung at the height it answers to. Neither knows which place it is looking at, so ADR-0011's rule that places differ only in art, sound, and data still holds.
- Golden Bell Abbey declares four rungs — tower bell, middle bell, low bell, and the settling bell at the bottom of the corridor. Every reachable height rings something, so no height is correct and none is inferior.
- A place may also declare that it answers every crossing between rungs rather than once each. The Abbey does, so its bells keep following the child's hand instead of falling silent once all four have been found; a rest between answers, tuned in the Edition Pack, keeps a child hovering on a seam from rattling them and holds the mix to two voices. Places that say nothing answer once, exactly as before.
- The journey refuses to launch if any interaction names no reachable height, because a delight the child can never awaken is a content mistake rather than a quiet one.
- A later place that wants finer-grained response gets it by declaring rungs. Adding one still means adding data, never a branch.
