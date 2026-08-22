# Soundscape Build

This local-only Node authoring module turns the canonical Fairytale Soundscape catalog into approved source masters and provenance. It is not a dependency of any game application.

## Build the story confirmation cue

With `ELEVENLABS_API_KEY` already supplied to the process by the shell session or a secret manager:

```sh
npm run soundscape:build-confirmation
```

Or point to a mode-`0600` key file:

```sh
ELEVENLABS_API_KEY_FILE=/absolute/path/to/elevenlabs.key \
  npm run soundscape:build-confirmation
```

The file may contain a bare key or one `ELEVENLABS_API_KEY=value` assignment. Never put a key in command arguments; the CLI rejects `--api-key` and `--elevenlabs-api-key`.

The command checks for an active paid plan, sends a 48 kHz PCM format probe with SDK retries disabled, and treats an accepted probe as the first of three serial candidates. Only the documented `invalid_output_format` 422 response falls back to three 24 kHz PCM candidates. All three are presented as temporary mono WAV previews for comparative audition; after approval, the previews are deleted and only the selected payload is retained with its rationale. Provenance records both the first successful PCM payload's established channel layout and the selected payload's layout.

By default, durable output is written under `shared/edition/source-media/soundscape/`. The master, build report, and provenance contain no credential or credential-file path. Rejected candidates are never placed in durable media, and all three approval artifacts are staged before transactional publication. An existing approval is immutable; replace it only with the exact cue identifier:

```sh
npm run soundscape:build-confirmation -- \
  --force cue.story.confirmation
```

## Verify without a paid call

The test suite uses the fake adapter through the same CLI interface. Fake provenance is explicitly marked `activePaid: false`, and the CLI refuses to publish fake media to the protected production output root:

```sh
npm run test:soundscape-build
npm run typecheck --workspace rosi-soundscape-build
```

The fake streams synthetic stereo PCM and covers direct/file credentials, redaction, request construction, 48→24 kHz fallback, PCM inspection, mono WAV mastering, immutable approval, and provenance.
