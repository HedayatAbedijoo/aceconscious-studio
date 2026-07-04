#!/usr/bin/env bash
# Deploy ACE.await site to GitHub Pages (HedayatAbedijoo/website)
set -euo pipefail

REPO="HedayatAbedijoo/website"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT"

if ! gh auth status -h github.com >/dev/null 2>&1; then
  echo "Run first: gh auth login -h github.com -p ssh"
  exit 1
fi

if git remote get-url origin >/dev/null 2>&1; then
  echo "Remote origin already set."
else
  gh repo create website \
    --public \
    --description "ACE.await book launch site — Ace Conscious Studio" \
    --source=. \
    --remote=origin \
    --push
fi

git push -u origin main

echo "Enabling GitHub Pages..."
gh api "repos/${REPO}/pages" -X POST \
  -f build_type=legacy \
  -f 'source[branch]=main' \
  -f 'source[path]=/' 2>/dev/null || echo "Pages may already be enabled."

gh api "repos/${REPO}/pages" -X PUT -f cname=aceconscious.studio 2>/dev/null || true

echo ""
echo "Done. Next:"
echo "1. Apply DNS changes in Squarespace (see docs/github-pages-dns.md)"
echo "2. GitHub → ${REPO} → Settings → Pages → verify custom domain aceconscious.studio"
echo "3. Enable Enforce HTTPS when available (can take up to 24h after DNS)"
