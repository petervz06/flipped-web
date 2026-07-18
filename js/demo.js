/* Product walkthrough — REAL-FOOTAGE sync (2026-07-18).

   The iPhone side is Pete's actual screen recording (media/flip-cycle.mp4,
   13.7s loop: apps vanish ~1.0-2.8s, return ~9.9-11.7s).  The VIDEO is the
   clock: every animation frame we read video.currentTime and set the Mac
   mock's state (cursor position, button press, idle/flipped tile) so the
   FLIP press lands exactly as the real apps start vanishing and UNFLIP as
   they return.  setTimeout scheduling died with the CSS phone — timers
   drift from a video the browser may throttle; reading the clock can't.

   Pauses when off-screen (IntersectionObserver pauses the video; a paused
   video freezes the whole demo by construction). */
(function () {
  'use strict';
  var stage  = document.getElementById('demo-stage');
  var btn    = document.getElementById('flip-btn');
  var cursor = document.getElementById('cursor');
  var video  = document.getElementById('demo-video');
  if (!stage || !btn || !cursor || !video) return;

  // In-clip timeline (seconds), FRAME-MEASURED against the footage.
  // The clip is a 9.5s splice (5s of static flipped-hold cut out — Pete:
  // "time between flip and unflip should be ~4"): apps vanish at ~2.0s,
  // materialize at ~5.8s.  Each press releases 0.2s before its effect —
  // press, THEN pixels move.  Press-to-press = 3.8s.
  var T = {
    cursorToButton: 0.30,
    pressDown:      1.55,
    pressUp:        1.82,
    flipOn:         1.85,   // tile morphs at release; first apps lift ~2.0
    remeasure:      3.20,   // tile morph can shift the button a few px
    pressDown2:     5.35,
    pressUp2:       5.62,
    flipOff:        5.65    // apps materialize ~5.8
  };

  function placeCursorOnButton() {
    var btnRect = btn.getBoundingClientRect();
    var parentRect = cursor.parentElement.getBoundingClientRect();
    cursor.style.left = (btnRect.left - parentRect.left + btnRect.width / 2 - 9) + 'px';
    cursor.style.top  = (btnRect.top  - parentRect.top  + btnRect.height / 2 - 9) + 'px';
  }
  function placeCursorAtRest() {
    cursor.style.left = '24px';
    cursor.style.top  = '24px';
  }

  var phase = -1;  // last applied phase, so state applies once per change
  function applyPhase(p) {
    if (p === phase) return;
    phase = p;
    // ABSOLUTE state per phase — never incremental.  Sparse clocks skip
    // phases (timeupdate fires ~4Hz in iOS low-power mode; seeks jump
    // arbitrarily), so a transition-based switch could strand a pressed
    // button or miss the flip entirely.  Each phase fully describes the
    // world; skipping intermediate phases costs nothing.
    btn.classList.toggle('is-pressed', p === 2 || p === 6);
    stage.classList.toggle('is-flipped', p >= 4 && p < 8);
    if (p === 0) placeCursorAtRest();
    else placeCursorOnButton();  // covers the post-morph re-aim too
  }

  function phaseFor(t) {
    if (t < T.cursorToButton) return 0;
    if (t < T.pressDown)      return 1;
    if (t < T.pressUp)        return 2;
    if (t < T.flipOn)         return 3;
    if (t < T.remeasure)      return 4;
    if (t < T.pressDown2)     return 5;
    if (t < T.pressUp2)       return 6;
    if (t < T.flipOff)        return 7;
    return 8;
  }

  var rafId = null;
  var active = false;
  function sync() { applyPhase(phaseFor(video.currentTime)); }
  function tick() {
    sync();
    rafId = requestAnimationFrame(tick);
  }

  // The video's own events are the BASELINE clock — they fire wherever the
  // video actually plays, including contexts that suspend or throttle rAF
  // (iOS low-power mode, embedded panes).  rAF just makes it frame-smooth
  // where available.  applyPhase is idempotent so double-driving is free.
  video.addEventListener('timeupdate', function () { if (active) sync(); });
  video.addEventListener('seeked',     function () { if (active) sync(); });

  function start() {
    if (active) return;
    active = true;
    video.play().catch(function () {});
    rafId = requestAnimationFrame(tick);
  }
  function stop() {
    active = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    video.pause();
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.isIntersecting ? start() : stop(); });
    }, { threshold: 0.25 }).observe(stage);
    // Belt-and-braces: if the stage is already on-screen at load (anchor
    // landing on #how, or an environment whose IO withholds the initial
    // callback), don't wait for the observer to notice.
    var r = stage.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) start();
  } else {
    start();
  }

  // Autoplay fallback: first interaction unsticks a blocked video.
  ['scroll', 'touchstart', 'click'].forEach(function (ev) {
    window.addEventListener(ev, function () {
      if (rafId && video.paused) video.play().catch(function () {});
    }, { once: true, passive: true });
  });

  window.addEventListener('resize', function () {
    // Re-aim on next phase pass; force re-apply of cursor phases.
    if (phase === 1 || phase === 5) placeCursorOnButton();
  });

  // Reduced motion: hold the flipped still — premise without animation.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    stop();
    stage.classList.add('is-flipped');
    video.currentTime = 6;  // mid-hold: home screen with socials gone
  }

  // Console debug handle: __flippedDemo.sync() applies the phase for the
  // video's current position; start()/stop() drive the loop manually.
  window.__flippedDemo = { start: start, stop: stop, sync: sync };
})();
