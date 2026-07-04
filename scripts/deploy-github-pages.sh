#!/usr/bin/env bash
# Deploy ACE.await site to GitHub Pages (HedayatAbedijoo/website)
set -euo pipefail

REPO="HedayatAbedijoo/website"
REPO_SSH="git@github.com:${REPO}.git"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GIT_ONLY=false

if [ "${1:-}" = "--git-only" ]; then
  GIT_ONLY=true
fi

cd "$ROOT"

ensure_remote() {
  if git remote get-url origin >/dev/null 2>&1; then
    git remote set-url origin "$REPO_SSH"
  else
    git remote add origin "$REPO_SSH"
  fi
}

if [ "$GIT_ONLY" = true ]; then
  echo "Git-only deploy (SSH push; configure Pages in GitHub UI)."
  echo "Create empty repo first if needed: https://github.com/new (name: website, public, no README)"
  ensure_remote
  git push -u origin main
  echo ""
  echo "Then in GitHub → ${REPO} → Settings → Pages:"
  echo "  - Source: Deploy from branch → main → / (root)"
  echo "  - Custom domain: aceconscious.studio"
  exit 0
fi

if gh auth status -h github.com >/dev/null 2>&1; then
  if ! git remote get-url origin >/dev/null 2>&1; then
    gh repo create website \
      --public \
      --description "ACE.await book launch site — Ace Conscious Studio" \
      --source=. \
      --remote=origin \
      --push
  else
    ensure_remote
    git push -u origin main
  fi

  echo "Enabling GitHub Pages..."
  gh api "repos/${REPO}/pages" -X POST \
    -f build_type=legacy \
    -f 'source[branch]=main' \
    -f 'source[path]=/' 2>/dev/null || echo "Pages may already be enabled."

  gh api "repos/${REPO}/pages" -X PUT -f cname=aceconscious.studio 2>/dev/null || true
else
  echo "gh not authenticated. Trying SSH push only..."
  echo "For full setup run: gh auth login -h github.com -p ssh"
  echo ""
  ensure_remote
  if ! git push -u origin main 2>/dev/null; then
    echo ""
    echo "Push failed. Create the repo manually:"
    echo "  1. https://github.com/new → Repository name: website → Public → Create"
    echo "  2. ./scripts/deploy-github-pages.sh --git-only"
    echo "  3. Enable Pages in repo Settings (see script output)"
    exit 1
  fi
fi

echo ""
echo "Deploy push complete."
echo "1. Apply DNS: docs/github-pages-dns.md (MANAGE RULES first)"
echo "2. Verify DNS: ./scripts/verify-dns.sh"
echo "3. GitHub → ${REPO} → Settings → Pages → Enforce HTTPS when ready"
