# Media generation prompts

The game remains playable without generation services. These calls produced the polished, local media bundled with the static site; no runtime API calls or credentials ship to players.

## Opening storybook cover illustration

Execution: built-in OpenAI image-generation tool.

> Use case: illustration-story
> Asset type: 16:9 opening and finale illustration for a gentle browser game for a four-year-old
> Primary request: a joyful princess named Rosie riding a friendly flying unicorn named Stella toward a glowing birthday castle across bright fairytale Sicily
> Scene/backdrop: sparkling sapphire sea below, rose-covered coastal hills, soft clouds forming a cloister of arches, warm golden mosaic castle in the distance, delicate silver lace ribbons carried on a playful breeze
> Subject: Princess Rosie is a fictional storybook child with pale skin and blonde hair, a rose-pink medieval-fantasy dress and small gold crown; Stella is a kind white flying unicorn with rounded proportions, lavender wings, and a luminous rainbow-striped horn
> Style/medium: premium flat modern children's picture-book illustration, solid color blocks, gently rounded shapes, limited soft shadows, subtle paper texture, expressive friendly faces
> Composition/framing: wide cinematic 16:9 landscape; Rosie and Stella large enough to read at laptop size; castle visible as destination; generous calm sky around the subjects for HTML title text overlay
> Lighting/mood: sunny, safe, buoyant, celebratory, full of wonder
> Color palette: blush pink, lavender, sapphire, warm cream, jewel tones, rainbow accents, luminous mosaic gold
> Constraints: no written text, no watermark, no logos, no photorealism, no scary imagery, no weapons, no peril, no religious figures; respectful small cross only as an architectural detail on one distant abbey; simple coherent silhouettes suitable for a polished children's web game key visual
> Avoid: Disney or any named studio style, 3D render, anime, overly intricate costume, dark cave, bones, plague motifs, realistic child portrait, extra main characters

Output: `public/assets/storybook-key-art.png`

## Opening Storybook Moment: celebration preparations

Execution: built-in OpenAI image-generation tool. `public/assets/storybook-key-art.png` provided the visual style and Fairytale Sicily reference; `public/assets/celebration-art.png` provided Gigi's established appearance. Targeted edits compacted Gigi, the cake, crown, and empty place setting into the upper-center crop-safe area and replaced the generated candle flame with a short dark wick.

> Use case: illustration-story
> Asset type: 16:9 full-screen Opening Storybook Moment background for a gentle browser game for a four-year-old
> Primary request: Gigi prepares Princess Zélie's first-birthday celebration before anyone arrives
> Scene/backdrop: an airy terrace inside the Birthday Castle, with warm golden mosaic arches, the Sapphire Sea and flowered coast beyond, and rose garlands and rainbow ribbons being hung
> Subject: one tall, friendly Gigi joyfully decorating; a rose-covered cake with exactly one clearly visible unlit candle; and a tiny child-size gold crown at an empty place setting; Princess Zélie remains deliberately offscreen
> Style/medium: match the cover's premium flat modern children's picture-book illustration, solid color blocks, gently rounded shapes, limited soft shadows, subtle paper texture, and expressive friendly face
> Composition/framing: wide cinematic 16:9; keep Gigi's face and decorating action, the cake, unlit candle, and crown in the central crop-safe area above the lower 35 percent reserved for the HTML story card
> Lighting/mood: warm sunny morning, safe, expectant, buoyant, celebratory
> Color palette: luminous mosaic gold, warm cream, blush pink, rose, lavender, sapphire, and restrained rainbow accents
> Constraints: exactly one giraffe and no other characters; exactly one cake, one unlit candle with a short dark wick and no flame, and one tiny crown; no written text, watermark, logos, photorealism, scary imagery, weapons, peril, religious figures, or symbols; coherent anatomy and decorating pose
> Avoid: extra party guests, extra giraffes, embedded writing, flame, smoke, glow, dark interiors, realistic child portrait, named-studio imitation, 3D render, anime, malformed limbs

Source: `art-source/opening-storybook/celebration-preparations.png`

Deployed output: `public/assets/storybook-celebration-preparations.webp`

## Opening Storybook Moment: scattered Stars

Execution: built-in OpenAI image-generation tool. `public/assets/storybook-key-art.png` provided the visual style, palette, architecture, landscape, rose, lace, cloud, sea, castle, and luminous-gold reference. Targeted edits arranged all seven Stars in a compact upper-center safe area where they remain countable above the story card in landscape and portrait crops.

> Use case: illustration-story
> Asset type: 16:9 full-screen Opening Storybook Moment background for a gentle browser game for a four-year-old
> Primary request: a playful, non-frightening wind has scattered exactly seven Birthday Stars across Fairytale Sicily while their Rainbow Paths fade
> Scene/backdrop: a coherent panorama combining Rosalia's rose-covered garden, silver lace ribbons among friendly trees, a warm golden bell abbey and cloud arches, a flowered mountain peak, the sparkling Sapphire Sea, and the distant Birthday Castle
> Subject: exactly seven large, clearly separated golden mosaic five-pointed Birthday Stars flying outward on exactly seven softly fading rainbow trails; motion appears through lace ribbons, petals, leaves, and curved cloud wisps rather than a personified wind
> Style/medium: match the cover's premium flat modern children's picture-book illustration, solid color blocks, gently rounded shapes, limited soft shadows, and subtle paper texture
> Composition/framing: wide cinematic 16:9 panorama; keep all seven Stars large and complete in the central crop-safe area above the lower 35 percent reserved for the HTML story card
> Lighting/mood: one continuous sunny day, breezy, surprising, safe, and buoyant
> Color palette: sapphire and lavender led, with blush rose, fresh green, warm cream, restrained rainbow arcs, and luminous mosaic gold
> Constraints: exactly seven Birthday Stars and seven trails; no other star-shaped objects; no characters, faces, or personified wind; no written text, watermark, logos, photorealism, scary weather, peril, religious figures, or symbols
> Avoid: map labels, separate comic panels, cluttered miniature scenes, tiny Stars, extra castles, named-studio imitation, 3D render, anime

Source: `art-source/opening-storybook/scattered-stars.png`

Deployed output: `public/assets/storybook-scattered-stars.webp`

## Opening Storybook Moment: Rosie and Stella depart

Execution: built-in OpenAI image-generation tool. `public/assets/storybook-key-art.png` provided the identity reference for Princess Rosie and Stella as well as the visual style, palette, roses, lace, sky, and Fairytale Sicily. Targeted edits compacted Princess Rosie, Stella, both wings, and the single Star into the upper-center crop-safe area.

> Use case: illustration-story
> Asset type: 16:9 full-screen Opening Storybook Moment background for a gentle browser game for a four-year-old
> Primary request: Princess Rosie has just climbed onto Stella in Rosalia's Rose Garden and they are ready to find the Birthday Stars
> Scene/backdrop: a rose-crowned garden terrace with warm cream arches, pink roses, fresh green leaves, silver lace ribbons, flowered hills, and sunny sapphire sky
> Subject: preserve the cover's fictional Princess Rosie and Stella designs; Stella stands safely on the garden path with two lavender wings beginning to open while Rosie sits securely with a brave, joyful expression; exactly one distant golden mosaic Birthday Star glows ahead
> Style/medium: match the cover's premium flat modern children's picture-book illustration, solid color blocks, gently rounded shapes, limited soft shadows, subtle paper texture, and expressive friendly faces
> Composition/framing: wide cinematic 16:9 medium-wide three-quarter view; keep both faces, Rosie's torso, Stella's rainbow horn and two wings, and the single Star in the central crop-safe area above the lower 35 percent reserved for the HTML story card
> Lighting/mood: one continuous sunny day, hopeful rose-tinted morning, safe, brave, affectionate, and anticipatory
> Color palette: blush and rose pink, fresh garden green, lavender, sapphire, warm cream, restrained rainbow accents, and luminous mosaic gold
> Constraints: exactly Princess Rosie and Stella with no other characters; exactly one Birthday Star and no other star shapes; Stella has exactly one rainbow horn and two wings; no falling or peril; no written text, watermark, logos, photorealism, scary imagery, weapons, religious figures, or symbols; coherent anatomy and rider contact
> Avoid: high flight, castle arrival, extra crowns, horns, wings, limbs, characters, or Family Guests; danger, realistic child portrait, named-studio imitation, 3D render, anime

Source: `art-source/opening-storybook/rosie-stella-departure.png`

Deployed output: `public/assets/storybook-rosie-stella-departure.webp`

## Opening flight: Rosalia's Rose Garden background plate

Execution: built-in OpenAI image-generation tool. `shared/edition/source-media/opening-storybook/rosie-stella-departure.png` provided the approved Rosalia's Rose Garden palette, architecture, lighting, and picture-book style.

> Use case: production game background layer
> Asset type: 16:9 character-free flight background plate for native Godot parallax
> Primary request: preserve the approved sunny rose-covered garden terrace, cream arches, sapphire sky and sea, distant flowered hills, silver lace ribbons, and warm picture-book lighting while removing Princess Rosie, Stella, the Birthday Star, and every character-shaped foreground subject
> Composition/framing: continuous spacious Rosalia's Rose Garden vista with clear sky and garden depth behind the flight path; fill the complete 16:9 frame without text or interface elements
> Constraints: no people, unicorns, animals, Birthday Stars, written text, watermark, logos, checkerboard, empty cutout holes, photorealism, named-studio imitation, 3D render, or anime

Output: `shared/edition/source-media/flight/rose-garden-background.png`

## Opening flight: Rosie and Stella character layer

Execution: OpenAI Image API CLI fallback, `gpt-image-1.5`, high quality and input fidelity, transparent 1536×1024 PNG. `shared/edition/source-media/opening-storybook/rosie-stella-departure.png` provided the approved fictional character identities and illustration style.

> Use case: production game character-layer extraction. Preserve exactly the approved characters and picture-book illustration style from the reference: young Princess Rosie with long golden-blonde hair, small gold crown, joyful expression, ornate bright pink rose-patterned dress and pink shoes, seated astride Stella; Stella is a friendly white winged unicorn with a pastel pink-purple-blue mane and tail, rainbow horn, two large lavender feathered wings, gold-and-heart bridle, complete body with all four legs and hooves. Isolate only Rosie riding Stella as one complete cohesive character cutout. Remove the garden, archways, sky, sea, flowers, ribbons, star, floor, scenery, shadows, and every other object. Keep the entire silhouette fully inside the canvas with generous transparent padding and no cropping. Output a genuine RGBA PNG with fully transparent pixels everywhere outside the clean character silhouette. No checkerboard, no painted transparency pattern, no white matte, no rectangular background, no halo, no text, no added objects, no anatomy changes, no duplicate limbs or wings.

## Zélie's Lacewood: deferred fork source artwork

Execution: built-in OpenAI image-generation tool with the approved departure illustration and Rose Garden flight background as style, palette, lighting, and world references only. This source artwork is retained for possible post-MVP reconsideration and is not used by the active Single Route.

> Use case: illustration-story
> Asset type: production 16:9 Godot active-play environment background
> Primary request: create Zélie’s Lacewood, an enchanted rose-and-lace forest where two equally inviting flight routes split and rejoin
> Subject: one upper silver-ribbon canopy route and one lower rose-lit woodland-floor route, both open, broad, safe, equally bright, equally beautiful, and similar in visual weight
> Composition: wide side-view flight composition with readable open corridors, a clear split near the left-middle, and a visible rejoin near the right edge
> Style: premium children’s picture-book illustration matching the approved references, jewel teal and emerald foliage, blush roses, silver-white lace, warm cream stone, mosaic-gold accents, subtle paper texture
> Constraints: scenery only; no characters, Birthday Star, text, UI, signs, scoring, correctness cues, danger, closed route, watermark, photorealism, 3D, or anime

Selected output: `shared/edition/source-media/lacewood/lacewood-background.png`

Provenance: `shared/edition/source-media/lacewood/provenance.json`

## Zélie's Lacewood: active single-route background

Execution: built-in OpenAI image-generation edit of the deferred fork artwork. The original remains unchanged as reusable source artwork.

> Use case: precise-object-edit
> Asset type: wide side-scrolling children's storybook game background
> Primary request: replace the central island, upper bridge, lower loop, split, and rejoin with exactly one broad, uninterrupted, gently winding garden corridor from the left edge through the open center to the right edge
> Scene: enchanted rose woodland with silver ribbons, warm lanterns, airy blue sky, distant fairytale pavilion, and cypress trees
> Style: preserve the polished hand-painted children's storybook detail, palette, lighting, and botanical framing of the source artwork
> Constraints: no fork, branch, loop, parallel lane, central median, characters, UI, text, or watermark

Selected output: `shared/edition/source-media/lacewood/lacewood-single-route-background.png`

Provenance: `shared/edition/source-media/lacewood/single-route-provenance.json`

## Golden Bell Abbey: Place Illustration

Execution: Inkvoke 1.0.1, GPT Image 2, high quality, 1680×944 PNG. Generated rather than
edited, with the approved Rose Garden and Lacewood art direction described in the prompt:
the same warm stone, jewel palette, and picture-book register the earlier plates carry.
The Abbey's four bells hang at four readable heights because the child's altitude chooses
which bell rings.

> Use case: illustration-story. Asset type: production 16:9 game environment background plate for a gentle Godot active-play scene. Create Golden Bell Abbey, a bright reverent abbey of warm honey-colored stone where a single open flight corridor runs left to right across the frame. Along the upper band show a sunlit bell tower and high arched openings hung with small golden bells, bright stained-glass roundels catching the light, and airy sky. Along the lower band show garden cloisters, a colonnade of warm stone arches, rose and lavender planting beds, and larger round-shouldered bells resting under the arcade. Both bands are open, safe, equally bright, and equally beautiful, with bells clearly readable at several different heights so height alone reads as a different bell. Match the approved premium flat modern children's picture-book style: solid color blocks, gently rounded shapes, limited soft shadows, subtle paper texture, warm sunny lighting, and the established jewel palette of luminous mosaic gold, warm cream, blush rose, lavender, and sapphire. Scenery only. No characters, faces, animals, Birthday Star, rainbow path, written text, interface, watermark, correctness cues, danger, religious figures or symbols beyond one small respectful architectural cross on the distant tower, photorealism, 3D render, or anime.

Selected output: `shared/edition/source-media/abbey/abbey-background.png`

Provenance: `shared/edition/source-media/abbey/provenance.json`

## Cloister of Clouds: Place Illustration

Execution: Inkvoke 1.0.1, GPT Image 2, high quality, 1680×944 PNG. Generated rather than
edited, with the approved Rose Garden, Lacewood, and Abbey art direction described in the
prompt. The arches sit high in the frame and the clouds bank low, because flying high
answers with the sunlit arches and settling low answers with the soft clouds.

> Use case: illustration-story. Asset type: production 16:9 game environment background plate for a gentle Godot active-play scene. Create the Cloister of Clouds, a tranquil sky passage where a cloister's arcade floats in open air and a single open flight corridor runs left to right across the frame. Along the upper band show tall sunlit arches of warm honey-colored stone, a slender floating arcade catching bright golden light, and airy sky through every opening. Along the lower band show soft banked clouds, pale and pillowy and rounded, with gentle drifting wisps and a few small stone steps and planters resting on them. Both bands are open, safe, equally bright, and equally beautiful, with the arches clearly readable high in the frame and the soft clouds clearly readable low, so height alone reads as a different delight. Match the approved premium flat modern children's picture-book style: solid color blocks, gently rounded shapes, limited soft shadows, subtle paper texture, warm sunny lighting, and the established jewel palette of luminous mosaic gold, warm cream, blush rose, lavender, and sapphire. Scenery only. No characters, faces, animals, Birthday Star, rainbow path, written text, interface, watermark, correctness cues, danger, photorealism, 3D render, or anime.

Selected output: `shared/edition/source-media/cloister/cloister-background.png`

Provenance: `shared/edition/source-media/cloister/provenance.json`

Output: `shared/edition/source-media/flight/rosie-stella.png`

## Birthday Castle celebration illustration

Execution: Inkvoke 1.0.1, GPT Image 2, high quality, 1680×944 PNG.

> Use case: illustration-story. Asset type: 16:9 finale illustration for a gentle browser game for a four-year-old. Inside a magnificent warm golden mosaic birthday castle in bright fairytale Sicily, Princess Rosie and her friendly white flying unicorn Stella have arrived at Princess Zelies joyful birthday celebration. Princess Rosie is a fictional pale-skinned blonde storybook child in a rose-pink medieval-fantasy dress and small gold crown. Stella has lavender wings, a pink-lavender mane, and a luminous rainbow-striped horn. Gigi, a tall friendly giraffe party keeper with a flower garland, dances beside them. A happy small family group claps around a birthday table: Mom with long straight dirty-blonde hair and jeans; Dad with brown hair, T-shirt under an open short-sleeve shirt; Gram with short brown permed curls; Pop with short light strawberry-blonde hair; Aunt with dirty-blonde hair in a bun and bangs; taller Uncle with brown almost-pompadour hair and brown shoes; and Beasley, an orange-and-white cat, pouncing at confetti. Premium flat modern childrens picture-book illustration, solid color blocks, gently rounded shapes, limited soft shadows, subtle paper texture, expressive friendly faces. Wide cinematic 16:9 composition, all figures clearly visible, dancing and clapping, rose garlands, rainbow ribbons, seven golden mosaic stars shining overhead, confetti and soft fireworks through the open arches. Blush pink, lavender, sapphire, warm cream, jewel tones, luminous mosaic gold. Sunny, safe, buoyant, celebratory. No written text, no watermark, no logos, no photorealism, no scary imagery, no religious figures, no extra people, no weapons, no peril. Original style, not Disney or any named studio, no 3D render, no anime, no realistic child portrait.

Output: `public/assets/celebration-art.png`

## Instrumental soundtrack

Execution: Mureka API, model `mureka-9`, one non-streaming instrumental; locally reduced in volume and encoded to 128 kbps MP3.

> Joyful whimsical instrumental soundtrack for a gentle childrens picture-book flying game, about two minutes, bright fairytale Sicily, pizzicato strings, celesta, glockenspiel, soft hand percussion, warm woodwinds, graceful three-four waltz pulse, playful and magical, calm enough for a four-year-old, clear celebratory lift near the ending, no vocals, no darkness, seamless-feeling loop

Output: `public/assets/audio/birthday-flight.mp3`

## Shared journey media

Nine assets that appear in more than one place, generated in one batch against a single
shared style clause and approved by the project owner in one pass on 2026-08-24. Beasley and
Gram were settled first; the remaining seven were matched to them. Per ADR-0001 every likeness
comes from short written appearance cues alone — no photograph was sent to any
image-generation service, and no surname, school, parish, town, or precise location appears
in any prompt.

Execution: OpenAI Images API, `gpt-image-1.5`, high quality, transparent background, PNG.

### Family Guest cutout: Mom

> Use case: production game character cutout. Asset type: full-body Family Guest cutout on a transparent background for a gentle children's storybook flying game. Subject: Mom, a warm fictional storybook mother with long straight dirty-blonde hair falling past her shoulders, a soft pink short-sleeve top, blue jeans, and simple flat shoes; she stands with a bright happy smile and both hands raised in a gentle clap. Proportions: a grown-up adult with adult body proportions — about seven heads tall, a mature adult face and build, and clearly not a child or a teenager. Style: smooth digital children's picture-book painting matching the approved Princess Rosie and Stella game cutout — soft airbrushed shading, clean simplified rounded shapes, very little micro-texture, a large friendly face with bright dark eyes and rosy cheeks, warm saturated storybook colour, and a gentle luminous rim light around the figure. Not watercolour, not paper texture, not hyper-detailed fur or fabric weave, not photographic. Composition: one complete full-body figure from the top of the head to the feet, facing the viewer, standing upright and centred, with generous empty padding on every side and no cropping of hair, hands, or feet. Background: completely empty and transparent — no scenery, floor, ground line, cast shadow, vignette, checkerboard, or white matte. Constraints: exactly one character and nothing else; no props, furniture, text, numbers, watermark, logo, photorealism, 3D render, anime, named-studio imitation, realistic portrait, extra limbs, or duplicate figures.

Parameters: 1024x1536, quality high, background transparent.

Output: `shared/edition/source-media/journey/family-guest-mom.png`

### Family Guest cutout: Dad

> Use case: production game character cutout. Asset type: full-body Family Guest cutout on a transparent background for a gentle children's storybook flying game. Subject: Dad, a warm fictional storybook father with short tousled brown hair, a white T-shirt under an open blue chambray short-sleeve shirt, brown trousers, and simple shoes; he stands with a broad friendly grin and one hand raised in a welcoming wave. Proportions: a grown-up adult with adult body proportions — about seven heads tall, a mature adult face and build, and clearly not a child or a teenager. Style: smooth digital children's picture-book painting matching the approved Princess Rosie and Stella game cutout — soft airbrushed shading, clean simplified rounded shapes, very little micro-texture, a large friendly face with bright dark eyes and rosy cheeks, warm saturated storybook colour, and a gentle luminous rim light around the figure. Not watercolour, not paper texture, not hyper-detailed fur or fabric weave, not photographic. Composition: one complete full-body figure from the top of the head to the feet, facing the viewer, standing upright and centred, with generous empty padding on every side and no cropping of hair, hands, or feet. Background: completely empty and transparent — no scenery, floor, ground line, cast shadow, vignette, checkerboard, or white matte. Constraints: exactly one character and nothing else; no props, furniture, text, numbers, watermark, logo, photorealism, 3D render, anime, named-studio imitation, realistic portrait, extra limbs, or duplicate figures.

Parameters: 1024x1536, quality high, background transparent.

Output: `shared/edition/source-media/journey/family-guest-dad.png`

### Family Guest cutout: Pop

> Use case: production game character cutout. Asset type: full-body Family Guest cutout on a transparent background for a gentle children's storybook flying game. Subject: Pop, a warm fictional storybook grandfather with short light strawberry-blonde hair, a pale-yellow patterned short-sleeve shirt, brown trousers, and simple shoes; he stands with a kind delighted smile and both hands raised in a gentle clap. Proportions: a grown-up adult with adult body proportions — about seven heads tall, a mature adult face and build, and clearly not a child or a teenager. Style: smooth digital children's picture-book painting matching the approved Princess Rosie and Stella game cutout — soft airbrushed shading, clean simplified rounded shapes, very little micro-texture, a large friendly face with bright dark eyes and rosy cheeks, warm saturated storybook colour, and a gentle luminous rim light around the figure. Not watercolour, not paper texture, not hyper-detailed fur or fabric weave, not photographic. Composition: one complete full-body figure from the top of the head to the feet, facing the viewer, standing upright and centred, with generous empty padding on every side and no cropping of hair, hands, or feet. Background: completely empty and transparent — no scenery, floor, ground line, cast shadow, vignette, checkerboard, or white matte. Constraints: exactly one character and nothing else; no props, furniture, text, numbers, watermark, logo, photorealism, 3D render, anime, named-studio imitation, realistic portrait, extra limbs, or duplicate figures.

Parameters: 1024x1536, quality high, background transparent.

Output: `shared/edition/source-media/journey/family-guest-pop.png`

### Family Guest cutout: Gram

> Use case: production game character cutout. Asset type: full-body Family Guest cutout on a transparent background for a gentle children's storybook flying game. Subject: Gram, a warm fictional storybook grandmother with short brown permed curls, a soft lavender cardigan over a rose-pink floral blouse, a long cream skirt, and comfortable low shoes; she stands with a delighted welcoming smile and both hands raised in a gentle clap. Proportions: a grown-up adult with adult body proportions — about seven heads tall, a mature adult face and build, and clearly not a child or a teenager. Style: smooth digital children's picture-book painting matching the approved Princess Rosie and Stella game cutout — soft airbrushed shading, clean simplified rounded shapes, very little micro-texture, a large friendly face with bright dark eyes and rosy cheeks, warm saturated storybook colour, and a gentle luminous rim light around the figure. Not watercolour, not paper texture, not hyper-detailed fur or fabric weave, not photographic. Composition: one complete full-body figure from the top of the head to the feet, facing the viewer, standing upright and centred, with generous empty padding on every side and no cropping of hair, hands, or feet. Background: completely empty and transparent — no scenery, floor, ground line, cast shadow, vignette, checkerboard, or white matte. Constraints: exactly one character and nothing else; no props, furniture, text, numbers, watermark, logo, photorealism, 3D render, anime, named-studio imitation, realistic portrait, extra limbs, or duplicate figures.

Parameters: 1024x1536, quality high, background transparent.

Output: `shared/edition/source-media/journey/family-guest-gram.png`

### Family Guest cutout: Aunt

> Use case: production game character cutout. Asset type: full-body Family Guest cutout on a transparent background for a gentle children's storybook flying game. Subject: Aunt, a warm fictional storybook aunt with dirty-blonde hair gathered in a soft bun with a fringe of bangs, a teal short-sleeve top, a long lavender floral skirt, and green flat shoes; she stands with a joyful smile and both hands pressed together in delight. Proportions: a grown-up adult with adult body proportions — about seven heads tall, a mature adult face and build, and clearly not a child or a teenager. Style: smooth digital children's picture-book painting matching the approved Princess Rosie and Stella game cutout — soft airbrushed shading, clean simplified rounded shapes, very little micro-texture, a large friendly face with bright dark eyes and rosy cheeks, warm saturated storybook colour, and a gentle luminous rim light around the figure. Not watercolour, not paper texture, not hyper-detailed fur or fabric weave, not photographic. Composition: one complete full-body figure from the top of the head to the feet, facing the viewer, standing upright and centred, with generous empty padding on every side and no cropping of hair, hands, or feet. Background: completely empty and transparent — no scenery, floor, ground line, cast shadow, vignette, checkerboard, or white matte. Constraints: exactly one character and nothing else; no props, furniture, text, numbers, watermark, logo, photorealism, 3D render, anime, named-studio imitation, realistic portrait, extra limbs, or duplicate figures.

Parameters: 1024x1536, quality high, background transparent.

Output: `shared/edition/source-media/journey/family-guest-aunt.png`

### Family Guest cutout: Uncle

> Use case: production game character cutout. Asset type: full-body Family Guest cutout on a transparent background for a gentle children's storybook flying game. Subject: Uncle, a warm fictional storybook uncle, the tallest of the family, with brown hair swept up in a soft pompadour, a blue patterned short-sleeve shirt worn open over a white T-shirt, blue jeans, and brown shoes; he stands with a big cheerful laugh and one hand raised in a wave. Proportions: a grown-up adult with adult body proportions — about seven heads tall, a mature adult face and build, and clearly not a child or a teenager. Style: smooth digital children's picture-book painting matching the approved Princess Rosie and Stella game cutout — soft airbrushed shading, clean simplified rounded shapes, very little micro-texture, a large friendly face with bright dark eyes and rosy cheeks, warm saturated storybook colour, and a gentle luminous rim light around the figure. Not watercolour, not paper texture, not hyper-detailed fur or fabric weave, not photographic. Composition: one complete full-body figure from the top of the head to the feet, facing the viewer, standing upright and centred, with generous empty padding on every side and no cropping of hair, hands, or feet. Background: completely empty and transparent — no scenery, floor, ground line, cast shadow, vignette, checkerboard, or white matte. Constraints: exactly one character and nothing else; no props, furniture, text, numbers, watermark, logo, photorealism, 3D render, anime, named-studio imitation, realistic portrait, extra limbs, or duplicate figures.

Parameters: 1024x1536, quality high, background transparent.

Output: `shared/edition/source-media/journey/family-guest-uncle.png`

### Family Guest cutout: Beasley

> Use case: production game character cutout. Asset type: full-body Family Guest cutout on a transparent background for a gentle children's storybook flying game. Subject: Beasley, a fictional orange-and-white storybook house cat with a white chest, white paws, a plumed orange tail held high, round friendly eyes and a cheerful open-mouthed smile, sitting upright with one front paw lifted in a playful wave. Style: smooth digital children's picture-book painting matching the approved Princess Rosie and Stella game cutout — soft airbrushed shading, clean simplified rounded shapes, very little micro-texture, a large friendly face with bright dark eyes and rosy cheeks, warm saturated storybook colour, and a gentle luminous rim light around the figure. Not watercolour, not paper texture, not hyper-detailed fur or fabric weave, not photographic. Composition: one complete full-body figure from the top of the head to the feet, facing the viewer, standing upright and centred, with generous empty padding on every side and no cropping of hair, hands, or feet. Background: completely empty and transparent — no scenery, floor, ground line, cast shadow, vignette, checkerboard, or white matte. Constraints: exactly one character and nothing else; no props, furniture, text, numbers, watermark, logo, photorealism, 3D render, anime, named-studio imitation, realistic portrait, extra limbs, or duplicate figures.

Parameters: 1024x1536, quality high, background transparent.

Output: `shared/edition/source-media/journey/family-guest-beasley.png`

### Birthday Star sprite

> Use case: production game sprite. Asset type: single reusable Birthday Star sprite on a transparent background for a gentle children's storybook flying game. Subject: one Birthday Star — a plump five-pointed star with gently rounded points, its surface a warm golden mosaic of small luminous gold and amber tiles, wrapped in a soft radiant halo of warm light with a few tiny sparkles close around it. The Birthday Star wears and carries nothing: no party hat, bow, ribbon, streamer, candle, face, or any other decoration attached to it. Style: smooth digital children's picture-book painting matching the approved Princess Rosie and Stella game art — soft airbrushed shading, clean simplified rounded shapes, warm saturated storybook colour, and a gentle luminous glow. Not watercolour, not paper texture, not photographic. Composition: one complete object, centred, with generous empty padding on every side and no cropping. Background: completely empty and transparent — no scenery, sky, floor, ground line, cast shadow, vignette, checkerboard, or white matte. Constraints: exactly one object and nothing else; no characters, faces, text, numbers, watermark, logo, photorealism, 3D render, anime, or named-studio imitation.

Parameters: 1024x1024, quality high, background transparent.

Output: `shared/edition/source-media/journey/birthday-star.png`

### Rainbow Path treatment

> Use case: production game sprite. Asset type: single reusable Rainbow Path treatment on a transparent background for a gentle children's storybook flying game. Subject: one broad ribbon of soft rainbow light sweeping in a gentle arc from the lower left to the upper right, built from translucent layered bands of blush rose, warm gold, fresh green, sapphire and lavender, glowing softly, scattered with small drifting sparkles, and tapering to a soft fade at both ends. Style: smooth digital children's picture-book painting matching the approved Princess Rosie and Stella game art — soft airbrushed shading, clean simplified rounded shapes, warm saturated storybook colour, and a gentle luminous glow. Not watercolour, not paper texture, not photographic. Composition: one complete object, centred, with generous empty padding on every side and no cropping. Background: completely empty and transparent — no scenery, sky, floor, ground line, cast shadow, vignette, checkerboard, or white matte. Constraints: exactly one object and nothing else; no characters, faces, text, numbers, watermark, logo, photorealism, 3D render, anime, or named-studio imitation.

Parameters: 1536x1024, quality high, background transparent.

Output: `shared/edition/source-media/journey/rainbow-path.png`

Provenance: `shared/edition/source-media/journey/provenance.json`
<!-- soundscape-build:start -->
## Fairytale Soundscape

Credit: ElevenLabs Sound Effects API. This project documentation records the provider; No in-game provider credit is added.

### cue.birthday-star-moment.abbey

> A restrained resolving golden bell phrase: three soft related bell notes settling warmly together over calm courtyard air. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 2 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Blinded Gemini 3.7 Flash native-audio evaluation ranked it first with a perfect gentleness score: soft warm bell notes that settle reverently with no harsh transient, restrained rather than a fanfare.

Source master: `source-master.birthday-star-moment.abbey`

### cue.birthday-star-moment.cloister

> A cloister pounce resolution accent. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 2 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Candidate C provides the best balance of a cute, gentle physical 'pounce' transient followed by a warm, sparkling fairytale resolution chime that translates crisply and pleasantly on MacBook speakers without any harshness or fatigue.

Source master: `source-master.birthday-star-moment.cloister`

### cue.birthday-star-moment.lacewood

> A lacewood resolution accent. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 2 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Best Gram Birthday Star Moment resolution: clear sustained body, low crossing activity, controlled crest, and safe peak headroom for a warm place-specific close after the Rainbow Path travel stage.

Source master: `source-master.birthday-star-moment.lacewood`

### cue.birthday-star-moment.pellegrino-peak

> A flowered open-air resolution accent. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh wind transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 2 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Blinded native-audio evaluation with paid Gemini 3.7 Flash ranked Candidate Charlie > Candidate Alpha > Candidate Bravo and selected Candidate Charlie: Candidate Charlie offers the most magical and balanced storybook resolution accent while remaining gentle, clear, and distinct from the reference. Evaluator reported no uncertainty. Human MacBook-speaker and headphone listening pass still required.

Source master: `source-master.birthday-star-moment.pellegrino-peak`

### cue.birthday-star-moment.rose-garden

> A rose garden resolution accent settling warmly open. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 2 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Blind Gemini 3.7 Flash evaluation ranked it first of three: a warm resonant acoustic bell that blooms and decays into a settled generous closure, with no startle or fatigue risk, where the rivals rose rather than resolved.

Source master: `source-master.birthday-star-moment.rose-garden`

### cue.birthday-star-moment.sapphire-sea

> A sparkling shore-wash resolution accent. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 2 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Blinded Gemini 3.7 Flash native-audio evaluation ranked it first for a warm acoustic harp and airy shore-wash shimmer that resolves the moment without fanfare or reward-chime character, distinct from the woodland resolution accent, with no unwanted voice or melody; it clears the waveform gate at 48 kHz mono, 2.0 s, -6 dBFS peak, no clipping, and a clean trimmed tail.

Source master: `source-master.birthday-star-moment.sapphire-sea`

### cue.birthday-star.gather

> A immediate recognizable gather. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 1.4 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, fit-catalog-duration, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Best shared Birthday Star gather identity: lowest controlled crest among the gentle low-crossing candidates, clear sustained response, and generous headroom for critical-foreground playback without a startling attack.

Source master: `source-master.birthday-star.gather`

### cue.birthday-star.proximity

> A capped magical shimmer. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 1 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Clearest capped Birthday Star shimmer on small speakers: balanced audible energy, airy high-frequency activity appropriate to a shimmer, controlled crest, and ample peak headroom at the quiet detail gain.

Source master: `source-master.birthday-star.proximity`

### cue.cloud-rest.ambience

> A soft indefinite rest under the existing music. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers, with a smooth seamless loop. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 15 seconds, prompt influence 0.3, looping on, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, preserve-stereo, peak-ceiling--6dbfs, loop-seam-qa, wav-wrap-pcm16le, decode-wav-qa.

Selection: Best continuous Cloud Rest bed: strongest low-crest body, low crossing activity, a validated seamless stereo loop, and a safe -6 dBFS mastered peak for the deliberately quiet ambience slot.

Source master: `source-master.cloud-rest.ambience`

### cue.cloud-rest.enter

> A reassuring gentle landing. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 1.5 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, fit-catalog-duration, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Best reassuring Cloud Rest landing in the replacement batch: clearest usable body, moderate crest and crossing activity, and generous headroom so it remains gentle while replacing the third Playful Bump tail.

Source master: `source-master.cloud-rest.enter`

### cue.cloud-rest.exit

> A safe immediate takeoff. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 1.2 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Best safe Cloud Rest takeoff: strongest clear body, low crossing activity, controlled crest, and a mastered -6 dBFS peak for an immediate reassuring resume into the restored Lacewood and movement layers.

Source master: `source-master.cloud-rest.exit`

### cue.flight.launch

> A buoyant gentle storybook flight launch: a soft upward rush of warm air, one light harp sweep, and a tiny celesta lift that settles forward without a hard landing. Nonverbal, acoustic, joyful, and clear on MacBook speakers. No voice, speech, singing, recognizable melody, fanfare blast, harsh transient, alarm, impact, battle sound, realistic simulation, or arcade sound.

Parameters: 1.5 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Best launch compromise for MacBook playback: more audible than the first candidate, less crest-heavy than the third, with moderate high-frequency motion and ample peak headroom.

Source master: `source-master.flight.launch`

### cue.journey-history.shimmer

> A restrained unseen route shimmer. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 1.2 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Most restrained Journey History shimmer: low crossing activity, moderate body, controlled crest, and generous headroom so the unseen route feels inviting without score or completion pressure.

Source master: `source-master.journey-history.shimmer`

### cue.movement.flight

> A very quiet seamless storybook flight texture beneath existing music: soft flowing air, silky wing motion, and sparse blended sparkle dust in one graceful continuous layer. Warm stereo, nonverbal, fatigue-free, and clear on MacBook speakers, with no individual wing beats. Smooth seamless loop. No voice, speech, singing, recognizable melody, rhythmic pulse, harsh transient, alarm, impact, battle sound, realistic simulation, or arcade sound.

Parameters: 8 seconds, prompt influence 0.3, looping on, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, preserve-stereo, peak-ceiling--6dbfs, loop-seam-qa, wav-wrap-pcm16le, decode-wav-qa.

Selection: Most suitable continuous flight bed: strongest low-crest body at the deliberately quiet movement gain, balanced stereo energy, low high-frequency crossing activity, and a validated seamless loop.

Source master: `source-master.movement.flight`

### cue.movement.glide

> A very subtle responsive storybook release accent: a small soft exhale of air with one delicate downward harp harmonic, immediate and gently settling. Nonverbal, acoustic, restrained, and clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, impact, bass hit, battle sound, realistic simulation, or arcade sound.

Parameters: 0.6 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Clearest gentle release at the quiet movement gain: strongest low-crest body with far less high-frequency crossing activity than the second candidate and safe peak headroom.

Source master: `source-master.movement.glide`

### cue.movement.rise

> A very subtle responsive storybook lift accent: a small breath of rising air with one delicate upward harp harmonic, immediate and gentle. Nonverbal, acoustic, restrained, and clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, impact, bass hit, battle sound, realistic simulation, or arcade sound.

Parameters: 0.6 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Most intelligible subtle lift at the quiet movement gain: clear short body, moderate crest factor, and substantially less high-frequency crossing activity than the second candidate.

Source master: `source-master.movement.rise`

### cue.near-miss

> Short abstract near-miss cooldown: a soft sideways ribbon-air flutter and muted wood chime settling down. Give the chime a clean rounded upper-mid attack and healthy level, audible beneath music at quiet MacBook playback, never sharp or loud. Entirely acoustic and nonverbal. No breath, gasp, human or animal vocalization, voice, speech, singing, melody, whisper-quiet output, harsh transient, alarm, aggressive impact, simulation, or arcade sound.

Parameters: 0.5 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, fit-catalog-duration, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Gemini native-audio review passed this candidate in isolation and at the exact -16.7 dB optional-detail gain beneath music and Lacewood ambience: entirely nonverbal, gentle and non-punitive, with an audible airy flutter and muted descending wood-chime contour; local Whisper screening found no credible speech.

Source master: `source-master.near-miss`

### cue.near-miss.abbey

> A restrained accent as a swinging bell rope passes close: one faint airy brush with a small distant bell glint. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 0.5 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, fit-catalog-duration, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Blinded Gemini 3.7 Flash native-audio evaluation ranked it first: the most restrained airy brush with a faint bell glint, unobtrusive and tension-free at the optional-detail gain.

Source master: `source-master.near-miss.abbey`

### cue.near-miss.pellegrino-peak

> A restrained cooldown accent of petals brushing safely past. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh wind transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 0.5 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, fit-catalog-duration, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Blinded native-audio evaluation with paid Gemini 3.7 Flash ranked Candidate Alpha > Candidate Charlie > Candidate Bravo and selected Candidate Alpha: Candidate Alpha delivers the ideal warm, delicate fairytale shimmer and soft petal texture while remaining clearly defined and restrained. Evaluator reported no uncertainty. Human MacBook-speaker and headphone listening pass still required.

Source master: `source-master.near-miss.pellegrino-peak`

### cue.near-miss.rose-garden

> A restrained garden cooldown accent of one brushed petal. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 0.5 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, fit-catalog-duration, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Blind Gemini 3.7 Flash evaluation ranked it first of three: a soft airy brush of air over a petal, gentle with no startle or fatigue risk, more restrained than the clicky snap and clearly distinct from the tiny musical chime it was compared against.

Source master: `source-master.near-miss.rose-garden`

### cue.near-miss.sapphire-sea

> A restrained sea-spray cooldown accent. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 0.5 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, fit-catalog-duration, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Blinded Gemini 3.7 Flash native-audio evaluation ranked it first for a subtle, organic flick of sea spray that stays unobtrusive and never reads as a warning or penalty, with no unwanted voice or melody; it clears the waveform gate at 48 kHz mono, 0.5 s, -12.26 dBFS peak, no clipping, and a clean trimmed tail.

Source master: `source-master.near-miss.sapphire-sea`

### cue.opening.celebration-reveal

> A restrained magical storybook reveal across a warm sparkling sea: one soft harp opening, delicate celesta light, and a gentle airy shimmer resolving with quiet wonder. Nonverbal, acoustic, warm, and clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, impact, bass hit, battle sound, realistic simulation, or arcade sound.

Parameters: 2.5 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Clearest restrained reveal for small speakers: low-noise body, controlled crest factor, and a mastered peak at the gentle -6 dBFS ceiling.

Source master: `source-master.opening.celebration-reveal`

### cue.opening.departure

> A brave but tender storybook readiness flourish for a young princess and her friendly flying unicorn: two soft rising harp gestures, a warm celesta glint, and a calm airy resolve. Nonverbal, acoustic, encouraging, and clear on MacBook speakers. No voice, speech, singing, recognizable melody, fanfare blast, harsh transient, alarm, impact, battle sound, realistic simulation, or arcade sound.

Parameters: 2.5 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Strongest gentle readiness balance for small speakers: clear sustained body, the lowest crest factor, and low high-frequency crossing activity without approaching the asset ceiling.

Source master: `source-master.opening.departure`

### cue.opening.star-scatter

> A playful airy storybook whoosh scatters seven tiny magical lights: a soft wind sweep followed by a brief spray of delicate celesta sparkles, surprising but gentle and non-startling. Nonverbal, acoustic, warm, and clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, impact, bass hit, battle sound, realistic simulation, or arcade sound.

Parameters: 2.5 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Best-balanced airy scatter: clear enough for small speakers, moderate RMS energy, and less transient-heavy than the first candidate while staying under the -6 dBFS asset ceiling.

Source master: `source-master.opening.star-scatter`

### cue.path-choice.available

> A quiet invitation without reward language. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 0.8 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Best quiet Path Choice invitation: clearly audible body, moderate crossing activity, controlled crest factor, and ample headroom without using a reward-like or emphatic transient.

Source master: `source-master.path-choice.available`

### cue.path-choice.cloister.arches

> A sunlit arch choice response. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 1.4 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, fit-catalog-duration, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Candidate B best captures the 'sunlit' warm fairytale cue intent with a rich, rounded celesta/bell sparkle that balances warmth and clarity on MacBook speakers without being overly piercing over repeated plays.

Source master: `source-master.path-choice.cloister.arches`

### cue.path-choice.cloister.clouds

> A soft cloud choice response. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 1.4 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, fit-catalog-duration, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Candidate A provides the warmest and most cloud-like tactile quality with its soft, gentle harp and celesta arpeggio. It presents zero startle risk, clean laptop playback, and establishes a balanced, non-hierarchical path choice alternative to the reference cue.

Source master: `source-master.path-choice.cloister.clouds`

### cue.path-choice.lacewood.canopy

> A airy ribbon choice response. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 1.4 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, fit-catalog-duration, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Best airy canopy choice response: clear sustained body, low crossing activity, controlled crest factor, and a safe mastered peak that reads as authored difference without extra value or difficulty.

Source master: `source-master.path-choice.lacewood.canopy`

### cue.path-choice.lacewood.floor

> A warm rose choice response. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 1.4 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, fit-catalog-duration, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Best warm rose-lit choice response: lowest crossing activity, strongest low-crest body, and the same safe peak ceiling, making it clearly related to but warmer than the canopy response without implying greater reward.

Source master: `source-master.path-choice.lacewood.floor`

### cue.path-choice.sapphire-sea.open-water

> A calm open sparkling water choice response. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 1.4 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, fit-catalog-duration, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Blinded Gemini 3.7 Flash native-audio evaluation ranked it first for calm liquid-droplet character that acknowledges the open-water route without any success or correctness connotation, staying distinct from the shore acknowledgement, with no unwanted voice or melody; it clears the waveform gate at 48 kHz mono, 1.4 s, -12.33 dBFS peak, no clipping, and a clean trimmed tail.

Source master: `source-master.path-choice.sapphire-sea.open-water`

### cue.path-choice.sapphire-sea.shore

> A calm shell-lined shore choice response. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 1.4 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, fit-catalog-duration, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: The blinded Gemini 3.7 Flash favourite failed the waveform gate at a -47.96 dBFS peak, roughly 30 dB under its sibling cues and inaudible under the soundtrack; this second-ranked candidate is a calm, non-judgmental bell acknowledgement with no reward or correctness connotation and no unwanted voice or melody, and it clears the waveform gate at 48 kHz mono, 1.4 s, -16.31 dBFS peak, no clipping, and a clean trimmed tail.

Source master: `source-master.path-choice.sapphire-sea.shore`

### cue.place.abbey

> Calm sunlit abbey courtyard air beneath the music: still warm stone, soft garden leaves, and sparse distant bells far away. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers, with a smooth seamless loop. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 12 seconds, prompt influence 0.3, looping on, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, preserve-stereo, peak-ceiling--6dbfs, loop-seam-qa, wav-wrap-pcm16le, decode-wav-qa.

Selection: Blinded Gemini 3.7 Flash native-audio evaluation ranked it first for the Abbey courtyard: delicate airy air with genuinely sparse, distant bells, best gentleness and lowest fatigue risk, a validated seamless loop, and quiet -22.8 dBFS peaks that sit under the soundtrack.

Source master: `source-master.place.abbey`

### cue.place.cloister

> An open-air hush and soft high breeze under the existing music. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers, with a smooth seamless loop. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 12 seconds, prompt influence 0.3, looping on, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, preserve-stereo, peak-ceiling--6dbfs, loop-seam-qa, wav-wrap-pcm16le, decode-wav-qa.

Selection: Candidate B provides the warmest and most enchanting fairytale atmosphere while maintaining a calm, seamless texture that easily layers under foreground music. Candidate A is also an excellent, non-intrusive airy hush, while Candidate C has a slightly peaky resonant swell midway through.

Source master: `source-master.place.cloister`

### cue.place.lacewood

> A shaded leaves and silver ribbons under the existing music. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers, with a smooth seamless loop. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 12 seconds, prompt influence 0.3, looping on, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, preserve-stereo, peak-ceiling--6dbfs, loop-seam-qa, wav-wrap-pcm16le, decode-wav-qa.

Selection: The validated replacement is the only candidate with a passing seamless loop; it also provides strong low-crest ambience body, a safe -6 dBFS peak, and sufficient soft natural detail beneath the soundtrack.

Source master: `source-master.place.lacewood`

### cue.place.pellegrino-peak

> A wide cool mountain breeze high above the coast with restrained flower detail under the existing music. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers, with a smooth seamless loop. No voice, speech, singing, recognizable melody, harsh wind transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 12 seconds, prompt influence 0.3, looping on, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, preserve-stereo, peak-ceiling--6dbfs, loop-seam-qa, wav-wrap-pcm16le, decode-wav-qa.

Selection: Blinded native-audio evaluation with paid Gemini 3.7 Flash ranked Candidate Charlie > Candidate Alpha > Candidate Bravo and selected Candidate Charlie: Candidate Charlie delivers a warm, gentle, and airy mountain breeze texture with subtle fairytale shimmer that will loop cleanly under music. Evaluator reported no uncertainty. Human MacBook-speaker and headphone listening pass still required.

Source master: `source-master.place.pellegrino-peak`

### cue.place.rose-garden

> Calm outdoor field recording of a sunlit rose garden: warm steady breeze moving through rose leaves and petals, soft continuous foliage rustle, and one or two very distant soft birds far in the background. Natural ambience only, even and unobtrusive, seamless loop, clear on MacBook speakers. No voice, singing, choir, vocal pad, synth pad, drone, music, melody, harsh transient, alarm, impact, or arcade sound.

Parameters: 12 seconds, prompt influence 0.3, looping on, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, preserve-stereo, peak-ceiling--6dbfs, loop-seam-qa, wav-wrap-pcm16le, decode-wav-qa.

Selection: Second batch after a re-authored prompt; blind Gemini 3.7 Flash evaluation ranked it first of three as a warm filtered breeze and subtle leaf rustle with no unwanted voice, no audible loop seam, no startle risk, and no fatigue risk, where a rival's distinctive bird calls would repeat noticeably over twelve seconds and the other read as static wind noise. Every candidate of the first batch was rejected for sung and choral vocal content.

Source master: `source-master.place.rose-garden`

### cue.place.sapphire-sea

> A gentle rhythmic coast with soft rolling waves and restrained sparkle under the existing music. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers, with a smooth seamless loop. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 12 seconds, prompt influence 0.3, looping on, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, preserve-stereo, peak-ceiling--6dbfs, loop-seam-qa, wav-wrap-pcm16le, decode-wav-qa.

Selection: Blinded Gemini 3.7 Flash native-audio evaluation ranked it first for semantic fit, clarity, and low fatigue as a rhythmic coast bed under music, with no unwanted voice or melody; it also clears the waveform gate at 48 kHz stereo, 12.0 s, -6 dBFS peak, no clipping, and a passing loop seam.

Source master: `source-master.place.sapphire-sea`

### cue.playful-bump.abbey

> A soft nonthreatening nudge against a swinging bell rope: one muffled warm knock with a tiny friendly bell shiver and no impact. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 0.8 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Blinded Gemini 3.7 Flash native-audio evaluation ranked it first: a warm muffled bell-rope knock with a friendly bell shiver, gentle and non-threatening with no damage or peril convention.

Source master: `source-master.playful-bump.abbey`

### cue.playful-bump.cloister

> A soft nonthreatening cloud bump. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 0.8 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Candidate B delivers the warmest, most pillowy 'cloud bump' feel with perfectly soft transients and balanced resonance for MacBook speakers. It avoids all startle or fatigue risks while maintaining clear distinctness from the reference cue.

Source master: `source-master.playful-bump.cloister`

### cue.playful-bump.lacewood

> A soft nonthreatening ribbon bump. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 0.8 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Best soft Lacewood Playful Bump: audible body with the lowest crest factor, substantial peak headroom, and no ceiling-hitting transient, keeping the ribbon contact gentle and nonthreatening.

Source master: `source-master.playful-bump.lacewood`

### cue.playful-bump.pellegrino-peak

> A soft nonthreatening mountain-flower bump. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh wind transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 0.8 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Blinded native-audio evaluation with paid Gemini 3.7 Flash ranked Candidate Charlie > Candidate Alpha > Candidate Bravo and selected Candidate Charlie: Candidate Charlie offers the most organic and gentle storybook texture with excellent clarity on small speakers. Evaluator reported no uncertainty. Human MacBook-speaker and headphone listening pass still required.

Source master: `source-master.playful-bump.pellegrino-peak`

### cue.playful-bump.rose-garden

> A soft nonthreatening rose garland bump with drifting petals. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 0.8 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Blind Gemini 3.7 Flash evaluation ranked it first of three: an airy delicate bump with drifting petals and a cushioned wobble, gentle with no startle or fatigue risk, where one rival was an abrasive scratchy rip and the other a dry papery rustle.

Source master: `source-master.playful-bump.rose-garden`

### cue.playful-bump.sapphire-sea

> A soft nonthreatening wave bump. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 0.8 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Blinded Gemini 3.7 Flash native-audio evaluation ranked it first for a gentle wave surge that reads as a friendly nudge rather than a collision, with low startle risk and no unwanted voice or melody; one rejected candidate carried an audible human whoop. It clears the waveform gate at 48 kHz mono, 0.8 s, -8.44 dBFS peak, no clipping, and a clean trimmed tail.

Source master: `source-master.playful-bump.sapphire-sea`

### cue.rainbow-path.open

> A magical travel stage. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 2.5 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, fit-catalog-duration, preserve-stereo, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Best Rainbow Path and Family Guest travel stage: strong stereo body, low crossing activity, moderate crest, and a controlled -6 dBFS peak for a magical journey that stays gentle under the music duck.

Source master: `source-master.rainbow-path.open`

### cue.rainbow-path.pellegrino-peak

> An open-air magical travel stage above a flowered mountain peak. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh wind transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 2.5 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, fit-catalog-duration, preserve-stereo, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Blinded native-audio evaluation with paid Gemini 3.7 Flash ranked Candidate Charlie > Candidate Alpha > Candidate Bravo and selected Candidate Charlie: Candidate Charlie offers a beautiful, warm harp and shimmer texture that feels perfectly suited to an open-air mountain stage while maintaining complete gentleness. Evaluator reported no uncertainty. Human MacBook-speaker and headphone listening pass still required.

Source master: `source-master.rainbow-path.pellegrino-peak`

### cue.story.confirmation

> A very short gentle nonverbal storybook confirmation: one soft celesta-like bell with a warm airy shimmer and clean natural decay, friendly and delicate on small speakers. No voice, speech, singing, recognizable melody, alarm, impact, harsh transient, bass hit, or arcade sound.

Parameters: 0.6 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le.

Selection: Best-balanced gentle bell-like cue: clearly audible on small speakers, controlled decay, no large harsh transient, and comfortably below the -6 dBFS ceiling.

Source master: `source-master.story.confirmation`

### cue.vignette.abbey.bell-high

> A single warm golden bell note in a bright upper register, struck softly and decaying cleanly, clearly related to the lower notes. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 1.6 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Blinded Gemini 3.7 Flash native-audio evaluation ranked it first: a luminous upper-register bell with a soft transient and clean decay that completes the rising phrase without shrillness or ear fatigue.

Source master: `source-master.vignette.abbey.bell-high`

### cue.vignette.abbey.bell-low

> A single warm golden bell note in a low, round register, struck softly and decaying cleanly into calm courtyard air. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 1.6 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Blinded Gemini 3.7 Flash native-audio evaluation ranked it first: the warmest, most rounded low fundamental with a soft unmetallic attack and gentle storybook decay, and it opens the three-note phrase without harshness.

Source master: `source-master.vignette.abbey.bell-low`

### cue.vignette.abbey.bell-middle

> A single warm golden bell note in a middle register, struck softly and decaying cleanly, clearly related to the low note. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 1.6 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Blinded Gemini 3.7 Flash native-audio evaluation ranked it first: a warm, round middle-register bell with an exceptionally gentle mallet transient that stays clearly related to, and distinguishable from, the low note.

Source master: `source-master.vignette.abbey.bell-middle`

### cue.vignette.abbey.bell-settle

> A soft settling golden bell resonance letting a just-played note rest, quiet and unhurried, with no new strike. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 1.2 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Blinded Gemini 3.7 Flash native-audio evaluation ranked it first and rejected the alternatives for adding new strikes: this is an attackless warm shimmering tail that settles under a released note instead of competing with it.

Source master: `source-master.vignette.abbey.bell-settle`

### cue.vignette.cloister.arches

> An airy sunlit arch response. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 1.4 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, fit-catalog-duration, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Candidate A best encapsulates the 'airy sunlit arch' concept with an open, luminous upward chime sparkle. It maintains zero startle risk, has pristine timbral definition on MacBook speakers, and complements the reference canopy interaction seamlessly without feeling repetitive.

Source master: `source-master.vignette.cloister.arches`

### cue.vignette.cloister.clouds

> A soft cloud drift response. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 1.4 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, fit-catalog-duration, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Candidate A perfectly captures the 'cloud drift' sensation with its warm, descending celesta/harp texture and gentle airy envelope. It provides a distinct contrast to the sunlit-arch reference cue while avoiding any harsh frequencies on MacBook speakers.

Source master: `source-master.vignette.cloister.clouds`

### cue.vignette.lacewood.rose-lights

> A soft rose light response. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 1.4 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, fit-catalog-duration, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Best warm rose-light response: strongest clear body with the lowest crest factor of the audible candidates, controlled mastered peak, and enough brightness to remain distinct from the airy canopy cue.

Source master: `source-master.vignette.lacewood.rose-lights`

### cue.vignette.lacewood.silver-ribbons

> A soft ribbon response. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 1.4 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, fit-catalog-duration, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Clearest soft ribbon response for MacBook speakers: strongest usable body, lowest crest factor, moderate crossing activity, and generous peak headroom without a harsh transient.

Source master: `source-master.vignette.lacewood.silver-ribbons`

### cue.vignette.pellegrino-peak.updraft

> A buoyant rising flower-petal updraft that lifts gently and never sounds forceful. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh wind transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 1.4 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, fit-catalog-duration, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Blinded native-audio evaluation with paid Gemini 3.7 Flash ranked Candidate Bravo > Candidate Charlie > Candidate Alpha and selected Candidate Bravo: Candidate Bravo best fulfills the gentle storybook soundscape with its warm acoustic harp flourish and buoyant, unforced rising gesture. Evaluator reported no uncertainty. Human MacBook-speaker and headphone listening pass still required.

Source master: `source-master.vignette.pellegrino-peak.updraft`

### cue.vignette.rose-garden.awakening-roses

> A soft petal opening with one gentle plucked magical note as roses wake together. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 1.4 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, fit-catalog-duration, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Blind Gemini 3.7 Flash evaluation ranked it first of three: it alone reads as a blooming blossom, a soft airy unfurling into one warm bell note, with no startle risk, no fatigue risk, no unwanted voice or music, and no artifacts, while the other two read as generic chime shimmer.

Source master: `source-master.vignette.rose-garden.awakening-roses`

### cue.vignette.sapphire-sea.open-water

> A bright open sparkling water response. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 1.4 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, fit-catalog-duration, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Blinded Gemini 3.7 Flash native-audio evaluation ranked it first for bright bubbling water texture blended with restrained fairytale shimmer, clearly distinct from the shore response and never reward-like, with no unwanted voice or melody; it clears the waveform gate at 48 kHz mono, 1.4 s, -15.5 dBFS peak, no clipping, and a clean trimmed tail.

Source master: `source-master.vignette.sapphire-sea.open-water`

### cue.vignette.sapphire-sea.shore

> A soft shell-lined shore response. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 1.4 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, fit-catalog-duration, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Blinded Gemini 3.7 Flash native-audio evaluation ranked it first for shell-like tactile texture and warm shimmer that reads as a shore interaction rather than a reward chime, with no unwanted voice or melody; it clears the waveform gate at 48 kHz mono, 1.4 s, -15.5 dBFS peak, no clipping, and a clean trimmed tail.

Source master: `source-master.vignette.sapphire-sea.shore`

<!-- soundscape-build:end -->
