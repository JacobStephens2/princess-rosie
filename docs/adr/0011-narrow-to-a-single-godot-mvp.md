# Narrow to a single Godot MVP

> Refined by [ADR-0012](./0012-answer-the-childs-height-with-an-altitude-ladder.md): a place declares an ordered Altitude Ladder rather than exactly two altitude-band interactions. Two rungs stays the usual shape; Golden Bell Abbey declares four so its four approved bell cues can each be reached by height, and answers every crossing between them so the bells follow the child's hand.

The project had grown into three parallel games — a Phaser Edition being actively revised, a Godot Edition partly built, and a Unity Edition promised but never started — held together by an Edition Contract whose only purpose was to let two engines be compared. Twenty-nine open issues specified Unity parity, Path Choices, Journey History, choice-responsive celebration, and bespoke per-place systems, while the actual journey had exactly one place built. The Godot Edition is therefore the game: Unity is cut, the Phaser Edition is frozen at its deployed state, and the MVP is one complete seven-place journey playable start to finish and exported as an unsigned macOS application.

This supersedes ADR-0003, ADR-0006, and ADR-0007 in full, and supersedes ADR-0010's decision to revise the Phaser Edition. It amends ADR-0008: completing Godot before starting Unity becomes completing Godot instead of Unity. It narrows ADR-0005: each place keeps a distinct vignette, but distinction now comes from art and sound over one shared interaction, not from a bespoke system per place.

## Consequences

- `shared/edition/**` remains the engine-neutral content and media store and Godot keeps reading it through its adapter, but the obligations that existed only to synchronize two engines are dropped: no pack digest gate, no packaged Edition Pack zip, no parity scenarios, and no prepare/prove ceremony in the acceptance bar.
- Every place uses one code path and differs only in illustration, cue, and data. Golden Bell Abbey's bells become an altitude mapping over already-approved bell cues rather than a playable instrument, and Rosalia's Rose Garden teaches flight by having no Playful Bumps rather than by having a tutorial.
- `content.json` grows from a single hardcoded `place` to an ordered `places[]`. Family Guests are assigned one per place, with Dad waiting at the Birthday Castle.
- Path Choice, Journey History, per-place celebration echoes, and Dance Again leave the MVP. Approved audio already generated for those concepts is retained in the media tree but removed from the catalog.
- The Birthday Castle celebration is one authored ending reached the same way on every journey, reusing the Phaser Edition's existing celebration illustration.
- Birthday Star Moments are composed from the place illustration, a Family Guest cutout, and text rather than individually painted, holding the remaining art gap to four Place Illustrations, seven guest cutouts, one Birthday Star, and one Rainbow Path treatment.
- Verification is one acceptance script per place plus one cover-to-celebration smoke test. The audience is the project owner and one child on one MacBook, so notarization, distribution, localization, and accessibility features remain out of scope.
- Work proceeds serially on one branch. Six parallel agents previously produced six conflicting revisions of a single shared catalog file, and the uniformity that makes the remaining place work parallelizable is the same uniformity that makes it fast in sequence.
