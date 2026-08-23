# Media generation prompts

The game remains playable without generation services. These calls produced the polished, local media bundled with the static site; no runtime API calls or credentials ship to players.

## Opening storybook cover illustration

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

## Opening Storybook Moment: Rosi and Stella depart

Execution: built-in OpenAI image-generation tool. `public/assets/storybook-key-art.png` provided the identity reference for Princess Rosi and Stella as well as the visual style, palette, roses, lace, sky, and Fairytale Sicily. Targeted edits compacted Rosi, Stella, both wings, and the single Star into the upper-center crop-safe area.

> Use case: illustration-story
> Asset type: 16:9 full-screen Opening Storybook Moment background for a gentle browser game for a four-year-old
> Primary request: Princess Rosi has just climbed onto Stella in Rosalia's Rose Garden and they are ready to find the Birthday Stars
> Scene/backdrop: a rose-crowned garden terrace with warm cream arches, pink roses, fresh green leaves, silver lace ribbons, flowered hills, and sunny sapphire sky
> Subject: preserve the cover's fictional Princess Rosi and Stella designs; Stella stands safely on the garden path with two lavender wings beginning to open while Rosi sits securely with a brave, joyful expression; exactly one distant golden mosaic Birthday Star glows ahead
> Style/medium: match the cover's premium flat modern children's picture-book illustration, solid color blocks, gently rounded shapes, limited soft shadows, subtle paper texture, and expressive friendly faces
> Composition/framing: wide cinematic 16:9 medium-wide three-quarter view; keep both faces, Rosi's torso, Stella's rainbow horn and two wings, and the single Star in the central crop-safe area above the lower 35 percent reserved for the HTML story card
> Lighting/mood: one continuous sunny day, hopeful rose-tinted morning, safe, brave, affectionate, and anticipatory
> Color palette: blush and rose pink, fresh garden green, lavender, sapphire, warm cream, restrained rainbow accents, and luminous mosaic gold
> Constraints: exactly Princess Rosi and Stella with no other characters; exactly one Birthday Star and no other star shapes; Stella has exactly one rainbow horn and two wings; no falling or peril; no written text, watermark, logos, photorealism, scary imagery, weapons, religious figures, or symbols; coherent anatomy and rider contact
> Avoid: high flight, castle arrival, extra crowns, horns, wings, limbs, characters, or Family Guests; danger, realistic child portrait, named-studio imitation, 3D render, anime

Source: `art-source/opening-storybook/rosi-stella-departure.png`

Deployed output: `public/assets/storybook-rosi-stella-departure.webp`

## Birthday Castle celebration illustration

Execution: Inkvoke 1.0.1, GPT Image 2, high quality, 1680×944 PNG.

> Use case: illustration-story. Asset type: 16:9 finale illustration for a gentle browser game for a four-year-old. Inside a magnificent warm golden mosaic birthday castle in bright fairytale Sicily, Princess Rosi and her friendly white flying unicorn Stella have arrived at Princess Zelies joyful birthday celebration. Princess Rosi is a fictional pale-skinned blonde storybook child in a rose-pink medieval-fantasy dress and small gold crown. Stella has lavender wings, a pink-lavender mane, and a luminous rainbow-striped horn. Gigi, a tall friendly giraffe party keeper with a flower garland, dances beside them. A happy small family group claps around a birthday table: Mom with long straight dirty-blonde hair and jeans; Dad with brown hair, T-shirt under an open short-sleeve shirt; Gram with short brown permed curls; Pop with short light strawberry-blonde hair; Aunt with dirty-blonde hair in a bun and bangs; taller Uncle with brown almost-pompadour hair and brown shoes; and Beasley, an orange-and-white cat, pouncing at confetti. Premium flat modern childrens picture-book illustration, solid color blocks, gently rounded shapes, limited soft shadows, subtle paper texture, expressive friendly faces. Wide cinematic 16:9 composition, all figures clearly visible, dancing and clapping, rose garlands, rainbow ribbons, seven golden mosaic stars shining overhead, confetti and soft fireworks through the open arches. Blush pink, lavender, sapphire, warm cream, jewel tones, luminous mosaic gold. Sunny, safe, buoyant, celebratory. No written text, no watermark, no logos, no photorealism, no scary imagery, no religious figures, no extra people, no weapons, no peril. Original style, not Disney or any named studio, no 3D render, no anime, no realistic child portrait.

Output: `public/assets/celebration-art.png`

## Instrumental soundtrack

Execution: Mureka API, model `mureka-9`, one non-streaming instrumental; locally reduced in volume and encoded to 128 kbps MP3.

> Joyful whimsical instrumental soundtrack for a gentle childrens picture-book flying game, about two minutes, bright fairytale Sicily, pizzicato strings, celesta, glockenspiel, soft hand percussion, warm woodwinds, graceful three-four waltz pulse, playful and magical, calm enough for a four-year-old, clear celebratory lift near the ending, no vocals, no darkness, seamless-feeling loop

Output: `public/assets/audio/birthday-flight.mp3`

<!-- soundscape-build:start -->
## Fairytale Soundscape

Credit: ElevenLabs Sound Effects API. This project documentation records the provider; No in-game provider credit is added.

### cue.birthday-star-moment.lacewood

> A lacewood resolution accent. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 2 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Best Gram Birthday Star Moment resolution: clear sustained body, low crossing activity, controlled crest, and safe peak headroom for a warm place-specific close after the Rainbow Path travel stage.

Source master: `source-master.birthday-star-moment.lacewood`

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

> A restrained cooldown accent. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 0.5 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, fit-catalog-duration, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Best restrained near-miss accent: lowest crossing activity with compact low-crest energy, producing a clear but non-alarming detail that remains subtle at the optional-detail gain.

Source master: `source-master.near-miss`

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

### cue.place.lacewood

> A shaded leaves and silver ribbons under the existing music. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers, with a smooth seamless loop. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 12 seconds, prompt influence 0.3, looping on, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, preserve-stereo, peak-ceiling--6dbfs, loop-seam-qa, wav-wrap-pcm16le, decode-wav-qa.

Selection: The validated replacement is the only candidate with a passing seamless loop; it also provides strong low-crest ambience body, a safe -6 dBFS peak, and sufficient soft natural detail beneath the soundtrack.

Source master: `source-master.place.lacewood`

### cue.place.sapphire-sea

> A gentle rhythmic coast with soft rolling waves and restrained sparkle under the existing music. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers, with a smooth seamless loop. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 12 seconds, prompt influence 0.3, looping on, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, preserve-stereo, peak-ceiling--6dbfs, loop-seam-qa, wav-wrap-pcm16le, decode-wav-qa.

Selection: Blinded Gemini 3.7 Flash native-audio evaluation ranked it first for semantic fit, clarity, and low fatigue as a rhythmic coast bed under music, with no unwanted voice or melody; it also clears the waveform gate at 48 kHz stereo, 12.0 s, -6 dBFS peak, no clipping, and a passing loop seam.

Source master: `source-master.place.sapphire-sea`

### cue.playful-bump.lacewood

> A soft nonthreatening ribbon bump. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 0.8 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Best soft Lacewood Playful Bump: audible body with the lowest crest factor, substantial peak headroom, and no ceiling-hitting transient, keeping the ribbon contact gentle and nonthreatening.

Source master: `source-master.playful-bump.lacewood`

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

### cue.story.confirmation

> A very short gentle nonverbal storybook confirmation: one soft celesta-like bell with a warm airy shimmer and clean natural decay, friendly and delicate on small speakers. No voice, speech, singing, recognizable melody, alarm, impact, harsh transient, bass hit, or arcade sound.

Parameters: 0.6 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le.

Selection: Best-balanced gentle bell-like cue: clearly audible on small speakers, controlled decay, no large harsh transient, and comfortably below the -6 dBFS ceiling.

Source master: `source-master.story.confirmation`

### cue.vignette.lacewood.canopy

> A soft ribbon response. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 1.4 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, fit-catalog-duration, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Clearest soft ribbon response for MacBook speakers: strongest usable body, lowest crest factor, moderate crossing activity, and generous peak headroom without a harsh transient.

Source master: `source-master.vignette.lacewood.canopy`

### cue.vignette.lacewood.floor

> A soft rose light response. Warm nonverbal Fairytale Soundscape with soft bells, celesta, harp, airy shimmer, and gentle natural texture as appropriate, clear on MacBook speakers. No voice, speech, singing, recognizable melody, harsh transient, alarm, aggressive impact, battle sound, realistic simulation, or arcade sound.

Parameters: 1.4 seconds, prompt influence 0.3, looping off, source format `pcm_48000`.

Production treatment: inspect-pcm-s16le, trim-boundary-silence, fit-catalog-duration, downmix-stereo-to-mono, fade-in-10ms, fade-out-20ms, peak-ceiling--6dbfs, wav-wrap-pcm16le, decode-wav-qa.

Selection: Best warm rose-light response: strongest clear body with the lowest crest factor of the audible candidates, controlled mastered peak, and enough brightness to remain distinct from the airy canopy cue.

Source master: `source-master.vignette.lacewood.floor`

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

## Sapphire Sea audio evaluation record

Every Sapphire Sea cue above was produced through the bounded resumable generator and graded under
[the audio evaluation policy](agents/audio-evaluation.md). The managed section records each approved
selection; this section records the surrounding evidence.

Native-audio evaluator: paid Gemini API, model `gemini-3.7-flash`, default reasoning effort, one
blinded three-candidate comparison per cue with the candidate order shuffled per cue. Waveform checks
ran independently of the generator's own QA and covered decoding, format, duration, sample rate,
channel layout, silence, DC offset, peak level, clipping, trimmed boundaries, loop-seam delta, and
stereo correlation.

| Cue | Blinded ranking (best first) | Material failure flags | Evaluator uncertainty | Selected |
| --- | --- | --- | --- | --- |
| `cue.place.sapphire-sea` | candidate-1, candidate-2, candidate-3 | candidate-3 carried overt bell melodies that would clash with the soundtrack | low | candidate-1 |
| `cue.vignette.sapphire-sea.shore` | candidate-2, candidate-1, candidate-3 | none | low | candidate-2 |
| `cue.vignette.sapphire-sea.open-water` | candidate-1, candidate-2, candidate-3 | none | low | candidate-1 |
| `cue.path-choice.sapphire-sea.shore` | candidate-2, candidate-3, candidate-1 | candidate-2 peaked at -47.96 dBFS, about 30 dB under its sibling cues and inaudible under the soundtrack; candidate-1 read as a reward sweep | low | candidate-3 |
| `cue.path-choice.sapphire-sea.open-water` | candidate-1, candidate-2, candidate-3 | none | low | candidate-1 |
| `cue.playful-bump.sapphire-sea` | candidate-3, candidate-2, candidate-1 | candidate-1 contained an audible human whoop and failed the nonverbal requirement | low | candidate-3 |
| `cue.near-miss.sapphire-sea` | candidate-3, candidate-1, candidate-2 | none | low | candidate-3 |
| `cue.birthday-star-moment.sapphire-sea` | candidate-2, candidate-3, candidate-1 | candidate-1 read as a digital reward chime | low | candidate-2 |

`cue.path-choice.sapphire-sea.shore` is the one cue where the evaluator's first choice was not taken:
the waveform gate decides mechanical requirements, and a -47.96 dBFS peak cannot carry a foreground
route acknowledgement under the soundtrack.

### Measured levels the listening pass should settle

Peak alone is a poor proxy for how loud a short cue reads, so both peak and the loudest 300 ms window
are recorded here. Two questions the ear has to answer:

| Master | Peak dBFS | Loudest 300 ms dBFS |
| --- | --- | --- |
| `path-choice-sapphire-sea-shore` | -16.31 | -23.80 |
| `path-choice-sapphire-sea-open-water` | -12.33 | -28.64 |
| `vignette-sapphire-sea-shore` | -15.48 | -28.52 |
| `vignette-sapphire-sea-open-water` | -15.46 | -27.86 |
| `path-choice-lacewood-canopy` (reference) | -6.00 | -17.47 |
| `path-choice-lacewood-floor` (reference) | -6.00 | -15.00 |

1. **Route parity.** The two sea route acknowledgements are level-matched neither on peak (open water
   is 4.0 dB hotter) nor on the loudest window (shore is 4.8 dB hotter); the two sea interactions are
   matched within 0.7 dB. The existing Lacewood pair differs by 2.5 dB on its loudest window, so this
   sits in the established range, but no route may end up reading as the louder, more rewarded choice.
2. **Masking.** Every sea cue except the ambience loop and Uncle's Moment sits 6-13 dB under the
   Lacewood cues on the loudest window, and the coast ambience is a busier bed than the woodland one.
   The cues have to stay audible under the soundtrack without the ambience masking them.

**Human listening pass: not yet complete.** The required MacBook built-in speaker and headphone pass
over the eight Sapphire Sea cues — checking rhythmic calm, route distinction, and the two questions
above — is still outstanding and retains final authority over these selections. Run it with
`apps/godot/tests/sapphire_sea_listening.gd`; see `apps/godot/README.md`.
