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
# The exact Sunday that starts next week (never a mid-week day — see
# automation/README.md). getComputedWeekdaySchedule() also uses this probe
# date as "today" to decide whether a day in the displayed week is already
# past (see zmanim-schedule.ts); a mid-week probe like a flat "+7 days" makes
# Sunday look past and drops it from the Shacharis/Mincha/Maariv day-range
# labels ("Mon – Fri" instead of "Sun – Fri"). Landing exactly on next week's
# Sunday keeps every day of that week in the future, so nothing gets dropped —
# still robust to launchd firing a day or two late.
DOW="$(date +%w)"  # 0=Sun .. 6=Sat
DAYS_AHEAD=$(( (7 - DOW) % 7 ))
if [ "$DAYS_AHEAD" -eq 0 ]; then DAYS_AHEAD=7; fi
NEXT_WEEK_DATE="$(date -v+"${DAYS_AHEAD}"d +%Y-%m-%d)"
node automation/render.mjs "$NEXT_WEEK_DATE"

# Newest pair only, so the folder doesn't fill up with old weeks.
for ext in jpg pdf; do
  latest=$(ls -t automation/out/*."$ext" | head -1)
  cp "$latest" "$DEST/"
  echo "Copied $(basename "$latest") -> $DEST"
done
