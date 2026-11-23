/*
 * Videos page: one video per screen. When a video comes into view its title drops in
 * and the description slides up; it resets when the video leaves the screen, so it
 * plays again every time.
 */
(function () {
  'use strict';
  var cards = Array.prototype.slice.call(document.querySelectorAll('.video-slides > .video-card'));
  if (!cards.length) return;
  if (!('IntersectionObserver' in window)) { cards.forEach(function (c) { c.classList.add('is-in'); }); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.intersectionRatio >= 0.45) e.target.classList.add('is-in');
      else if (e.intersectionRatio === 0) e.target.classList.remove('is-in');
    });
  }, { threshold: [0, 0.45] });
  cards.forEach(function (c) { io.observe(c); });
})();

