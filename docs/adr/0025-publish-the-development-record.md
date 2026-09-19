---
status: Mureka API Team confirmed in writing on 2026-09-19 that publishing paid-API Output in the public GitHub repository does not violate API Service Agreement §4.1; the FAQ prevails. See the research note.
---

# Publish the development record

ADR-0014 kept the complete development record private so that a later public release could not expose production or family-personalization details. On 2026-09-15 the project owner decided to make the whole repository public, including `shared/`, the media prompts, and the provenance records, so that the workflow that built the game can be read and the game can be forked for another child. The record is close to publishable because ADR-0001 has bounded personalization from the start; its bounds now apply to the repository as well as to the indexable game, and Princess Zélie's full given name joins the excluded details. Before the visibility change the history is rewritten once to remove that name from every past revision and to drop the 21 committed copies of the Godot edition-pack archive, which otherwise make a clone weigh 600 MB. The Godot Edition release-candidate archives are removed from their GitHub Releases, keeping the tags and notes as the audit trail, and the tags are re-pointed at the rewritten commits.

## Considered Options

- Publish a second, derived repository holding only the Web Edition source and the Runtime Edition Pack. Rejected: it doubles maintenance and hides the workflow, which is the part worth showing.
- Publish the Web Edition source without media. Rejected: it publishes a game nobody can run.

## Consequences

- ADR-0014's rationale of keeping the record private no longer holds; release packaging still derives a Runtime Edition Pack, but for size and cleanliness rather than secrecy.
- ADR-0017's promise that a release-candidate tag never moves is broken once, deliberately, by the history rewrite. Release notes record the old and new commit hashes.
- Commit hashes quoted in issues, release notes, and research documents before the rewrite are stale.
- Server operational details in issue #118 and pull request #119 are edited out and their edit history deleted before the visibility change.
- The Mureka API agreement's confidentiality clause was ambiguous about publishing generated output. The owner asked Mureka API support for written confirmation on 2026-09-16 (#188). Mureka API Team replied on 2026-09-19 that paid-API Output may be published in the public GitHub repository and game, and that §4.1 does not restrict the customer's ownership rights; the FAQ prevails. Recorded in `docs/research/mureka-distribution-rights.md`.
