# Princess Rosie and the Seven Birthday Stars

A short, joyful flying game made for Rosie to play with a grown-up at Princess Zélie’s very first birthday celebration.

Play at [rosi.stephens.page](https://rosi.stephens.page/).

## Play

- Hold **Space**, the mouse button, or the large **FLY** touch control to help Stella rise.
- Let go to glide down.
- Gather all seven Birthday Stars to open the Rainbow Paths and bring the family to the Birthday Castle.
- Flying all the way down onto a place's Bump Floor wobbles Stella and nothing follows from it. Swooping close and rising away without touching it is answered instead.

The story and controls are designed for a pre-reader with a grown-up nearby. Sound can be turned off at any time.

## Install for offline play

Open the deployed game once while online. In Chrome or Edge, use the install icon in the address bar. In Safari, choose **File → Add to Dock** on macOS or **Share → Add to Home Screen** on iPhone/iPad. After the first visit, the game’s story, art, soundtrack, and gameplay are cached for offline play.

## Develop

The repository contains the deployed Phaser Edition, frozen at its released state, and the native macOS Godot Edition under active development:

```text
apps/phaser-original/
apps/godot/
shared/
```

The root npm commands operate on the Phaser Edition and preserve the deployable static site in `dist/`. Requires Node.js and npm.

```sh
npm install
npm run dev
```

Verification:

```sh
npm test
npm run build
npm run test:e2e
```

The production build is a static site in `dist/`.

To publish a verified build, follow the [deployment runbook](docs/deployment.md).

## Media

- Storybook illustration: generated for this project with OpenAI image generation.
- Celebration illustration: generated for this project with GPT Image 2 through Inkvoke.
- Instrumental soundtrack: generated for this project with Mureka V9.
- Production story-confirmation sound effect: generated for this project with ElevenLabs Sound Effects V2.
- Interface sounds and fallback music: synthesized locally with the Web Audio API.

API keys are build-time secrets only. They are never included in the application or repository.

The exact media prompts are recorded in [`docs/media-prompts.md`](docs/media-prompts.md).
