#!/bin/bash
# Renders the *following* week's davening flier and drops both files in a
# folder. Run by launchd every Monday morning (see
# com.rckollel.weeklyflier.plist) so it lands well before that week starts,
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
# +7 days always lands inside next week's Sun–Fri span (even if launchd runs
# this a day or two late), so render.mjs resolves it to *next* week's Sunday
# regardless of which day this actually fires — see automation/README.md.
NEXT_WEEK_DATE="$(date -v+7d +%Y-%m-%d)"
node automation/render.mjs "$NEXT_WEEK_DATE"

# Newest pair only, so the folder doesn't fill up with old weeks.
for ext in jpg pdf; do
  latest=$(ls -t automation/out/*."$ext" | head -1)
  cp "$latest" "$DEST/"
  echo "Copied $(basename "$latest") -> $DEST"
done
