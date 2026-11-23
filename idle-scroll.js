/*
 * Gallery, Videos and Drawings pages: right away (and again 1 s after any activity) the page travels by
 * itself from photo to photo / video to video / line of drawings to the next, resting on each; at the end it goes back up. A touch, a key, the wheel or a click
 * stops it at once (just moving the mouse does not); it starts again after 1 quiet second. It rests while a photo or video is open full
 * screen, and while the tab is in the background.
 */
(function () {
  'use strict';
  if (window.__idleScroll || !window.requestAnimationFrame) return;
  window.__idleScroll = true;

  var IDLE_MS = 2000;        // quiet time after the visitor's own activity before it moves again
  var FIRST_MS = 2000;       // on page open it starts after about two seconds
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
    if (document.querySelector('.lightbox.is-open, .video-lightbox.is-open, .vlightbox.is-open, .mobile-nav.is-open')) return true;
    // other dialogs count only while they are actually shown (the video viewer keeps aria-modal even when closed)
    var dl = document.querySelectorAll('[aria-modal="true"]');
    for (var i = 0; i < dl.length; i++) {
      var cs = getComputedStyle(dl[i]);
      if (cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0) return true;
    }
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

  /* Gallery and Videos pages: instead of a steady glide it travels from photo to photo
     (video to video) — quickly
     between them, slowing down as it arrives, resting 5 s on each photo centred on the
     screen, then easing away slowly to the next. At the last photo it goes back up. */
  // Drawings page: every visual line of drawings is a stop (one drawing per line stands for it)
  function collect() {
    var list = document.querySelectorAll('.gslide, .video-slides > .video-card');
    if (list.length) return list;
    var out = [], lastTop = null;
    document.querySelectorAll('.drawings__rows .drawing').forEach(function (d) {
      var t = Math.round(d.getBoundingClientRect().top + window.scrollY);
      if (lastTop === null || Math.abs(t - lastTop) > 20) { out.push(d); lastTop = t; }
    });
    return out;
  }
  var slides = collect();
  var SLIDE_MODE = slides.length > 1;
  var HOLD = 5000;
  var move = null, holdUntil = 0, idx = -1;
  function slideTarget(i) {
    var r = slides[i].getBoundingClientRect();
    return Math.min(maxY(), Math.max(0, window.scrollY + r.top + r.height / 2 - window.innerHeight / 2));
  }
  function nearestIndex() {
    var best = 0, bd = 1e9, c = window.innerHeight / 2;
    for (var i = 0; i < slides.length; i++) {
      var r = slides[i].getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - c);
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }
  // slow start, fast middle, slow arrival
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function slideStep(now) {
    raf = 0;
    if (blocked()) { stop(); return; }
    if (move) {
      var t = Math.min(1, (now - move.t0) / move.dur);
      pos = move.from + (move.to - move.from) * ease(t);
      window.scrollTo({ top: pos, behavior: 'instant' });
      if (t >= 1) { move = null; holdUntil = now + HOLD; }
    } else if (now >= holdUntil && !videoBusy()) {
      var n = idx + dir;
      if (n >= slides.length || n < 0) { dir = -dir; n = idx + dir; }
      idx = Math.max(0, Math.min(slides.length - 1, n));
      var to = slideTarget(idx), from = window.scrollY, dist = Math.abs(to - from);
      move = { from: from, to: to, t0: now, dur: 1800 + Math.min(2600, dist * 1.1) };
    }
    raf = requestAnimationFrame(slideStep);
  }
  function slideStart() {
    timer = 0;
    if (raf || blocked()) return;
    if (videoBusy()) { resumeLater(); return; }
    slides = collect();                       // the layout may have changed (resize, images)
    idx = nearestIndex();
    // first glide onto the photo nearest the middle, then rest on it
    var to = slideTarget(idx), from = window.scrollY;
    pos = from;
    move = Math.abs(to - from) > 4 ? { from: from, to: to, t0: performance.now(), dur: 1800 + Math.min(2600, Math.abs(to - from) * 1.1) } : null;
    holdUntil = performance.now() + (move ? 0 : HOLD);
    if (idx >= slides.length - 1) dir = -1; else if (idx <= 0) dir = 1;
    raf = requestAnimationFrame(slideStep);
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  /* Videos page: resting the cursor on a video stops the travelling until that video has played
     to its end (the YouTube player tells us how long is left); then it carries on. */
  var hoverCard = null, videoUntil = 0, ytInfo = typeof WeakMap === 'function' ? new WeakMap() : null;
  function frameOf(card) { return card && card.querySelector('iframe'); }
  function remainingMs(card) {
    var f = frameOf(card), o = f && ytInfo && ytInfo.get(f);
    if (!o || !o.duration) return 0;
    var t = (o.t || 0) + (performance.now() - (o.at || performance.now())) / 1000;
    return Math.max(0, (o.duration - (t % o.duration)) * 1000);
  }
  var FALLBACK_MS = 15000;   // when the player has not told us the length yet
  function holdForVideo(card, fromInfo) {
    var left = remainingMs(card), now = performance.now();
    if (left) videoUntil = now + left;
    else if (!fromInfo) videoUntil = Math.max(videoUntil, now + FALLBACK_MS);
    stop();
    resumeLater();
  }
  function resumeLater() {
    if (timer) clearTimeout(timer);
    var wait = Math.max(IDLE_MS, videoUntil - performance.now());
    timer = setTimeout(SLIDE_MODE ? slideStart : start, wait);
  }
  function videoBusy() { return performance.now() < videoUntil; }
  window.addEventListener('message', function (e) {
    if (!ytInfo || !/youtube/.test(e.origin || '')) return;
    var d; try { d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch (_) { return; }
    if (!d || !d.info) return;
    document.querySelectorAll('iframe').forEach(function (f) {
      if (f.contentWindow !== e.source) return;
      var o = ytInfo.get(f) || {};
      if (d.info.duration) o.duration = d.info.duration;
      if (typeof d.info.currentTime === 'number') { o.t = d.info.currentTime; o.at = performance.now(); }
      ytInfo.set(f, o);
      if (hoverCard && frameOf(hoverCard) === f && !o.used) { o.used = true; holdForVideo(hoverCard, true); }
    });
  });
  document.querySelectorAll('.video-slides > .video-card').forEach(function (card) {
    card.addEventListener('mouseenter', function () {
      if (hoverCard === card) return;
      hoverCard = card;
      var f = frameOf(card), o = f && ytInfo && ytInfo.get(f);
      if (o) o.used = false;
      if (f) try { f.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*'); } catch (_) {}
      holdForVideo(card);
    });
    card.addEventListener('mouseleave', function () { if (hoverCard === card) hoverCard = null; });
  });
  function activity() {
    stop();
    if (timer) clearTimeout(timer);
    timer = 0;
    timer = setTimeout(SLIDE_MODE ? slideStart : start, Math.max(IDLE_MS, videoUntil - performance.now()));
  }

  // moving the mouse around does not stop it — only scrolling, a click, a touch or a key does
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

  // start right away when the page opens
  timer = setTimeout(SLIDE_MODE ? slideStart : start, FIRST_MS);
})();
