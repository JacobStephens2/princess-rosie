# Media generation prompts

The game remains playable without generation services. These calls produced the polished, local media bundled with the static site; no runtime API calls or credentials ship to players.

## Opening storybook illustration

Execution: built-in OpenAI image-generation tool.

> Use case: illustration-story
> Asset type: 16:9 opening and finale illustration for a gentle browser game for a four-year-old
> Primary request: a joyful princess named Rosi riding a friendly flying unicorn named Stella toward a glowing birthday castle across bright fairytale Sicily
> Scene/backdrop: sparkling sapphire sea below, rose-covered coastal hills, soft clouds forming a cloister of arches, warm golden mosaic castle in the distance, delicate silver lace ribbons carried on a playful breeze
> Subject: Princess Rosi is a fictional storybook child with pale skin and blonde hair, a rose-pink medieval-fantasy dress and small gold crown; Stella is a kind white flying unicorn with rounded proportions, lavender wings, and a luminous rainbow-striped horn
> Style/medium: premium flat modern children's picture-book illustration, solid color blocks, gently rounded shapes, limited soft shadows, subtle paper texture, expressive friendly faces
> Composition/framing: wide cinematic 16:9 landscape; Rosi and Stella large enough to read at laptop size; castle visible as destination; generous calm sky around the subjects for HTML title text overlay
> Lighting/mood: sunny, safe, buoyant, celebratory, full of wonder
> Color palette: blush pink, lavender, sapphire, warm cream, jewel tones, rainbow accents, luminous mosaic gold
> Constraints: no written text, no watermark, no logos, no photorealism, no scary imagery, no weapons, no peril, no religious figures; respectful small cross only as an architectural detail on one distant abbey; simple coherent silhouettes suitable for a polished children's web game key visual
> Avoid: Disney or any named studio style, 3D render, anime, overly intricate costume, dark cave, bones, plague motifs, realistic child portrait, extra main characters

Output: `public/assets/storybook-key-art.png`

## Birthday Castle celebration illustration

Execution: Inkvoke 1.0.1, GPT Image 2, high quality, 1680×944 PNG.

> Use case: illustration-story. Asset type: 16:9 finale illustration for a gentle browser game for a four-year-old. Inside a magnificent warm golden mosaic birthday castle in bright fairytale Sicily, Princess Rosi and her friendly white flying unicorn Stella have arrived at Princess Zelies joyful birthday celebration. Princess Rosi is a fictional pale-skinned blonde storybook child in a rose-pink medieval-fantasy dress and small gold crown. Stella has lavender wings, a pink-lavender mane, and a luminous rainbow-striped horn. Gigi, a tall friendly giraffe party keeper with a flower garland, dances beside them. A happy small family group claps around a birthday table: Mom with long straight dirty-blonde hair and jeans; Dad with brown hair, T-shirt under an open short-sleeve shirt; Gram with short brown permed curls; Pop with short light strawberry-blonde hair; Aunt with dirty-blonde hair in a bun and bangs; taller Uncle with brown almost-pompadour hair and brown shoes; and Beasley, an orange-and-white cat, pouncing at confetti. Premium flat modern childrens picture-book illustration, solid color blocks, gently rounded shapes, limited soft shadows, subtle paper texture, expressive friendly faces. Wide cinematic 16:9 composition, all figures clearly visible, dancing and clapping, rose garlands, rainbow ribbons, seven golden mosaic stars shining overhead, confetti and soft fireworks through the open arches. Blush pink, lavender, sapphire, warm cream, jewel tones, luminous mosaic gold. Sunny, safe, buoyant, celebratory. No written text, no watermark, no logos, no photorealism, no scary imagery, no religious figures, no extra people, no weapons, no peril. Original style, not Disney or any named studio, no 3D render, no anime, no realistic child portrait.

Output: `public/assets/celebration-art.png`

## Instrumental soundtrack

Execution: Mureka API, model `mureka-9`, one non-streaming instrumental; locally reduced in volume and encoded to 128 kbps MP3.

> Joyful whimsical instrumental soundtrack for a gentle childrens picture-book flying game, about two minutes, bright fairytale Sicily, pizzicato strings, celesta, glockenspiel, soft hand percussion, warm woodwinds, graceful three-four waltz pulse, playful and magical, calm enough for a four-year-old, clear celebratory lift near the ending, no vocals, no darkness, seamless-feeling loop

Output: `public/assets/audio/birthday-flight.mp3`
