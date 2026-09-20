---
status: accepted
---

# Play the Web Edition in a portrait window on a tall phone

The Web Edition must be playable in a Chrome tab on a ~360×800 Android phone held tall, including the real visible display under the address bar. We decided that when the visible display is taller than it is wide, the Storybook Stage *is* that display: a portrait window into the same 1280×720 world, zoomed to the full height of the Place Illustration, cropping left and right, with the camera following Stella. When the display is wider than it is tall, the Stage stays 16:9. We chose this over asking the Grown-up Helper to turn the phone, over a postage-stamp 16:9 letterbox, and over painting a taller world, because a four-year-old has to see Stella large enough to fly with, and Place Illustrations are already panoramic.

## Considered Options

- **Rotate to landscape before Gallop and Flutter.** Keeps an uncropped 16:9 Stage, but a phone link opens tall and the game would not be playable until someone turns it.
- **Letterbox 16:9 to the phone's width.** Honours the old "never crop" reading (~360×203 on the binding phone) and is what `#109` tested; Stella becomes a postage stamp.
- **Paint a taller portrait Stage.** Playable and pretty; it is a new illustration program, not this issue.
- **Compromise zoom with sky bands.** More lookahead, smaller Stella. Rejected so Stella stays about as large as on a laptop.

## Consequences

- Amends the 16:9-only reading of ADR-0004 and the Storybook Stage glossary. `#109`'s "letterboxed 16:9 on a 390×844 phone" test is no longer the desired behavior.
- Shorter lookahead is the accepted cost. Gallop and Flutter speed, jump, and course layout stay as they are.
- Persistent HUD lives in the sky during flight. Cover and Opening Storybook Moments dock their card under a still-visible painting. Paused overlays may cover the Stage.
- The address bar must not jump-zoom the world during Gallop and Flutter. Cover and other paused screens may reflow with it. The installed PWA must not force landscape.
- iPad-tall may receive the portrait window for free; it is not a required test of this issue. Desktop and sideways-phone 16:9 must not regress.
