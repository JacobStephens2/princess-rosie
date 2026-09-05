# Present each Place Illustration as three Scenery Layers

The Web Edition runner scrolled each approved 16:9 painting at 1:1 with Stella, stretched into a 2.37:1 box, and each place passed in about 8.5 seconds against the 30–45 seconds ADR-0021 asked for. We decided that every Place Illustration becomes three Scenery Layers, far, middle, and near, generated one layer at a time with the approved painting as the identity and style reference, travelling at roughly 0.2×, 0.5×, and 1× of Stella's speed, with only the near layer painted as a seamless loop. Each place is built on its own and the Birthday Star Moment, which already holds and dims the live Stage, covers the swap to the next. We chose this over a fixed backdrop or a slow drift because the owner wants the scenery itself to travel past, and accepted that it costs seven wide, layered, owner-approved paintings.

## Considered Options

- **Fixed backdrop with a 1× foreground treadmill.** No new art and the whole painting stays on screen, but Stella visibly runs in place against a still terrace.
- **Slow drift inside a slightly enlarged frame.** No new art and some life, but the scenery never actually travels.
- **Outpaint the approved painting and segment it into layers.** Keeps the approved composition pixel for pixel, but every region hidden behind an arch or a bell has to be invented, and that segmentation is where the errors live.

## Consequences

- Supersedes the ADR-0010 consequence that Place Illustrations are never stretched into scrolling panoramas. The glossary's Place Illustration and Scenery Layer entries describe the new shape.
- The approved single-view painting stays the reference for its place, and its signature composition is reproduced in the middle layer at the Rainbow Archway, so each place still ends on the view the owner approved.
- Scenery Layers are candidate assets like any other: they live under `shared/edition/source-media/<place>/` with provenance, and are owner-approved before they become canonical (ADR-0017).
- A prepare step derives web assets from source media. The Web Edition stops hand-copying paintings into `apps/web/public/assets`.
- The scene builds one place at a time. World coordinates restart per place, and adjacent places never abut in one world.
- The image API caps aspect ratio at 3:1, so only the far layer is one painting. The middle and near layers are built from Set Pieces, authored transparent paintings placed along the layer by the place's data, which also lets generic pieces be shared across places.
