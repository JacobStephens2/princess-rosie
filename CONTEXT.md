# Princess Rosie and the Seven Birthday Stars

A joyful, replayable birthday game centered on a fictional storybook hero inspired by Rosie.

## Language

**Phaser Edition**:
The browser-playable edition of Princess Rosie and the Seven Birthday Stars that was made for the birthday and remains deployed. It is frozen at its released state and is no longer revised.
_Avoid_: Original Edition, Phaser prototype, Phaser Web Edition

**Godot Edition**:
The native macOS edition of Princess Rosie and the Seven Birthday Stars built in Godot. It is the edition under active development and the one the canonical storybook experience is realized in.
_Avoid_: Godot Production Edition, Unity Edition

**Godot Edition Release Candidate**:
A private, downloadable candidate for Godot Edition v1, published for owner verification before the stable release. Its source tag stays fixed, while its notes and packaging-only assets may be corrected until owner acceptance; it is not itself v1 or a public release.
_Avoid_: v1, final release, public release

**Runtime Edition Pack**:
The player-facing form of the Edition Pack bundled with a Godot Edition release, containing only approved content and media required during play. Production provenance, prompts, provider records, build state, and unused masters remain private development records outside it.
_Avoid_: Full Edition Pack, production archive, source-media bundle

**Princess Rosie**:
The storybook hero and elder sister through whom the child experiences the adventure. She shares Rosie's name and may use an expressly approved likeness without unrelated identifying personal details.
_Avoid_: Rosie's avatar, digital Rosie

**Princess Zélie**:
Princess Rosie's storybook little sister and the child celebrated at the Birthday Castle. She shares Azélie's saint-inspired nickname and may use an expressly approved likeness without unrelated identifying personal details.
_Avoid_: Princess Azélie, the objective

**Birthday Castle**:
The joyful destination where Princess Zélie's birthday is celebrated and Princess Rosie's adventure concludes. Its celebration is one authored ending, reached identically on every journey and painted once — the Phaser Edition's approved illustration, reused rather than repainted — where the six recovered Birthday Stars join the Castle Star and Fly Again is the only invitation.
_Avoid_: Finish line, final level

**Fly Again**:
The single invitation at the Birthday Castle, which begins the whole journey afresh in the first place with every Birthday Star to be found again. It replaced Dance Again, which ADR-0011 cut from the MVP.
_Avoid_: Restart button, replay level, Dance Again

**Birthday Star**:
One of seven golden, mosaic-like magical lights. Six scatter beside Family Guests across Fairytale Sicily, notice Stella when she flies nearby, and joyfully fly to her before opening their Rainbow Paths; the seventh is the Castle Star.
_Avoid_: Coin, point, collectible

**Castle Star**:
The seventh Birthday Star, kept safe by Dad at the Birthday Castle while the other six scatter. It joins the six recovered Stars at the celebration rather than being gathered during flight.
_Avoid_: Seventh collectible, missing Star, Dad's collectible

**Rainbow Path**:
One of six magical routes opened by a gathered Birthday Star that carries its Family Guest safely ahead to Princess Zélie's celebration.
_Avoid_: Teleporter, guest collection

**Path Choice**:
A deferred, post-MVP interaction concept in which Princess Rosie guides Stella onto one of two equally safe routes that later rejoin. Path Choices are absent from the single-route MVP.
_Avoid_: Branch, difficulty path, correct route

**Flight Control**:
The moment-to-moment guidance of Stella along an automatically advancing route: she rises while the child sustains the shared action and settles when it is released. Her height affects gentle contacts, Playful Bumps, and Near Misses without changing story progress or creating failure.
_Avoid_: Path Choice, scene advance, free flight

**Single Route**:
The uninterrupted scenic passage through each MVP place. Flight Control changes Stella's height and encounters along it without changing the destination or story outcome.
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
One of the named passages of Fairytale Sicily the journey travels in order before the Birthday Castle: Rosalia's Rose Garden, Zélie's Lacewood, Golden Bell Abbey, the Cloister of Clouds, Pellegrino Peak, and the Sapphire Sea. Every place is declared by the same data — a name, a Family Guest and her cutout, a Place Illustration, a tint, an Altitude Ladder of interactions, a Playful Bump, a Birthday Star, a Rainbow Path, and a Birthday Star Moment sentence — and presented through one code path, so places differ in art, sound, and data rather than in behaviour. A declared place becomes flyable once its Place Illustration is approved into the Edition Pack.
_Avoid_: Level, stage, area, world

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

**Bump Floor**:
The band of heights at the bottom of the Single Route where a place's Playful Bump lives, declared as a margin above the lowest reachable height. Every rung of the Altitude Ladder keeps heights clear of it, so a rung may reach down into the floor but is never wholly inside it. A place may say its floor does not bump.
_Avoid_: Obstacle, hazard zone, ground, collision layer

**Playful Bump**:
A soft, place-specific encounter with the Bump Floor that makes Stella wobble without danger. Every bump is a lone wobble, forgotten rather than saved up, and nothing follows from meeting several.
_Avoid_: Damage, injury, failure, enemy collision

**Near Miss**:
The place's answer when Stella comes close to the Bump Floor and rises away without touching it, sounded only once the miss is a fact. It is the one response in the journey earned by flying well, and it answers in every place, including those whose floor does not bump.
_Avoid_: Dodge, close call, bonus, combo

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
The full-Stage scenery painting that establishes one place during the Flight Presentation while leaving gameplay-significant characters, Birthday Stars, and encounters to distinct interactive elements.
_Avoid_: Background plate, scrolling panorama, wallpaper

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
