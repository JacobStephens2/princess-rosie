# Sign and notarize stable Godot releases

Private Godot Edition Release Candidates may remain unsigned so packaging and owner acceptance can begin without waiting for Apple distribution credentials. Stable Godot Edition releases must be signed with a Developer ID Application identity, notarized by Apple, and accepted again as a downloaded artifact before publication, so the ordinary GitHub download opens without the Gatekeeper workaround required by an unsigned candidate. This amends ADR-0011's decision to leave signing, notarization, and distribution outside the MVP: they remain outside the game implementation but become a stable-release gate.

## Consequences

- The project owner retains control of Apple credentials and completes any account or keychain steps the release agent cannot perform.
- Signing or notarization changes the artifact, so a signed and notarized Release Candidate must pass owner acceptance before its exact bytes can be promoted to stable v1.
- Release automation separates reproducible local construction from credentialed signing, notarization, and deliberate GitHub publication.
