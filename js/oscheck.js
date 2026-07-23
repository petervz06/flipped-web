// Soft macOS-version check — warning banner, never a block.
//
// Reality (2026): every browser freezes the Mac User-Agent at
// "10_15_7", so UA sniffing can't tell macOS 11 from 26.  Chromium
// exposes the real version via User-Agent Client Hints; Safari and
// Firefox expose nothing.  So this can only CONFIRM "too old" on
// Chrome/Edge/Brave/Arc — everyone else sees nothing, which is why
// it's a heads-up strip and the app's own version gate stays the
// backstop.  Big-company consensus (Zoom/1Password/Steam): disclose
// at the money moment, refuse cleanly in the app, never hard-block
// the funnel on a browser guess.
(function () {
  var MIN_MACOS_MAJOR = 14;

  var uad = navigator.userAgentData;
  if (!uad || !uad.getHighEntropyValues || uad.platform !== "macOS") return;

  uad.getHighEntropyValues(["platformVersion"]).then(function (values) {
    var major = parseInt((values.platformVersion || "").split(".")[0], 10);
    // 0/NaN = hint withheld — never warn on a guess.
    if (!major || major >= MIN_MACOS_MAJOR) return;

    var strip = document.createElement("div");
    strip.setAttribute("role", "status");
    strip.style.cssText =
      "position:sticky;top:0;z-index:9999;background:#000;color:#fff;" +
      "border-bottom:1px solid #333;padding:10px 16px;text-align:center;" +
      "font-family:Menlo,Consolas,monospace;font-size:11px;" +
      "letter-spacing:1px;line-height:1.6;";
    strip.innerHTML =
      '<span style="color:#e0b34f;">&#9684; HEADS-UP</span> ' +
      "&mdash; your Mac looks like it&rsquo;s running an older macOS. " +
      "Flipped needs <strong>macOS " + MIN_MACOS_MAJOR + " (Sonoma) or newer</strong>. " +
      'Check yours: Apple menu &rarr; About This Mac. Questions? ' +
      '<a href="mailto:support@useflipped.com" style="color:#fff;">support@useflipped.com</a>';
    document.body.insertBefore(strip, document.body.firstChild);
  }).catch(function () { /* hint unavailable — stay quiet */ });
})();
