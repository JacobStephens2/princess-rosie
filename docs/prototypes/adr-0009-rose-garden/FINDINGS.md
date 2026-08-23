# Findings — ADR-0009 Rose Garden Flight Presentation prototype

Captured 2026-08-23 on branch `prototype/phaser-rose-garden-visual`.

The owner still makes the ADR-0009 call. This file records what the runnable
experiment showed and what it could not show.

## Evidence

| Shot | What it shows |
| --- | --- |
| [01 before](evidence/01-before-rose-garden.jpg) | Today's Rose Garden: flat sky, green hill, primitive rose blobs, primitive character |
| [02 after](evidence/02-after-rose-garden-300px.jpg) | Same moment with the Place Illustration and the cutout at 300px |
| [03 after, mid-flight](evidence/03-after-mid-flight.jpg) | Later in the same flight; procedural obstacles crossing the painting |
| [04 star gather](evidence/04-after-star-gather-and-seam.jpg) | Birthday Star gathered — shows the duplicate star, the primitive Family Guest, and the place-boundary seam |
| [05 bounds](evidence/05-after-arcade-bounds.jpg) | Arcade bodies drawn, to judge Playful Bump fairness |
| [06 after, larger](evidence/06-after-rose-garden-390px.jpg) | Cutout at 390px, for scale comparison |

## What survived from ADR-0009

**The core composition works, and the difference is not subtle.** A camera-fixed,
full-Stage Place Illustration with the approved cutout flying over it turns the
Rose Garden from flat primitives into a picture book. Shots 01 → 02 are the A/B.

**"Not a scrolling panorama" is the right call.** Holding the painting nearly
still (drift `0.05`) and letting only the interactive elements scroll reads as a
storybook page rather than a side-scroller, and it removes any need to stretch
the plate. This validates the ADR's "illustrations change beneath Birthday Star
Moments" consequence rather than the panorama alternative.

**The 1280×720 Storybook Stage is clean and unstretched.** The canonical plate is
1672×941 — an aspect ratio of 1.7768 against the Stage's 1.7778. A uniform cover
scale fills the Stage with a 0.4px overscan, so there is no distortion and no
letterbox inside the frame. A 12% overscan absorbs the drift with no exposed
edge. Nothing here required a non-uniform scale.

**The cutout is a genuine transparent cutout, and it is clean over the painting.**
Verified against the PNG's alpha channel: corners fully transparent, 76% of the
canvas fully transparent, a stable silhouette bounding box of 872×823 at
(168, 109), and only 575 stray sub-alpha-16 speckles outside it. The asset carries
a baked warm glow, which I expected to read as a dirty matte — over the painting it
reads as soft magical light, not a rectangle or a halo.

**The Arcade body survived untouched and still feels fair.** The cutout is added
as a child of the player container; `setSize(150, 82).setOffset(-75, -25)` is
exactly as it was. Shot 05 shows the body sitting on Stella's torso, smaller than
the drawn silhouette — so the art can overlap an obstacle slightly without a
bump. That errs toward forgiving, which is the right direction for Playful Bumps.

## What changed, or needs the owner's attention

**1. The duplicate Birthday Star is worse than "tolerable" (shot 04).** ADR-0009
tolerates the painting's baked-in star for the prototype. In motion the problem
is sharper than that wording suggests: the painted star is large, glowing and
top-right, while the *gameplay* Birthday Star is smaller and visually weaker, and
the two share the screen at the exact moment the child is meant to reach for the
real one. This does not block the prototype, but it strengthens the ADR's release
boundary — the clean star-free Place Illustration is not just tidiness, it is
required for the moment to read correctly.

**2. Procedural elements now look foreign against a painted plate (shots 03, 04).**
The obstacles (grey puff cloud, white wind curl, lace ribbon) and the Family Guest
figure with her label chip were readable against flat procedural scenery. Over the
painting they read as debug shapes pasted on a picture book. ADR-0009 already
allows that "procedural interactive elements remain and may be visually retuned" —
this prototype says that retune is **not optional** for the first release, it is
part of what makes the composition hold together. This is the largest piece of
work the prototype surfaced that the ADR currently phrases as discretionary.

**3. A camera-fixed illustration collides with world-space backgrounds at place
boundaries (shot 04).** A hard vertical seam appears where the next place's
scrolling background begins. Cause is structural, not cosmetic: the world
backgrounds are a `Graphics` object at depth `-30` drawn in world space, while the
Place Illustration is camera-fixed at depth `-40`, so the neighbouring place's sky
rectangle paints straight over it. Any production version must swap illustrations
**while the Birthday Star Moment overlay covers the Stage**, and must not leave a
world-space background able to overdraw the current plate. This is a real design
constraint the ADR does not yet state.

**4. Character scale is a genuine open choice, not a solved one.** 300px (shot 02)
sits comfortably in the arch corridor; 390px (shot 06) has more presence but
crowds the left edge and pushes Stella's tail off-Stage. The slider is in the
prototype bar so the owner can settle it directly. My read is that the answer is
between 300 and 340, but this is exactly the kind of call the ADR reserves for
owner judgment.

## What this prototype could NOT answer

**Smoothness.** Every capture was taken through an automated Chrome tab reporting
`document.hidden === true`, so `requestAnimationFrame` was throttled to roughly
1Hz and the flight crawled. That is an artifact of the capture harness, not a
measurement of the prototype — no performance conclusion should be drawn from it,
in either direction. The ADR gate's "smooth" criterion, and the feel of the
controls and Playful Bumps in real time, still need the owner to play the branch
on a desktop in a focused window.

Two smaller unknowns for the same reason: the restrained motion (the cutout's
gentle bob and the illustration's slow breath) was never seen at full frame rate,
and the Storybook Stage still shows plain blue bands above and below the frame on
a taller window rather than "extending its illustrated surroundings" — a known
pre-existing gap, untouched and out of scope here.

## Incidental observation

The opening storybook blocks on `await this.soundtrack.play()` in
`src/game/sound.ts`. When that promise never settles — as happens under browser
autoplay restrictions — `advanceStory()` never advances and the cover button
appears dead. It reproduces reliably in an automated tab. This is pre-existing
behaviour on `main`, unrelated to the prototype, and was worked around here by
stubbing `HTMLMediaElement.prototype.play`. Worth its own issue; deliberately not
fixed on this throwaway branch.
