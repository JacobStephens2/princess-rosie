#!/usr/bin/env bash
set -euo pipefail

# Drop edition-pack archive blobs and replace the full given name in history.
# Run only on a throwaway clone. Does not push. The real rewrite is #190.

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

usage() {
  fail "usage: $0 --throwaway-clone [repo]"
}

[[ "${1:-}" == "--throwaway-clone" ]] || usage
shift
repo_root="$(cd "${1:-.}" && pwd)"
cd "$repo_root"

git rev-parse --git-dir >/dev/null 2>&1 || fail "not a git repository: $repo_root"
is_bare="$(git rev-parse --is-bare-repository)"
if [[ "$is_bare" != "true" ]]; then
  if [[ -f .git ]]; then
    fail "refusing to rewrite a linked worktree; use a standalone clone"
  fi
  test -d .git || fail "not a git repository: $repo_root"
  worktree_count="$(git worktree list | wc -l | tr -d ' ')"
  if (( worktree_count > 1 )); then
    fail "refusing to rewrite a repository that has extra worktrees"
  fi
  if [[ -n "$(git status --porcelain --untracked-files=all)" ]]; then
    fail "working tree is dirty; commit or restore first"
  fi
fi

if ! command -v git-filter-repo >/dev/null; then
  fail "git-filter-repo is not installed"
fi

# Pieces are not the name; do not concatenate them in comments or commits.
encoded="$(python3 -c 'print("".join(chr(n) for n in (65, 122, 233, 108, 105, 101)))')"
placeholder="Her full given name"
replace_file="$(mktemp)"
trap 'rm -f "$replace_file"' EXIT
python3 - "$replace_file" "$encoded" "$placeholder" <<'PY'
import sys
from pathlib import Path

path, old, new = sys.argv[1], sys.argv[2], sys.argv[3]
Path(path).write_text(f"literal:{old}==>{new}\n", encoding="utf-8")
PY

git filter-repo \
  --force \
  --invert-paths \
  --path apps/godot/edition-pack.zip \
  --replace-text "$replace_file" \
  --replace-message "$replace_file"

echo "OK: publication history rewritten"
