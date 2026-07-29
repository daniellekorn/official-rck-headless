#!/usr/bin/env bash
# Package the office's upload skill as a zip Claude Desktop can install.
#
# The zip is named after the Version line in SKILL.md, so a copy someone
# installed weeks ago is identifiable by filename alone. Skills are installed
# per person and don't auto-update unless they're shared through a Team or
# Enterprise org (see skills/README.md), so knowing which copy someone has is
# the difference between debugging a bug and debugging a stale install.
#
# Bump the Version line in SKILL.md whenever you change the skill.
set -euo pipefail

cd "$(dirname "$0")/.."
skill=skills/rck-website-uploads

version=$(grep -m1 '^\*\*Version:\*\*' "$skill/SKILL.md" | sed 's/^\*\*Version:\*\* *//')
if [ -z "$version" ]; then
	echo "No '**Version:**' line found in $skill/SKILL.md — add one before packing." >&2
	exit 1
fi

out="rck-website-uploads-$version.zip"

cd skills
rm -f rck-website-uploads-*.zip
# Zip root must be the skill folder itself — Claude Desktop rejects it otherwise.
zip -rq "$out" rck-website-uploads -x '.*' -x '**/.*'

echo "skills/$out"
if ! git -C .. diff --quiet -- "rck-website-uploads" 2>/dev/null; then
	echo "note: skill has uncommitted changes — is the Version line current?" >&2
fi
