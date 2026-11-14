/*
 * Gallery photo pages: go to the previous / next photo with the keyboard
 * (← →) or a swipe on the photo, and prefetch the next page so it opens fast.
 * The links themselves are plain <a rel="prev|next"> in the page.
 */
(function () {
  'use strict';
  var prev = document.querySelector('a[rel="prev"]');
  var next = document.querySelector('a[rel="next"]');
  if (!prev || !next) return;

  function go(a) { if (a && a.href) window.location.href = a.href; }

  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(prev); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(next); }
  });

  var view = document.querySelector('.photo-view');
  if (view) {
    var sx = 0, sy = 0, on = false;
    view.addEventListener('touchstart', function (e) {
      on = e.touches.length === 1;
      if (on) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }
    }, { passive: true });
    view.addEventListener('touchend', function (e) {
      if (!on) return;
      on = false;
      var dx = e.changedTouches[0].clientX - sx;
      var dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? next : prev);
    }, { passive: true });
  }

  // Prefetch the next page so the next photo opens without waiting
  [next, prev].forEach(function (a) {
    var l = document.createElement('link');
    l.rel = 'prefetch';
    l.href = a.href;
    document.head.appendChild(l);
  });
})();

/*
 * The photo fits the screen: as large as it can be without scrolling, centred on
 * the page, and brought to the middle of the screen when the page opens.
 */
(function () {
  'use strict';
  var view = document.querySelector('.photo-view');
  var img = view && view.querySelector('img');
  if (!img) return;
  var pic = img.closest('picture');
  var centred = false;

  function headerH() {
    var h = document.querySelector('.header');
    return h ? h.offsetHeight : 72;
  }
  function fit() {
    var nw = img.naturalWidth, nh = img.naturalHeight;
    if (!nw || !nh) return;
    view.style.width = '';
    if (pic) pic.style.width = '';
    var box = view.clientWidth;
    var maxH = Math.max(220, window.innerHeight - headerH() - 40);
    var s = Math.min(box / nw, maxH / nh);
    var w = Math.round(nw * s);
    img.style.width = w + 'px';
    img.style.height = 'auto';
    img.style.maxWidth = '100%';
    img.style.margin = '0 auto';
    if (pic) pic.style.width = w + 'px';
    view.style.width = w + 'px';
    view.style.maxWidth = '100%';
    view.style.marginLeft = 'auto';
    view.style.marginRight = 'auto';
  }
  function centre() {
    if (centred) return;
    centred = true;
    // Only on a fresh open, not when the browser brings back an earlier scroll position
    if (window.scrollY > 10 || location.hash) return;
    var r = img.getBoundingClientRect(), hh = headerH();
    var avail = window.innerHeight - hh;
    var y = window.scrollY + r.top - hh - Math.max(0, (avail - r.height) / 2);
    if (y > 4) window.scrollTo({ top: y, behavior: 'smooth' });
  }
  function ready() { fit(); requestAnimationFrame(centre); }
  if (img.complete && img.naturalWidth) ready();
  else img.addEventListener('load', ready);
  var t;
  window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(fit, 120); });
})();
