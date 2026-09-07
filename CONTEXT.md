# Princess Rosie and the Seven Birthday Stars

A joyful, replayable birthday game centered on a fictional storybook hero inspired by Rosie.

## Language

**Web Edition**:
The browser-playable edition of Princess Rosie and the Seven Birthday Stars built in Phaser, TypeScript, and Vite. It is the canonical, active edition under development.
_Avoid_: Original Edition, Phaser prototype, Phaser Web Edition

**Godot Edition**:
The previous native macOS prototype built in Godot. It is archived and superseded by the Web Edition.
_Avoid_: Godot Production Edition, Unity Edition


**Princess Rosie**:
The storybook hero and elder sister through whom the child experiences the adventure. She shares Rosie's name and may use an expressly approved likeness without unrelated identifying personal details.
_Avoid_: Rosie's avatar, digital Rosie

**Princess Zélie**:
Princess Rosie's one-year-old storybook baby sister and the child celebrated at the Birthday Castle for her very first birthday. She shares Her full given name's saint-inspired nickname and may use an expressly approved likeness without unrelated identifying personal details.
_Avoid_: Princess Her full given name, the objective

**Birthday Castle**:
The joyful destination where Princess Zélie's birthday is celebrated and Princess Rosie's adventure concludes. Its celebration is one authored ending, reached identically on every journey across the Birthday Castle Approach and painted once — the Phaser Edition's approved illustration, reused rather than repainted — where the six recovered Birthday Stars join the Castle Star and Fly Again is the only invitation.
_Avoid_: Finish line, final level

**Birthday Castle Approach**:
The last stretch of the journey, flown after the sixth Birthday Star Moment against its own approved illustration of the Castle waiting ahead, while the six returning Rainbow Paths converge and the Castle Star already shines. It lasts as long as any place's Single Route, so the ending is reached rather than cut to, and the celebration illustration stays unseen until arrival.
_Avoid_: Final cutscene, castle level, outro

**Fly Again**:
The single invitation at the Birthday Castle, which begins the whole journey afresh in the first place with every Birthday Star to be found again. It replaced Dance Again, which ADR-0011 cut from the MVP.
_Avoid_: Restart button, replay level, Dance Again

**Birthday Star**:
One of seven golden, mosaic-like magical lights. Six scatter beside Family Guests across Fairytale Sicily, notice Stella nearby, joyfully fly to her, and are gathered when they arrive, opening their Rainbow Paths; the seventh is the Castle Star.
_Avoid_: Coin, point, collectible

**Castle Star**:
The seventh Birthday Star, kept safe by Dad at the Birthday Castle while the other six scatter. It is already shining before the six recovered Stars join it in a visible seven-Star constellation over the celebration, rather than being gathered during flight.
_Avoid_: Seventh scattered star, ungathered star, bonus star, seventh collectible, missing Star

**Rainbow Path**:
One of six magical routes opened by a gathered Birthday Star that carries its Family Guest safely ahead to Princess Zélie's celebration. The Castle Star never needs one.
_Avoid_: Teleporter, guest collection, seventh returning path

**Rainbow Archway**:
The golden arch crowned with rainbow bands where a Family Guest waits at the end of her place's Single Route. The Birthday Star flies to Stella there, the Rainbow Path opens, and the Storybook Stamp is awarded.
_Avoid_: Finish gate, checkpoint, goal post

**Path Choice**:
A deferred, post-MVP interaction concept in which Princess Rosie guides Stella onto one of two equally safe routes that later rejoin. Path Choices are absent from the single-route MVP.
_Avoid_: Branch, difficulty path, correct route

**Gallop and Flutter**:
The moment-to-moment guidance of Princess Rosie and Stella along an automatically advancing Storybook Ground: Stella gallops forward, leaps on tap, and flutters her magical wings on hold to glide smoothly over obstacles. Avoiding obstacles and catching high-altitude star trails provides delight and musical feedback without creating failure.
_Avoid_: Flight Control, free flight, path choice, auto-flight

**Single Route**:
The uninterrupted scenic passage through each MVP place. Gallop and Flutter changes Stella's jumping, fluttering, and encounters along it without changing the destination or story outcome.
_Avoid_: Fixed animation, Path Choice, branching route

**Stella**:
Princess Rosie's friendly Flying Unicorn, distinguished by her rainbow horn and connection to the Birthday Stars.
_Avoid_: Pegasus, alicorn, vehicle

**Gigi**:
The tall, friendly Giraffe Party Keeper of the Birthday Castle who encourages Princess Rosie and welcomes her to Princess Zélie's celebration.
_Avoid_: Quest giver, announcer

**Family Guest**:
A partygoer inspired by Rosie and Zélie's family, identified only as Mom, Dad, Pop, Gram, Aunt, or Uncle and permitted to use an expressly approved likeness.
_Avoid_: Mama, Daddy, Grandma, family portrait

**Beasley**:
The fictional orange-and-white family cat who joins the celebration as a Family Guest.
_Avoid_: Pet collectible

**Fairytale Sicily**:
The bright fantasy world surrounding the Birthday Castle, inspired by Sicily's warm coast, mountains, gardens, golden mosaics, jewel colors, and Arab-Norman architecture, with rose and lace motifs honoring the sisters' saint-inspired names.
_Avoid_: Historical Sicily, generic medieval kingdom, Moorish fantasy

**Fairytale Soundscape**:
The warm, nonverbal storybook-acoustic world of soft bells, celesta, harp, airy shimmer, and gentle natural textures that gives Princess Rosie's journey a cohesive sonic identity.
_Avoid_: Arcade soundtrack, cinematic battle audio, realistic simulation

**Place**:
One of the named passages of Fairytale Sicily the journey travels in order before the Birthday Castle: Rosalia's Rose Garden, Zélie's Lacewood, Golden Bell Abbey, the Cloister of Clouds, Pellegrino Peak, and the Sapphire Sea. Every place is declared by the same data — a name, a Family Guest and her cutout, a Place Illustration of three Scenery Layers, its playful obstacles, Springboards, and Star Sparkles along the Storybook Ground, a Rainbow Archway, a Birthday Star, a Rainbow Path, and a Birthday Star Moment sentence — and presented through one code path, so places differ in art, sound, and data rather than in behaviour. A declared place becomes flyable once its Scenery Layers are approved.
_Avoid_: Level, stage, area, world

**Place Cameo**:
A superseded Godot Edition concept in which a Family Guest was sighted mid-passage during the Single Route. In the Web Edition she waits at her Rainbow Archway instead.
_Avoid_: Companion, sidekick, obstacle, mid-level checkpoint

**Altitude Ladder**:
The ordered rungs of height a place answers to, declared in its own data. Each rung names the window of heights it covers and the delight that height awakens; heights between two rungs awaken nothing. Most places declare two rungs, one high and one low, and answer once. Golden Bell Abbey declares four and answers every crossing between them, so flying higher rings a higher bell and the bells keep following the child's hand.
_Avoid_: Altitude band as a fixed high-or-low pair, note sequencer, instrument

**Rosalia's Rose Garden**:
The rose-crowned garden where Princess Rosie and Stella begin their journey through Fairytale Sicily.
_Avoid_: Rosalia Garden, starting area

**Zélie's Lacewood**:
An enchanted forest where silver lace ribbons grow between rose-covered trees and flutter into a path for Stella, inspired by Saint Zélie's lace-making.
_Avoid_: Zélie's Woods, Lace Woods, real lacewood timber

**Golden Bell Abbey**:
A bright, reverent fantasy abbey of warm stone, bells, stained glass, and garden cloisters that Princess Rosie passes on her journey.
_Avoid_: Saint Mary Catholic School, St. Aloysius Church, church level

**Cloister of Clouds**:
A tranquil sky passage where sunlit arches and soft clouds echo an abbey cloister.
_Avoid_: Cloud level

**Pellegrino Peak**:
The high, flowered mountain passage inspired by Monte Pellegrino above Palermo.
_Avoid_: Monte Pellegrino, mountain level

**Sapphire Sea**:
The sparkling coastal passage before the Birthday Castle comes into view.
_Avoid_: Water level, Mediterranean Sea

**Storybook Ground**:
The walkable path along the bottom of the Place Illustration where Stella gallops, lands, and encounters playful obstacles and springboards.
_Avoid_: Bump Floor, collision layer, floor hazard

**Playful Stumble**:
A soft, bouncy encounter with an obstacle on the Storybook Ground that makes Stella wobble and briefly slow down without danger, injury, or loss of progress.
_Avoid_: Playful Bump, damage, death, life loss, penalty

**Springboard**:
A themed, bouncy environmental element (such as a giant rose, abbey bell, or cloud updraft) that joyfully launches Stella high into the sky to reveal the Place Illustration and collect celestial Star Sparkles.
_Avoid_: Trampoline, jump pad, bounce pad

**Near Miss**:
The place's answer when Stella leaps cleanly over an obstacle without touching it, sounding an airy sparkle chime once the clean jump is complete.
_Avoid_: Dodge, close call, bonus, combo

**Star Sparkle**:
A floating musical light scattered along high and low paths that chimes an ascending harp or celesta note when gathered during Gallop and Flutter.
_Avoid_: Coin, point, gem, mini-star

**Storybook Stamp**:
A celebratory illustrated memento of a Family Guest, awarded upon completing a place's Rainbow Archway and collected into the Birthday Castle celebration album.
_Avoid_: Achievement, trophy, badge

**Storybook Moment**:
A short, lightly animated illustrated scene with a few large sentences intended for the Grown-up Helper to read aloud with the child.
_Avoid_: Cutscene, exposition screen

**Storybook Stage**:
The cinematic 16:9 frame containing every essential story, play, and text element; taller displays extend its illustrated surroundings without cropping the frame.
_Avoid_: Canvas, viewport, black bars

**Flight Presentation**:
The illustrated, lightly animated view of Princess Rosie and Stella traveling through each place during active play, distinct from the journey rules it makes visible.
_Avoid_: Fly-through, gameplay skin, background swap

**Place Illustration**:
The layered scenery painting that establishes one place during the Flight Presentation. It is painted wider than the Storybook Stage and separated into three Scenery Layers that travel past at different depths as Stella advances, while gameplay-significant characters, Birthday Stars, and encounters remain distinct interactive elements.
_Avoid_: Background plate, wallpaper, single-screen backdrop

**Scenery Layer**:
One of the three depths, far, middle, and near, that together form a Place Illustration and travel past at their own pace as Stella advances. The far layer is a single painting; the middle and near layers are compositions of Set Pieces, and only the near layer, which carries the Storybook Ground, may repeat within a place.
_Avoid_: Parallax layer, depth layer, background layer

**Set Piece**:
One authored transparent painting, such as an arch cluster, a bell tower, or a rose wall, placed along a Scenery Layer by its place's data. Most Set Pieces belong to one place; a small shared library holds generic pieces any place may borrow.
_Avoid_: Prop, tile, decal

**Opening Storybook Moment**:
A Storybook Moment before the flight begins, comprising the title-cover moment and the three moments that establish the celebration, the scattered Birthday Stars, and Princess Rosie's promise to help.
_Avoid_: Opening page, intro screen

**Birthday Star Moment**:
A Storybook Moment during the flight that celebrates a gathered Birthday Star and the opening of its Family Guest's Rainbow Path. It is composed at runtime from the current Place Illustration held and dimmed, the shared Family Guest cutout and Rainbow Path treatment, and the place's own sentence, rather than being painted per place.
_Avoid_: Collectible popup, checkpoint modal

**Grown-up Helper**:
An adult who sits alongside the child and may offer help without taking over the child's meaningful choices.
_Avoid_: Second player, operator

**Journey History**:
A deferred, post-MVP concept for privately remembering completed journeys and explored Path Choices. Journey History and unexplored-route shimmer are absent from the MVP.
_Avoid_: Profile, score, progression, analytics

**Grown-up Corner**:
A quiet set of secondary controls for sound and replaying the story, available from the cover and pause state.
_Avoid_: Settings screen, child menu, parental controls
