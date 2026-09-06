#!/bin/bash
# Renders the weekly davening flier and drops both files in a folder.
# Run by launchd every Sunday morning (see com.rckollel.weeklyflier.plist),
# or by hand any time:  ./automation/weekly-flier.sh
#
# Edit these two lines if your paths differ.
REPO="/Users/Yosef/official-rck-headless"
DEST="$HOME/Downloads/RCK Flier"

set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"   # launchd starts with a bare PATH

mkdir -p "$DEST"
cd "$REPO"

echo "=== $(date) ==="
node automation/render.mjs

# Newest pair only, so the folder doesn't fill up with old weeks.
for ext in jpg pdf; do
  latest=$(ls -t automation/out/*."$ext" | head -1)
  cp "$latest" "$DEST/"
  echo "Copied $(basename "$latest") -> $DEST"
done
