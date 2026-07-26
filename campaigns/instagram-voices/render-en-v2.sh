#!/usr/bin/env bash
# Render the 9 English carousel slides to PNG (1080x1350) with headless Chrome.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p out-en-v2
PROFILE="$(mktemp -d)"
trap 'rm -rf "$PROFILE"' EXIT
for i in 1 2 3 4 5 6 7 8 9; do
  google-chrome --headless=new --disable-gpu --hide-scrollbars \
    --allow-file-access-from-files \
    --user-data-dir="$PROFILE" \
    --window-size=1080,1437 \
    --virtual-time-budget=12000 \
    --screenshot="out-en-v2/ace-voices-en-0${i}.png" \
    "file://$PWD/slides-en-v2.html#${i}" >/dev/null 2>&1
  echo "slide $i done"
done

# crop to exactly 1080x1350 (Chrome may pad the capture to the window height)
python3 - <<'EOF'
from PIL import Image
import glob
for f in sorted(glob.glob("out-en-v2/*.png")):
    im = Image.open(f)
    if im.size != (1080, 1350):
        im.crop((0, 0, 1080, 1350)).save(f)
    print(f, "->", Image.open(f).size)
EOF
