/* IntersectionObserver: toggles .in-view on every .reveal once it enters
   the viewport. One-shot — never untoggles. Falls back to a no-op (all
   reveals stay visible thanks to the .loaded path) on legacy browsers. */
(function () {
  'use strict';
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in-view'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
})();
