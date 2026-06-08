/* Adds .loaded to every .fade-up element on next animation frame so the
   CSS transition kicks in once the page is painted. */
(function () {
  'use strict';
  function reveal() {
    var nodes = document.querySelectorAll('.fade-up');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].classList.add('loaded');
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      requestAnimationFrame(reveal);
    });
  } else {
    requestAnimationFrame(reveal);
  }
})();
