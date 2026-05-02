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

VERSION=$(defaults read /Applications/Flipped.app/Contents/Info.plist CFBundleShortVersionString)
echo "   Installed version: $VERSION"

if [ "$VERSION" != "1.0.2" ]; then
    echo "⚠  Expected 1.0.2 but got $VERSION — try again or contact Pete"
    exit 1
fi

echo ""
echo "▶ Opening Flipped..."
open /Applications/Flipped.app
echo ""
echo "✅ Done. Walk through onboarding from the start."
echo "   When you reach 'Plug in your iPhone', it should detect within ~3 seconds."
echo "   If it still hangs, paste this back to Pete:"
echo ""
echo "   ~/Library/Application\\ Support/Flipped/imobiledevice/bin/ideviceinfo 2>&1 | head -5"
