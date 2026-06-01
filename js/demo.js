/* Product walkthrough — keeps the Mac app and the real iPhone screen
   recording in sync.

   The iPhone is a real ~14s screen capture of an actual flip/unflip:
     clip 0.0s   apps present
     clip ~2.5s  FLIP — distracting apps vanish
     clip ~8.5s  UNFLIP — apps return
     clip 14s    loop

   This script drives the Mac side (cursor → FLIP press → tile morph) to
   land on those same moments, and resets the video each loop so the two
   never drift apart. Cursor position is measured from the button's real
   rect so it lands dead-on at any viewport. Pauses off-screen. */
(function () {
  'use strict';
  var stage  = document.getElementById('demo-stage');
  var btn    = document.getElementById('flip-btn');
  var cursor = document.getElementById('cursor');
  var video  = document.getElementById('iphone-video');
  if (!stage || !btn || !cursor) return;

  // Timeline (ms) — aligned to the video's flip/unflip moments.
  var T_PRESS_DOWN   = 2100;  // cursor presses just before the clip's flip (2.5s)
  var T_PRESS_UP     = 2400;
  var T_FLIP_ON      = 2550;  // Mac tile morphs as the phone's apps vanish
  var T_RECURSOR     = 3600;  // re-measure button after the morph shifts it
  var T_PRESS_DOWN_2 = 8100;  // press just before the clip's unflip (8.5s)
  var T_PRESS_UP_2   = 8400;
  var T_FLIP_OFF     = 8550;
  var T_CURSOR_REST  = 9200;
  var T_LOOP_END     = 14000; // matches the clip length

  var timers = [];
  var running = false;
  var rafId = null;

  function clear() { timers.forEach(function (t) { clearTimeout(t); }); timers = []; }

  function placeCursorOnButton() {
    var btnRect = btn.getBoundingClientRect();
    var parentRect = cursor.parentElement.getBoundingClientRect();
    cursor.style.left = (btnRect.left - parentRect.left + btnRect.width / 2 - 9) + 'px';
    cursor.style.top  = (btnRect.top  - parentRect.top  + btnRect.height / 2 - 9) + 'px';
  }
  function placeCursorAtRest() { cursor.style.left = '24px'; cursor.style.top = '24px'; }

  function pressDown() { btn.classList.add('is-pressed'); }
  function pressUp()   { btn.classList.remove('is-pressed'); }
  function flipOn()    { stage.classList.add('is-flipped'); }
  function flipOff()   { stage.classList.remove('is-flipped'); }

  function resyncVideo() {
    if (!video) return;
    try { video.currentTime = 0; } catch (e) {}
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
  }

  function schedule() {
    clear();
    placeCursorAtRest();
    flipOff();
    pressUp();
    resyncVideo();

    // Cursor glides to the FLIP button, then the synced press + morph.
    timers.push(setTimeout(placeCursorOnButton, 50));
    timers.push(setTimeout(pressDown,  T_PRESS_DOWN));
    timers.push(setTimeout(pressUp,    T_PRESS_UP));
    timers.push(setTimeout(flipOn,     T_FLIP_ON));
    timers.push(setTimeout(placeCursorOnButton, T_RECURSOR));
    timers.push(setTimeout(pressDown,  T_PRESS_DOWN_2));
    timers.push(setTimeout(pressUp,    T_PRESS_UP_2));
    timers.push(setTimeout(flipOff,    T_FLIP_OFF));
    timers.push(setTimeout(placeCursorAtRest, T_CURSOR_REST));
    timers.push(setTimeout(function () { if (running) schedule(); }, T_LOOP_END));
  }

  function start() {
    if (running) return;
    running = true;
    rafId = requestAnimationFrame(schedule);
  }
  function stop() {
    running = false;
    clear();
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    flipOff();
    pressUp();
    placeCursorAtRest();
    if (video) video.pause();
  }

  // Only run while the demo is on-screen.
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) start(); else stop(); });
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

  // Respect reduced-motion: hold the flipped state, freeze the clip there.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    stop();
    flipOn();
    if (video) { try { video.currentTime = 4; } catch (e) {} video.pause(); }
  }
})();
