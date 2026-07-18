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

  // In-clip timeline (seconds).  Apps visibly vanish starting ~1.0s —
  // the press completes a beat earlier so cause precedes effect.
  var T = {
    cursorToButton: 0.25,
    pressDown:      0.70,
    pressUp:        0.92,
    flipOn:         0.95,   // tile morphs as the first apps lift off
    remeasure:      2.30,   // tile morph can shift the button a few px
    pressDown2:     9.30,
    pressUp2:       9.55,
    flipOff:        9.60    // apps start returning ~9.9
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

  var phase = -1;  // last applied phase, so each state applies once per loop
  function applyPhase(p) {
    if (p === phase) return;
    phase = p;
    switch (p) {
      case 0:  // loop start: reset
        placeCursorAtRest();
        btn.classList.remove('is-pressed');
        stage.classList.remove('is-flipped');
        break;
      case 1: placeCursorOnButton(); break;
      case 2: btn.classList.add('is-pressed'); break;
      case 3: btn.classList.remove('is-pressed'); break;
      case 4: stage.classList.add('is-flipped'); break;
      case 5: placeCursorOnButton(); break;   // post-morph re-aim
      case 6: btn.classList.add('is-pressed'); break;
      case 7: btn.classList.remove('is-pressed'); break;
      case 8: stage.classList.remove('is-flipped'); break;
    }
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
  function tick() {
    applyPhase(phaseFor(video.currentTime));
    rafId = requestAnimationFrame(tick);
  }

  function start() {
    if (rafId) return;
    video.play().catch(function () {});
    rafId = requestAnimationFrame(tick);
  }
  function stop() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    video.pause();
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.isIntersecting ? start() : stop(); });
    }, { threshold: 0.25 }).observe(stage);
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
})();
