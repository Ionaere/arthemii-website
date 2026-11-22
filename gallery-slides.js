/*
 * Gallery: one photo per screen.
 * - When a photo comes into view its title drops in and the description slides up;
 *   when it leaves the screen it resets, so the animation plays again every time.
 * - Desktop: photos alternate left / right like a chessboard, the title and description
 *   sit in the white space on the other side. Very wide photos (and all photos on phones)
 *   get the title across their top edge and the description across the bottom edge.
 */
(function () {
  'use strict';
  var slides = Array.prototype.slice.call(document.querySelectorAll('.gslide'));
  if (!slides.length) return;

  // Desktop: photos alternate left / right (chessboard), text in the space on the other side.
  // Very wide photos and phones: title across the top edge of the photo, description across the bottom.
  var WIDE = 1.6;   // width / height above which a photo is too wide to share the screen with text
  function layout() {
    var desk = window.innerWidth >= 900;
    var n = 0;
    slides.forEach(function (s) {
      var side = desk && (parseFloat(s.style.getPropertyValue('--r')) || 1) < WIDE;
      var i = side ? n++ : n;
      var frame = s.querySelector('.gslide__frame');
      if (!frame) return;
      s.classList.remove('is-side', 'is-side-left', 'is-side-right');
      s.style.removeProperty('--gs-side');
      if (!side) return;
      s.classList.add('is-side', i % 2 ? 'is-side-left' : 'is-side-right');
      var cs = window.getComputedStyle(s);
      var inner = s.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      var gap = Math.min(48, Math.max(24, window.innerWidth * 0.03));
      var free = inner - frame.offsetWidth - gap;
      s.style.setProperty('--gs-side', Math.max(200, Math.min(free, 560)).toFixed(0) + 'px');
    });
  }
  var t;
  window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(layout, 100); });
  window.addEventListener('load', layout);
  layout();

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
