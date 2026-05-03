#!/usr/bin/env bash
# Flipped — clean reinstall script
# Usage: curl -fsSL https://useflipped.com/fix.sh | bash
set -e

echo "════════════════════════════════════════════════════════════════"
echo "  Flipped clean reinstall — fixes 'waiting for iPhone' hang"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "▶ Quitting Flipped (if running)..."
osascript -e 'tell app "Flipped" to quit' 2>/dev/null || true
sleep 1

echo "▶ Wiping old install..."
rm -rf /Applications/Flipped.app
rm -rf "$HOME/Library/Application Support/Flipped"
rm -f "$HOME/Downloads/Flipped"*.dmg "$HOME/Desktop/Flipped"*.dmg 2>/dev/null || true

echo "▶ Downloading latest from useflipped.com (cache-busted)..."
DMG="$HOME/Downloads/Flipped-fresh.dmg"
rm -f "$DMG"
curl -fsSL -o "$DMG" "https://useflipped.com/downloads/Flipped-latest.dmg?bust=$(date +%s)"
SIZE=$(stat -f%z "$DMG")
echo "   Downloaded: $SIZE bytes"

echo "▶ Mounting + installing..."
# Detach any stale mount of the same volume name
for m in $(hdiutil info | grep -E "/Volumes/Flipped 1\." | awk '{print $1}' | grep "^/dev/"); do
    hdiutil detach "$m" -force >/dev/null 2>&1 || true
done
MOUNT=$(hdiutil attach "$DMG" -nobrowse | grep "/Volumes/" | awk '{$1=""; $2=""; sub(/^[ \t]+/,""); print}' | head -1)
[ -z "$MOUNT" ] && { echo "❌ Couldn't mount DMG"; exit 1; }
cp -R "$MOUNT/Flipped.app" /Applications/
hdiutil detach "$MOUNT" >/dev/null 2>&1

VERSION=$(defaults read /Applications/Flipped.app/Contents/Info.plist CFBundleShortVersionString 2>/dev/null)
if [ -z "$VERSION" ]; then
    echo "❌ Couldn't read version from /Applications/Flipped.app — install may have failed"
    exit 1
fi
echo "   Installed version: $VERSION ✓"

echo ""
echo "▶ Opening Flipped..."
open /Applications/Flipped.app
echo ""
echo "✅ Done.  Flipped $VERSION is installed and opening now."
echo ""
echo "   From here on, future updates show up as a popup inside the app —"
echo "   no more running this script.  Just click \"Install\" when prompted."
echo ""
echo "   If the app gets stuck on \"Plug in your iPhone\", open Settings →"
echo "   Get Help → Copy Diagnostics, then paste that to Pete."
