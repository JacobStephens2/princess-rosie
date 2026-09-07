## Agent skills

### Issue tracker

Issues and specs are tracked in GitHub Issues via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the default five-label triage vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repository. See `docs/agents/domain.md`.

### Paid model services

Use paid model services only when they are billed directly by a US-headquartered provider, unless the project owner explicitly approves an exception.

### Commit and pull request attribution

Do not add tool attribution to commit messages or pull request bodies. Omit `Co-Authored-By`
trailers naming an AI assistant, `Claude-Session` or other session-link trailers, and
"Generated with" footers. Messages and PR bodies end with their actual content.

### Audio evaluation

For tasks that generate, select, or review audio assets, follow `docs/agents/audio-evaluation.md`.

### Image generation

When generating artwork with OpenAI `gpt-image-2`, invoke the OpenAI Images API directly (via script or SDK) rather than CLI wrappers like `inkvoke`. Direct API calls provide full response metadata for provenance records and avoid wrapper file-handling quirks.
