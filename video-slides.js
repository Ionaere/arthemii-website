/*
 * Videos page: one video per screen. When a video comes into view its title drops in
 * and the description slides up; it resets when the video leaves the screen, so it
 * plays again every time. Also numbers the videos (01 / 21).
 */
(function () {
  'use strict';
  var cards = Array.prototype.slice.call(document.querySelectorAll('.video-slides > .video-card'));
  if (!cards.length) return;
  var n = cards.length;
  cards.forEach(function (c, i) {
    c.setAttribute('data-count', (i < 9 ? '0' : '') + (i + 1) + ' / ' + (n < 10 ? '0' : '') + n);
  });
  if (!('IntersectionObserver' in window)) { cards.forEach(function (c) { c.classList.add('is-in'); }); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.intersectionRatio >= 0.45) e.target.classList.add('is-in');
      else if (e.intersectionRatio === 0) e.target.classList.remove('is-in');
    });
  }, { threshold: [0, 0.45] });
  cards.forEach(function (c) { io.observe(c); });
})();

/*
 * Videos page: the page scrolls by itself from one video to the next, like a slideshow.
 * Each video stays on screen for a few seconds; as soon as the visitor scrolls, clicks,
 * touches or presses a key, the automatic scrolling waits until they have been idle for a
 * while, then carries on from where they are. It stops after the last video and while the
 * full-screen viewer is open.
 */
(function () {
  'use strict';
  var cards = Array.prototype.slice.call(document.querySelectorAll('.video-slides > .video-card'));
  if (!cards.length) return;
  var DWELL = 7000;     // ms each video stays on screen
  var IDLE = 9000;      // ms to wait after the visitor's own scrolling / clicking
  var DURATION = 1600;  // ms of the glide to the next video
  var lastUser = 0, lastMove = performance.now(), anim = 0;

  function user() { lastUser = performance.now(); if (anim) { cancelAnimationFrame(anim); anim = 0; } }
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (ev) {
    window.addEventListener(ev, user, { passive: true });
  });

  function jump(y) {
    try { window.scrollTo({ top: y, left: 0, behavior: 'instant' }); } catch (e) { window.scrollTo(0, y); }
  }
  function glide(to) {
    var from = window.scrollY, d = to - from, t0 = performance.now();
    var root = document.documentElement, sb = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';           // the page's CSS smooth scrolling would fight the glide
    function step(now) {
      var p = Math.min(1, (now - t0) / DURATION);
      var e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;   // ease in-out
      jump(from + d * e);
      if (p < 1) anim = requestAnimationFrame(step);
      else { anim = 0; root.style.scrollBehavior = sb; lastMove = performance.now(); }
    }
    anim = requestAnimationFrame(step);
  }
  function viewerOpen() {
    var b = document.body, r = document.documentElement;
    return b.style.overflow === 'hidden' || r.style.overflow === 'hidden' || document.fullscreenElement;
  }
  function nextTarget() {
    for (var i = 0; i < cards.length; i++) {
      var top = cards[i].getBoundingClientRect().top;
      if (top > 8) return window.scrollY + top;
    }
    return null;
  }
  setInterval(function () {
    var now = performance.now();
    if (anim || document.hidden || viewerOpen()) return;
    if (now - lastUser < IDLE || now - lastMove < DWELL) return;
    var y = nextTarget();
    if (y === null) return;                          // after the last video: stay there
    glide(Math.min(y, document.documentElement.scrollHeight - window.innerHeight));
  }, 400);
})();
