/*
 * Smooth (eased) scrolling for mouse wheels and trackpads.
 *
 * The page keeps its native scrolling; this only turns each wheel step into a
 * short eased glide. Touch screens, keyboard, scrollbar dragging and anchor
 * links keep the browser's own behaviour. Nothing happens for visitors who ask
 * their system for reduced motion.
 */
(function () {
  'use strict';

  if (!window.requestAnimationFrame || !('onwheel' in window)) return;
  var mq = function (q) { return window.matchMedia && window.matchMedia(q).matches; };
  if (mq('(prefers-reduced-motion: reduce)')) return;
  // Phones and tablets already scroll smoothly with the finger
  // Only for a real mouse or trackpad: phones and tablets keep their own (already smooth) scrolling
  if (!mq('(hover: hover) and (pointer: fine)')) return;
  if (mq('(any-pointer: coarse)') && !mq('(any-hover: hover)')) return;
  // Safari (and every browser on iPhone/iPad, all WebKit): its own wheel and trackpad scrolling is
  // already smooth and runs off the main thread, while a scroll moved by script on every frame is
  // snapped to whole pixels and capped at 60 fps there, which looks jerky. Leave it to Safari.
  if (/Apple/.test(navigator.vendor || '')) return;

  var EASE = 0.11;       // share of the remaining distance covered per frame (60 fps)
  var target = 0, current = 0, running = false, last = 0, disabled = false;
  var root = document.documentElement;

  function maxScroll() { return Math.max(0, root.scrollHeight - window.innerHeight); }

  function wheelDelta(e) {
    var d = e.deltaY;
    if (e.deltaMode === 1) d *= 40;                       // lines
    else if (e.deltaMode === 2) d *= window.innerHeight;  // pages
    return d;
  }

  // Trackpads (and Magic Mouse) already scroll smoothly with their own momentum: smoothing them
  // again makes the page lag and stick, so they are left to the browser. A trackpad sends many
  // small, fine-grained steps; a mouse wheel sends whole notches.
  var padUntil = 0;
  function isTrackpad(e) {
    var now = performance.now();
    var pad = e.deltaMode === 0 && (
      (e.wheelDeltaY && e.wheelDeltaY === -3 * e.deltaY) ||
      Math.abs(e.deltaY) < 10 || e.deltaY % 1 !== 0 || e.deltaX !== 0);
    if (pad) padUntil = now + 1200;          // its momentum keeps coming for a while
    return pad || now < padUntil;
  }

  // Leave the wheel to the browser where smoothing would get in the way
  function useNative(e) {
    if (isTrackpad(e)) return true;
    if (e.ctrlKey || e.metaKey || e.defaultPrevented) return true;   // zoom, other handlers
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return true;        // sideways
    if (root.style.overflow === 'hidden' || document.body.style.overflow === 'hidden') return true; // lightbox open
    if (document.querySelector('.mobile-nav.is-open')) return true;
    if (e.target && e.target.closest && e.target.closest('[data-native-scroll]')) return true;
    for (var el = e.target; el && el.nodeType === 1 && el !== document.body && el !== root; el = el.parentElement) {
      // only tall boxes or boxes with hidden content can matter: skip the rest without asking for styles
      var tall = el.offsetHeight > window.innerHeight * 0.5, more = el.scrollHeight > el.clientHeight + 1;
      if (!tall && !more) continue;
      var cs = window.getComputedStyle(el);
      // Full-screen overlays (lightboxes, menus)
      if (tall && cs.position === 'fixed') return true;
      // Boxes that scroll on their own and still have room to move
      if (more && /(auto|scroll)/.test(cs.overflowY)) {
        if ((e.deltaY < 0 && el.scrollTop > 0) ||
            (e.deltaY > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1)) return true;
      }
    }
    return false;
  }

  function jump(y) {
    try { window.scrollTo({ top: y, left: window.scrollX, behavior: 'instant' }); }
    catch (err) { window.scrollTo(window.scrollX, y); }
  }

  function stop() { running = false; }

  function tick(now) {
    if (!running) return;
    var dt = Math.min(64, now - last);
    last = now;
    var k = 1 - Math.pow(1 - EASE, dt / 16.667);
    target = Math.min(target, maxScroll());
    current += (target - current) * k;
    if (Math.abs(target - current) < 0.5) current = target;
    jump(current);
    if (current === target) { stop(); return; }
    requestAnimationFrame(tick);
  }

  window.addEventListener('wheel', function (e) {
    if (disabled || useNative(e)) { stop(); return; }
    e.preventDefault();
    if (!running) { current = target = window.scrollY; }
    target = Math.max(0, Math.min(maxScroll(), target + wheelDelta(e)));
    if (!running) {
      running = true;
      last = performance.now();
      requestAnimationFrame(tick);
    }
  }, { passive: false });

  // Something else moved the page (keyboard, scrollbar, an anchor link): hand over
  window.addEventListener('scroll', function () {
    if (running && Math.abs(window.scrollY - current) > 3) stop();
  }, { passive: true });
  window.addEventListener('keydown', stop);
  window.addEventListener('mousedown', stop);
  // A touch means a touch screen: hand scrolling back to the browser for good
  window.addEventListener('touchstart', function () { stop(); disabled = true; }, { passive: true, once: true });
})();
