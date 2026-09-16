# Publication

Use this runbook to rewrite history and make the repository public. See
ADR-0025. The Web Edition site is a different artifact; follow
[the deployment runbook](deployment.md). The archived Godot Edition macOS
archive is a different artifact; follow
[the Godot Edition release runbook](godot-release.md).

Two steps are irreversible. Do not start the rewrite until the owner has
commented "go" on #190. Do not change visibility until the owner has
commented "go" on #191. An agent must not take either step on its own. The
rewrite invalidates every open branch and every local clone, including the
worktrees kept under the repository, so it runs when no other work is in
flight.

The rewrite drops every `apps/godot/edition-pack.zip` blob and replaces the
full given name throughout history. It does not push. Force-pushing the
rewritten refs is part of #190 after the inspection is green.

## 1. Confirm the rewrite gate (#190)

Continue only when all of these are true:

- The owner has commented "go" on #190.
- No other branch or worktree has work in flight.
- #188 is closed (Mureka replied, or 2026-09-29 passed without a reply).
- The working-tree publication tickets have landed on `publication-contract`.

Record the current release-candidate tag hashes before anything is rewritten:

```sh
git fetch origin --tags
git rev-parse --verify 'v1.0.0-rc.1^{commit}'
git rev-parse --verify 'v1.0.0-rc.2^{commit}'
git rev-parse --verify 'v1.0.0-rc.3^{commit}'
```

Keep those values for the release-note line below.

## 2. Clone a throwaway mirror

Do not run the rewrite against the real working copy or any linked worktree.
Clone a throwaway mirror of the GitHub repository:

```sh
git clone --mirror git@github.com:JacobStephens2/princess-rosie.git \
  /tmp/princess-rosie-rewrite.git
```

Install `git-filter-repo` on that machine if it is missing (`brew install
git-filter-repo` on macOS).

## 3. Prove the history flag is red, then rewrite

From a checkout that has this runbook (or by copying the two scripts onto the
PATH), run the publication inspection against the mirror. It must fail while
the archive blobs and the full given name are still in history:

```sh
apps/web/tests/publication_inspection.sh --history /tmp/princess-rosie-rewrite.git
```

The working-tree half of that command looks for `LICENSE` and the other
guarded files, so either pass a non-bare clone checked out at
`publication-contract`, or run the history flag from a work tree of the
mirror:

```sh
git clone /tmp/princess-rosie-rewrite.git /tmp/princess-rosie-rewrite
git -C /tmp/princess-rosie-rewrite checkout publication-contract
apps/web/tests/publication_inspection.sh --history /tmp/princess-rosie-rewrite
```

Then rewrite the mirror. The `--throwaway-clone` flag is required; the script
refuses linked worktrees and repositories with extra worktrees:

```sh
tools/rewrite-publication-history.sh --throwaway-clone \
  /tmp/princess-rosie-rewrite.git
```

`git-filter-repo` rewrites every branch and the three release-candidate tags
in that clone. It does not push. Confirm the inspection is now green and
record the pack size on #190:

```sh
apps/web/tests/publication_inspection.sh --history /tmp/princess-rosie-rewrite
git -C /tmp/princess-rosie-rewrite.git count-objects -vH
git rev-parse --verify 'v1.0.0-rc.1^{commit}'
git rev-parse --verify 'v1.0.0-rc.2^{commit}'
git rev-parse --verify 'v1.0.0-rc.3^{commit}'
```

## 4. Force-push the rewritten refs

Re-add the GitHub remote (filter-repo removes it) and force-push every
rewritten branch and tag. This is the moment the real history changes:

```sh
git -C /tmp/princess-rosie-rewrite.git remote add origin \
  git@github.com:JacobStephens2/princess-rosie.git
git -C /tmp/princess-rosie-rewrite.git push --force --mirror origin
```

A fresh clone of GitHub must then pass `publication_inspection.sh --history`.
Record that clone's pack size on #190.

Every local clone and worktree is now stale. Delete them and clone again; do
not mix old object databases with the rewritten refs.

## 5. Update the release notes

Each release-candidate tag now points at its rewritten commit. Append one line
to each entry recording the pre-rewrite and post-rewrite hashes. Do not attach
archives.

```sh
# Repeat for v1.0.0-rc.1, v1.0.0-rc.2, and v1.0.0-rc.3.
gh release view v1.0.0-rc.1 --json body --jq .body > /tmp/rc1-notes.md
# Append: History rewrite (ADR-0025, #190): tag formerly pointed at <old>, now <new>.
gh release edit v1.0.0-rc.1 --notes-file /tmp/rc1-notes.md
```

Read the notes back with `gh release view` and record the new hashes on #190.

## 6. Make the repository public (#191)

Continue only when the owner has commented "go" on #191, the rewritten
history is on GitHub, and #188 is closed.

```sh
gh repo edit JacobStephens2/princess-rosie \
  --visibility public \
  --accept-visibility-change-consequences
```

Read the result back:

```sh
gh repo view JacobStephens2/princess-rosie --json visibility
```

## 7. Enable repository protections

After the visibility change, enable Dependabot alerts, Dependabot security
updates, and secret-scanning push protection, and require the owner as a
reviewer on the `production` environment. Read each setting back.

```sh
gh api --method PUT repos/JacobStephens2/princess-rosie/vulnerability-alerts
gh api --method PUT repos/JacobStephens2/princess-rosie/automated-security-fixes
gh api --method PATCH repos/JacobStephens2/princess-rosie \
  --input - <<'JSON'
{
  "security_and_analysis": {
    "secret_scanning": { "status": "enabled" },
    "secret_scanning_push_protection": { "status": "enabled" }
  }
}
JSON

owner_id="$(gh api users/JacobStephens2 --jq .id)"
gh api --method PUT \
  repos/JacobStephens2/princess-rosie/environments/production \
  --input - <<JSON
{
  "prevent_self_review": false,
  "reviewers": [{"type": "User", "id": ${owner_id}}]
}
JSON
```

Read back:

```sh
gh api repos/JacobStephens2/princess-rosie/vulnerability-alerts
gh api repos/JacobStephens2/princess-rosie/automated-security-fixes
gh api repos/JacobStephens2/princess-rosie --jq .security_and_analysis
gh api repos/JacobStephens2/princess-rosie/environments/production
```

Record those responses on #191. The publication procedure is complete when
the repository is public, the three protections are on, the owner is a
required reviewer on production, and a stranger's clone passes
`apps/web/tests/publication_inspection.sh --history`.
