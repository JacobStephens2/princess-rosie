# Support macOS 13 and newer

Godot Edition v1 supports macOS 13 and newer, matching the Apple Silicon MacBook on which the game and its release artifacts are accepted. The application remains a universal binary so it can run on Intel hardware, but Intel compatibility is best-effort until it receives its own play-test; the release does not claim the unverified macOS 11 compatibility previously implied by the export preset.

## Consequences

- Both architectures declare macOS 13 as their minimum version.
- Release notes distinguish the supported Apple Silicon target from packaged but unverified Intel compatibility.
- Supporting an older macOS version or formally supporting Intel requires a dedicated compatibility pass rather than a metadata-only change.
