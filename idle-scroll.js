/*
 * Gallery and Videos pages: after 3 seconds without any activity the page starts to
 * scroll down slowly by itself, like a slideshow. Any movement of the mouse, a touch,
 * a key, the wheel or a click stops it at once; it starts again after 3 more quiet
 * seconds. It stops at the bottom of the page, while a photo or video is open full
 * screen, and while the tab is in the background.
 */
(function () {
  'use strict';
  if (window.__idleScroll || !window.requestAnimationFrame) return;
  window.__idleScroll = true;

  var IDLE_MS = 3000;
  var SPEED = 64;            // pixels per second at full speed
  var RAMP = 1.5;            // seconds to ease from still to full speed

  var timer = 0, raf = 0, last = 0, started = 0, pos = 0;

  function blocked() {
    if (document.hidden) return true;
    var b = document.body, h = document.documentElement;
    // a lightbox or menu is open (they lock the page scroll)
    if (getComputedStyle(b).overflow === 'hidden' || getComputedStyle(h).overflow === 'hidden') return true;
    if (document.fullscreenElement || document.webkitFullscreenElement) return true;
    if (document.querySelector('.lightbox.is-open, .video-lightbox.is-open, .mobile-nav.is-open, [aria-modal="true"]')) return true;
    return false;
  }
  function atBottom() {
    return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
  }

  function step(now) {
    raf = 0;
    if (blocked() || atBottom()) { stop(); return; }
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    var t = (now - started) / 1000;
    var k = t < RAMP ? (t / RAMP) * (t / RAMP) : 1;
    pos += SPEED * k * dt;
    window.scrollTo({ top: pos, behavior: 'instant' });
    raf = requestAnimationFrame(step);
  }
  function start() {
    timer = 0;
    if (raf || blocked() || atBottom()) return;
    pos = window.scrollY; last = 0; started = performance.now();
    raf = requestAnimationFrame(step);
  }
  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }
  function activity() {
    stop();
    if (timer) clearTimeout(timer);
    timer = setTimeout(start, IDLE_MS);
  }

  // browsers send a "mouse move" when the page scrolls under a still mouse: only real moves count
  var mx = -1, my = -1;
  window.addEventListener('mousemove', function (e) {
    if (e.clientX === mx && e.clientY === my) return;
    mx = e.clientX; my = e.clientY;
    activity();
  }, { passive: true, capture: true });
  ['mousedown', 'wheel', 'touchstart', 'touchmove', 'keydown', 'click', 'pointerdown'].forEach(function (ev) {
    window.addEventListener(ev, activity, { passive: true, capture: true });
  });
  // a scroll that we did not make ourselves (scrollbar, keyboard, anchor link) also counts
  window.addEventListener('scroll', function () {
    if (raf && Math.abs(window.scrollY - pos) < 4) return;   // our own slow scroll
    if (!raf && timer) return;                              // already waiting
    activity();
  }, { passive: true });
  document.addEventListener('visibilitychange', activity);

  activity();
})();
