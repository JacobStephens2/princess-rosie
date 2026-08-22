# Soundscape Build

This local-only Node authoring module turns the canonical Fairytale Soundscape catalog into approved source masters and provenance. It is not a dependency of any game application.

## Validate the catalog

Validation resolves every source master and runtime mapping before any credential or paid request is used:

```sh
npm run soundscape:validate
```

The catalog declares stable identifiers, prompts, duration, prompt influence, loop and candidate policy, category, priority, channel policy, MacBook mastering intent, selection status, source master, and runtime mapping for every cue.

## Build or resume a cue

With `ELEVENLABS_API_KEY` already supplied to the process by the shell session or a secret manager:

```sh
npm run soundscape:build -- --cue cue.opening.celebration-reveal
```

Or point to a mode-`0600` key file:

```sh
ELEVENLABS_API_KEY_FILE=/absolute/path/to/elevenlabs.key \
  npm run soundscape:build -- --cue cue.opening.celebration-reveal
```

The file may contain a bare key or one `ELEVENLABS_API_KEY=value` assignment. Never put a key in command arguments; the CLI rejects `--api-key` and `--elevenlabs-api-key`.

The command checks for an active paid plan and generates three candidates serially. Enter `none` when a batch does not pass QA; at most two additional three-candidate batches are permitted. Only the documented `invalid_output_format` response falls back from 48 kHz to 24 kHz PCM. Explicit rate-limit, system-busy, and server responses receive at most three pipeline retries with exponential backoff and jitter; SDK retries remain disabled.

Every invocation defaults to 30 paid requests. Raising the invocation limit is an explicit spending override:

```sh
npm run soundscape:build -- --cue all --paid-request-limit 45
```

Successful candidates and their job hashes are recorded durably before the next request. Rerun the same command after an ordinary interruption; validated candidates and approvals are skipped. A transport timeout after transmission stops in an unknown state and requires an exact acknowledgement before another request:

```sh
npm run soundscape:build -- \
  --cue cue.opening.celebration-reveal \
  --recover-unknown cue.opening.celebration-reveal
```

By default, durable output is written under `shared/edition/source-media/soundscape/`. Selected WAV masters, deterministic runtime derivatives, runtime import metadata, catalog state, build reports, and non-secret provenance are transactionally promoted. Downloads must be non-empty, decodable, within duration tolerance, non-silent, correctly trimmed and faded, at the expected sample rate and channel policy, under the peak ceiling, and—when looping—within the seam threshold. Rejected candidates are discarded.

An existing approval is immutable. A changed job hash or corrupt artifact stops safely; replace only one exact cue with its exact force value:

```sh
npm run soundscape:build -- \
  --cue cue.story.confirmation \
  --force cue.story.confirmation
```

Rebuild deterministic runtime derivatives from validated approved masters without a paid request:

```sh
npm run soundscape:remaster -- --cue all
```

Generate or verify the managed Fairytale Soundscape section in project media documentation:

```sh
npm run soundscape:media-docs -- --mode generate
npm run soundscape:media-docs -- --mode validate
```

The generated section credits ElevenLabs in project documentation and records prompts, production treatment, and selection reasons. It does not add an in-game credit.

## Verify without a paid call

The test suite uses the fake adapter through the same CLI interface. Fake provenance is explicitly marked `activePaid: false`, and the CLI refuses to publish fake media to the protected production output root:

```sh
npm run test:soundscape-build
npm run typecheck --workspace rosi-soundscape-build
```

The fake streams synthetic PCM through the same CLI seam and covers catalog validation, request planning, bounded retries, unknown recovery, resumption, hash invalidation, immutable approval, forced replacement, audio processing, deterministic remastering, media documentation, and secret redaction.
