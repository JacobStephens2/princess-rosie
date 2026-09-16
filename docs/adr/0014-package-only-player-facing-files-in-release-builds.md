---
status: superseded in part by ADR-0025: the development record is public; runtime packs are still derived for size, not secrecy
---

# Package only player-facing files in release builds

The development Edition Pack keeps runtime assets beside provenance, prompts, provider records, build state, unused masters, and other evidence that makes the media reproducible and auditable. Godot Edition release builds instead contain a Runtime Edition Pack with only the approved content and media needed during play, keeping the complete development record private and preventing a later public release from exposing production or family-personalization details.

## Consequences

- Development continues to use the complete Edition Pack as its authoritative content and media store.
- Release packaging must derive and validate a Runtime Edition Pack rather than copying the development tree wholesale.
- The release must prove that every runtime reference resolves and that excluded development records are absent from the packaged application.
