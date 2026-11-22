/*
 * Gallery: one photo per screen. When a photo comes into view its title drops onto
 * it and the description slides up; when it leaves the screen it resets, so the
 * animation plays again every time you scroll to it.
 */
(function () {
  'use strict';
  var slides = document.querySelectorAll('.gslide');
  if (!slides.length) return;
  if (!('IntersectionObserver' in window)) {
    slides.forEach(function (s) { s.classList.add('is-in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.intersectionRatio >= 0.45) e.target.classList.add('is-in');
      else if (e.intersectionRatio === 0) e.target.classList.remove('is-in');
    });
  }, { threshold: [0, 0.45] });
  slides.forEach(function (s) { io.observe(s); });
})();
