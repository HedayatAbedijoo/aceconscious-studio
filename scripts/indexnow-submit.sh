#!/usr/bin/env bash
# Submit URLs to IndexNow (shared by Bing, Yandex, Naver and Seznam).
#
# One-time setup:
#   1. Generate a key: 8–128 characters, a–z A–Z 0–9 and dashes, for example
#        openssl rand -hex 16
#   2. Create the key file at the site root, containing only the key:
#        echo "<key>" > <key>.txt
#      (GitHub Pages serves it as https://aceconscious.studio/<key>.txt)
#   3. Deploy, then run:
#        INDEXNOW_KEY=<key> ./scripts/indexnow-submit.sh            # the six canonical pages
#        INDEXNOW_KEY=<key> ./scripts/indexnow-submit.sh https://aceconscious.studio/ace/
#
# The key is never stored in the repository; pass it through the environment.
set -euo pipefail

HOST="aceconscious.studio"
KEY="${INDEXNOW_KEY:-}"
if [ -z "$KEY" ]; then
  echo "INDEXNOW_KEY is not set. See the comments at the top of this script." >&2
  exit 1
fi

if [ "$#" -eq 0 ]; then
  set -- \
    "https://$HOST/" \
    "https://$HOST/ace/" \
    "https://$HOST/ace-de/" \
    "https://$HOST/ace-fa/" \
    "https://$HOST/de/" \
    "https://$HOST/fa/"
fi

KEY_URL="https://$HOST/$KEY.txt"
if ! curl -fsS "$KEY_URL" | grep -qx "$KEY"; then
  echo "Key file $KEY_URL is missing or does not contain the key. Deploy it first." >&2
  exit 1
fi

URLS=""
for u in "$@"; do URLS="$URLS\"$u\","; done
URLS="[${URLS%,}]"

curl -sS -o /dev/null -w "IndexNow response: %{http_code} (200/202 = accepted)\n" \
  -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json; charset=utf-8" \
  --data "{\"host\":\"$HOST\",\"key\":\"$KEY\",\"keyLocation\":\"$KEY_URL\",\"urlList\":$URLS}"
