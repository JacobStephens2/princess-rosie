# Allow pre-acceptance candidate assets to be replaced

A private Godot Edition Release Candidate is a vehicle for owner verification, and each macOS archive is hundreds of megabytes. To avoid retaining multiple large copies for small packaging-only corrections, its GitHub notes and attached archive may be replaced before owner acceptance, with a new checksum and an explicit replacement note; its Git tag remains fixed so the named source revision never changes. A code change requires a new release-candidate tag, and owner acceptance freezes the candidate's notes and assets.

Published notes identify an untested candidate as awaiting owner acceptance, then record the acceptance date and verified checksum when it passes. If a code change supersedes an unaccepted candidate, its large archive is removed to conserve storage while its tag, release entry, checksum, and pointer to the replacement candidate remain as the audit trail.
