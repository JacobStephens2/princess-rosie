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

Execution: built-in OpenAI image-generation tool. `public/assets/storybook-key-art.png` provided the visual style and Fairytale Sicily reference; `public/assets/celebration-art.png` provided Gigi's established appearance. Two targeted edits raised the cake and crown into the crop-safe area and replaced the generated candle flame with a short dark wick.

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

Execution: built-in OpenAI image-generation tool. `public/assets/storybook-key-art.png` provided the visual style, palette, architecture, landscape, rose, lace, cloud, sea, castle, and luminous-gold reference.

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

Execution: built-in OpenAI image-generation tool. `public/assets/storybook-key-art.png` provided the identity reference for Princess Rosie and Stella as well as the visual style, palette, roses, lace, sky, and Fairytale Sicily.

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

## Opening flight: Rose Garden background plate

Execution: built-in OpenAI image-generation tool. `shared/edition/source-media/opening-storybook/rosie-stella-departure.png` provided the approved Rose Garden palette, architecture, lighting, and picture-book style.

> Use case: production game background layer
> Asset type: 16:9 character-free flight background plate for native Godot parallax
> Primary request: preserve the approved sunny rose-covered garden terrace, cream arches, sapphire sky and sea, distant flowered hills, silver lace ribbons, and warm picture-book lighting while removing Princess Rosie, Stella, the Birthday Star, and every character-shaped foreground subject
> Composition/framing: continuous spacious Rose Garden vista with clear sky and garden depth behind the flight path; fill the complete 16:9 frame without text or interface elements
> Constraints: no people, unicorns, animals, Birthday Stars, written text, watermark, logos, checkerboard, empty cutout holes, photorealism, named-studio imitation, 3D render, or anime

Output: `shared/edition/source-media/flight/rose-garden-background.png`

## Opening flight: Rosie and Stella character layer

Execution: OpenAI Image API CLI fallback, `gpt-image-1.5`, high quality and input fidelity, transparent 1536×1024 PNG. `shared/edition/source-media/opening-storybook/rosie-stella-departure.png` provided the approved fictional character identities and illustration style.

> Use case: production game character-layer extraction. Preserve exactly the approved characters and picture-book illustration style from the reference: young Princess Rosie with long golden-blonde hair, small gold crown, joyful expression, ornate bright pink rose-patterned dress and pink shoes, seated astride Stella; Stella is a friendly white winged unicorn with a pastel pink-purple-blue mane and tail, rainbow horn, two large lavender feathered wings, gold-and-heart bridle, complete body with all four legs and hooves. Isolate only Rosie riding Stella as one complete cohesive character cutout. Remove the garden, archways, sky, sea, flowers, ribbons, star, floor, scenery, shadows, and every other object. Keep the entire silhouette fully inside the canvas with generous transparent padding and no cropping. Output a genuine RGBA PNG with fully transparent pixels everywhere outside the clean character silhouette. No checkerboard, no painted transparency pattern, no white matte, no rectangular background, no halo, no text, no added objects, no anatomy changes, no duplicate limbs or wings.

Output: `shared/edition/source-media/flight/rosie-stella.png`

## Birthday Castle celebration illustration

Execution: Inkvoke 1.0.1, GPT Image 2, high quality, 1680×944 PNG.

> Use case: illustration-story. Asset type: 16:9 finale illustration for a gentle browser game for a four-year-old. Inside a magnificent warm golden mosaic birthday castle in bright fairytale Sicily, Princess Rosie and her friendly white flying unicorn Stella have arrived at Princess Zelies joyful birthday celebration. Princess Rosie is a fictional pale-skinned blonde storybook child in a rose-pink medieval-fantasy dress and small gold crown. Stella has lavender wings, a pink-lavender mane, and a luminous rainbow-striped horn. Gigi, a tall friendly giraffe party keeper with a flower garland, dances beside them. A happy small family group claps around a birthday table: Mom with long straight dirty-blonde hair and jeans; Dad with brown hair, T-shirt under an open short-sleeve shirt; Gram with short brown permed curls; Pop with short light strawberry-blonde hair; Aunt with dirty-blonde hair in a bun and bangs; taller Uncle with brown almost-pompadour hair and brown shoes; and Beasley, an orange-and-white cat, pouncing at confetti. Premium flat modern childrens picture-book illustration, solid color blocks, gently rounded shapes, limited soft shadows, subtle paper texture, expressive friendly faces. Wide cinematic 16:9 composition, all figures clearly visible, dancing and clapping, rose garlands, rainbow ribbons, seven golden mosaic stars shining overhead, confetti and soft fireworks through the open arches. Blush pink, lavender, sapphire, warm cream, jewel tones, luminous mosaic gold. Sunny, safe, buoyant, celebratory. No written text, no watermark, no logos, no photorealism, no scary imagery, no religious figures, no extra people, no weapons, no peril. Original style, not Disney or any named studio, no 3D render, no anime, no realistic child portrait.

Output: `public/assets/celebration-art.png`

## Instrumental soundtrack

Execution: Mureka API, model `mureka-9`, one non-streaming instrumental; locally reduced in volume and encoded to 128 kbps MP3.

> Joyful whimsical instrumental soundtrack for a gentle childrens picture-book flying game, about two minutes, bright fairytale Sicily, pizzicato strings, celesta, glockenspiel, soft hand percussion, warm woodwinds, graceful three-four waltz pulse, playful and magical, calm enough for a four-year-old, clear celebratory lift near the ending, no vocals, no darkness, seamless-feeling loop

Output: `public/assets/audio/birthday-flight.mp3`

<!-- soundscape-build:start -->
## Fairytale Soundscape

Credit: ElevenLabs Sound Effects API. This project documentation records the provider; No in-game provider credit is added.

### cue.flight.launch

> A buoyant gentle storybook flight launch: a soft upward rush of warm air, one light harp sweep, and a tiny celesta lift that settles forward without a hard landing. Nonverbal, acoustic, joyful, and clear on MacBook speakers. No voice, speech, singing, recognizable melody, fanfare blast, harsh transient, alarm, impact, battle sound, realistic simulation, or arcade sound.

Parameters: 1.5 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Best launch compromise for MacBook playback: more audible than the first candidate, less crest-heavy than the third, with moderate high-frequency motion and ample peak headroom.

Source master: `source-master.flight.launch`

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

### cue.story.confirmation

> A very short gentle nonverbal storybook confirmation: one soft celesta-like bell with a warm airy shimmer and clean natural decay, friendly and delicate on small speakers. No voice, speech, singing, recognizable melody, alarm, impact, harsh transient, bass hit, or arcade sound.

Parameters: 0.6 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le.

Selection: Best-balanced gentle bell-like cue: clearly audible on small speakers, controlled decay, no large harsh transient, and comfortably below the -6 dBFS ceiling.

Source master: `source-master.story.confirmation`

<!-- soundscape-build:end -->
