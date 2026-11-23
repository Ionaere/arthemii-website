/*
 * Gallery and Videos pages: after 3 seconds without any activity the page starts to
 * scroll down slowly by itself, like a slideshow; at the bottom it glides back up, and so on. Any movement of the mouse, a touch,
 * a key, the wheel or a click stops it at once; it starts again after 3 more quiet
 * seconds. It rests while a photo or video is open full
 * screen, and while the tab is in the background.
 */
(function () {
  'use strict';
  if (window.__idleScroll || !window.requestAnimationFrame) return;
  window.__idleScroll = true;

  var IDLE_MS = 3000;
  var SPEED = 64;            // pixels per second at full speed
  var RAMP = 1.5;            // seconds to ease from still to full speed

  var timer = 0, raf = 0, last = 0, started = 0, pos = 0, dir = 1, pauseUntil = 0;
  var END_PAUSE = 1500;      // ms to rest at the bottom / top before turning round

  function blocked() {
    if (document.hidden) return true;
    var b = document.body, h = document.documentElement;
    // a lightbox or menu is open (they lock the page scroll)
    if (getComputedStyle(b).overflow === 'hidden' || getComputedStyle(h).overflow === 'hidden') return true;
    if (document.fullscreenElement || document.webkitFullscreenElement) return true;
    if (document.querySelector('.lightbox.is-open, .video-lightbox.is-open, .mobile-nav.is-open, [aria-modal="true"]')) return true;
    return false;
  }
  function maxY() { return Math.max(0, document.documentElement.scrollHeight - window.innerHeight); }
  function atBottom() { return window.scrollY >= maxY() - 2; }

  function step(now) {
    raf = 0;
    if (blocked()) { stop(); return; }
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    if (now < pauseUntil) { raf = requestAnimationFrame(step); return; }
    // at the bottom it turns round and glides back up; at the top it goes down again
    if (dir > 0 && pos >= maxY() - 1) { dir = -1; pauseUntil = now + END_PAUSE; started = pauseUntil; raf = requestAnimationFrame(step); return; }
    if (dir < 0 && pos <= 0) { dir = 1; pauseUntil = now + END_PAUSE; started = pauseUntil; raf = requestAnimationFrame(step); return; }
    var t = (now - started) / 1000;
    var k = t < RAMP ? (t / RAMP) * (t / RAMP) : 1;
    pos = Math.min(maxY(), Math.max(0, pos + dir * SPEED * k * dt));
    window.scrollTo({ top: pos, behavior: 'instant' });
    raf = requestAnimationFrame(step);
  }
  function start() {
    timer = 0;
    if (raf || blocked()) return;
    pos = window.scrollY; last = 0; started = performance.now(); pauseUntil = 0;
    if (atBottom()) dir = -1; else if (pos <= 0) dir = 1;
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
