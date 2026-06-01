/* Product walkthrough state machine.
   States: IDLE → MOVE_TO_BUTTON → PRESS_FLIP → APPS_FALL → REST_FLIPPED
           → MOVE_TO_BUTTON → PRESS_UNFLIP → APPS_RETURN → REST_HOME → loop.
   8-second total loop (slower than the 6s preview Pete called "pretty bad").

   Cursor position is computed from getBoundingClientRect() so it lands
   exactly on the FLIP button no matter the viewport. Fixes the "off by
   20-40px" issue from the preview.

   Pauses when the demo is off-screen — no battery burn on background tabs. */
(function () {
  'use strict';
  var stage   = document.getElementById('demo-stage');
  var btn     = document.getElementById('flip-btn');
  var cursor  = document.getElementById('cursor');
  if (!stage || !btn || !cursor) return;

  // Frame schedule: { at: ms, action: fn }
  // Total cycle = 8000ms.
  var T_MOVE_TO_BUTTON = 0;     // cursor glides toward button
  var T_PRESS_DOWN     = 1100;  // press indication
  var T_PRESS_UP       = 1350;  // release
  var T_APPS_FLIP      = 1400;  // toggle is-flipped (apps cascade out)
  var T_REST_FLIPPED   = 4000;  // empty home screen, ACTIVE SESSION pill shown
  var T_PRESS_DOWN_2   = 5100;
  var T_PRESS_UP_2     = 5350;
  var T_APPS_RETURN    = 5400;  // toggle is-flipped off (apps cascade in)
  var T_LOOP_END       = 8000;

  var timers = [];
  var running = false;
  var rafId = null;

  function clear() {
    timers.forEach(function (t) { clearTimeout(t); });
    timers = [];
  }

  function placeCursorOnButton() {
    var btnRect   = btn.getBoundingClientRect();
    // Cursor parent is .mac-main (position: relative). Compute position
    // relative to that parent so it survives layout changes.
    var parent = cursor.parentElement;
    var parentRect = parent.getBoundingClientRect();
    var x = btnRect.left - parentRect.left + (btnRect.width / 2) - 9;
    var y = btnRect.top  - parentRect.top  + (btnRect.height / 2) - 9;
    cursor.style.left = x + 'px';
    cursor.style.top  = y + 'px';
  }

  function placeCursorAtRest() {
    cursor.style.left = '24px';
    cursor.style.top  = '24px';
  }

  function pressDown() { btn.classList.add('is-pressed'); }
  function pressUp()   { btn.classList.remove('is-pressed'); }

  function flipOn()  { stage.classList.add('is-flipped'); }
  function flipOff() { stage.classList.remove('is-flipped'); }

  function schedule() {
    clear();
    placeCursorAtRest();
    flipOff();
    pressUp();

    // Start: cursor at rest, then move to button.
    timers.push(setTimeout(function () { placeCursorOnButton(); }, T_MOVE_TO_BUTTON + 50));
    timers.push(setTimeout(pressDown,  T_PRESS_DOWN));
    timers.push(setTimeout(pressUp,    T_PRESS_UP));
    timers.push(setTimeout(flipOn,     T_APPS_FLIP));
    // Cursor stays near button while flipped (no random wandering)
    timers.push(setTimeout(pressDown,  T_PRESS_DOWN_2));
    timers.push(setTimeout(pressUp,    T_PRESS_UP_2));
    timers.push(setTimeout(flipOff,    T_APPS_RETURN));
    timers.push(setTimeout(placeCursorAtRest, T_APPS_RETURN + 600));
    timers.push(setTimeout(function () {
      if (running) schedule();
    }, T_LOOP_END));
  }

  function start() {
    if (running) return;
    running = true;
    // Wait one frame so layout is settled before measuring rects.
    rafId = requestAnimationFrame(function () {
      schedule();
    });
  }

  function stop() {
    running = false;
    clear();
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    flipOff();
    pressUp();
    placeCursorAtRest();
  }

  // Visibility observer: only run while demo is on-screen.
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) start(); else stop();
      });
    }, { threshold: 0.25 });
    io.observe(stage);
  } else {
    start();
  }

  // Recompute cursor target on resize.
  var resizeT;
  window.addEventListener('resize', function () {
    if (!running) return;
    clearTimeout(resizeT);
    resizeT = setTimeout(function () { stop(); start(); }, 200);
  });

  // Respect reduced-motion preference.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    stop();
    // Final state: show the flipped state so the user sees the product premise.
    flipOn();
  }
})();
