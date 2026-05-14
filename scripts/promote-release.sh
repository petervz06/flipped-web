#!/usr/bin/env bash
# Promote the latest item from appcast-beta.xml → appcast.xml.
#
# Flow:
#   1. New release goes into appcast-beta.xml (only Pete's Mac reads this)
#   2. Pete's Mac auto-updates, Pete tests
#   3. When good, run this script:
#         ./scripts/promote-release.sh
#      It copies the most-recent <item> from beta → stable, updates
#      Flipped-latest.dmg to point at the new version, and stages
#      everything for commit.
#
# Safety:
#   - Refuses to run if the latest beta version is already in stable
#     (idempotent — re-running after a successful promote is a no-op)
#   - Refuses to run if the corresponding DMG isn't in downloads/
#   - Stages but does NOT commit/push — you review with `git diff`
#     and `git status` first, then push manually
#
# Usage:
#   cd /Users/peteralbertson/flipped-web-work
#   ./scripts/promote-release.sh
#   git diff --stat                 # sanity check
#   git commit -m "release: promote v1.0.X from beta to stable"
#   git push origin main
set -euo pipefail

WEB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$WEB_DIR"

BETA="$WEB_DIR/appcast-beta.xml"
STABLE="$WEB_DIR/appcast.xml"

[[ -f "$BETA" ]]   || { echo "error: $BETA not found"; exit 1; }
[[ -f "$STABLE" ]] || { echo "error: $STABLE not found"; exit 1; }

python3 - <<'PY'
import re
import sys
from pathlib import Path

WEB_DIR = Path(__file__).resolve().parent if "__file__" in dir() else Path.cwd()
# Fallback for inline -<<PY invocations.
import os
WEB_DIR = Path(os.environ.get("WEB_DIR") or os.getcwd())
beta_path   = WEB_DIR / "appcast-beta.xml"
stable_path = WEB_DIR / "appcast.xml"

beta   = beta_path.read_text()
stable = stable_path.read_text()

# Find the first <item>...</item> block in beta (the most recent release).
m = re.search(r"(    <item>.*?</item>\n)", beta, flags=re.DOTALL)
if not m:
    print("error: no <item> block found in appcast-beta.xml")
    sys.exit(1)
item_block = m.group(1)

# Extract the version from that block so we can check idempotency + name the DMG.
mver = re.search(r"<sparkle:version>([^<]+)</sparkle:version>", item_block)
if not mver:
    print("error: could not extract sparkle:version from the beta item")
    sys.exit(1)
version = mver.group(1).strip()

# Idempotency: don't re-promote if this version is already in stable.
if f"<sparkle:version>{version}</sparkle:version>" in stable:
    print(f"version {version} is already in appcast.xml — nothing to promote")
    sys.exit(0)

# Verify the DMG exists in downloads/ before promoting.
dmg = WEB_DIR / "downloads" / f"Flipped-{version}.dmg"
if not dmg.exists():
    print(f"error: {dmg} does not exist — was the DMG copied during the beta release?")
    sys.exit(1)

# Insert the beta item as the first <item> in stable.
# Anchor: the first occurrence of `    <item>` after the channel metadata.
new_stable, count = re.subn(
    r"(    <item>)",
    item_block + r"\1",
    stable,
    count=1,
)
if count != 1:
    print("error: could not find an <item> anchor in appcast.xml to prepend before")
    sys.exit(1)

stable_path.write_text(new_stable)
print(f"promoted v{version} from beta to stable")

# Mirror Flipped-X.Y.Z.dmg → Flipped-latest.dmg so the website's "Download
# latest" link reflects the just-promoted version.
import shutil
latest = WEB_DIR / "downloads" / "Flipped-latest.dmg"
shutil.copyfile(dmg, latest)
print(f"updated Flipped-latest.dmg → v{version}")
PY

echo ""
echo "next steps:"
echo "  git status -s                                # confirm appcast.xml + Flipped-latest.dmg are staged"
echo "  git diff --stat                              # sanity check"
echo "  git add appcast.xml downloads/Flipped-latest.dmg"
echo "  git commit -m \"release: promote vX.Y.Z from beta to stable\""
echo "  git push origin main"
