/*
 * About page: scroll-driven text lens + name wordmark.
 *
 * 1. Every line of text is small near the top and bottom edges of the screen
 *    and grows to its full size as it approaches the middle (a soft "lens").
 *    Each word is wrapped in a span; words on the same line scale together
 *    around the line's start, so lines stay aligned and nothing overlaps.
 * 2. The "Arthemii Ionaere" wordmark at the top behaves like "Ionaere Studio"
 *    on the home page: drops in when the page opens (CSS), flies away while
 *    scrolling down and comes back on the way up.
 *
 * Works together with i18n.js: word spans are marked data-no-i18n, and when
 * the language changes the original text is put back for i18n.js to translate,
 * then split again. Nothing happens for visitors who ask for reduced motion.
 */
(function () {
  'use strict';

  if (!window.requestAnimationFrame || !document.querySelector) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var main = document.querySelector('main');
  if (!main) return;

  var MIN_SCALE = 0.72;    // size of a line at the very edge of the screen
  var MIN_OPACITY = 0.35;  // its opacity there
  var PLATEAU = 0.18;      // middle share of the screen where text stays at full size

  var SELECTOR = [
    '.section__label', '.section__title', '.section__desc',
    '.about-name', '.about-text p', '.about-image__caption',
    '.quote__text', '.quote__author',
    '.philosophy-card__num', '.philosophy-card__title', '.philosophy-card__text'
  ].join(',');

  var st = document.createElement('style');
  st.textContent =
    '.tl-chunk{display:inline}' +
    '.tl-w{display:inline-block;transform-origin:50% 50%}';
  document.head.appendChild(st);

  var blocks = [];       // { el, align, words: [span], lines: [{ cy, words: [{ el, cx }] , ref }] }
  var chunks = [];       // wrapper spans that replaced a text node (each keeps the original node)
  var dirty = true;
  var ticking = false;

  /* ---------- splitting into words ---------- */

  function splitTextNode(node) {
    var text = node.nodeValue;
    if (!text || !/\S/.test(text)) return;
    var wrap = document.createElement('span');
    wrap.className = 'tl-chunk';
    wrap.setAttribute('data-no-i18n', '');
    var parts = text.split(/(\s+)/);
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (!p) continue;
      if (/^\s+$/.test(p)) { wrap.appendChild(document.createTextNode(p)); continue; }
      var w = document.createElement('span');
      w.className = 'tl-w';
      w.textContent = p;
      wrap.appendChild(w);
    }
    wrap._orig = node;
    node.parentNode.replaceChild(wrap, node);
    chunks.push(wrap);
  }

  function split() {
    blocks = [];
    var els = main.querySelectorAll(SELECTOR);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      // A <p> inside an element we already handle is covered by its parent
      if (el.parentElement && el.parentElement.closest(SELECTOR)) continue;
      var tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
      var nodes = [], n;
      while ((n = tw.nextNode())) {
        if (n.parentNode.closest('.tl-chunk')) continue;
        nodes.push(n);
      }
      nodes.forEach(splitTextNode);
      var words = Array.prototype.slice.call(el.querySelectorAll('.tl-w'));
      if (!words.length) continue;
      var ta = window.getComputedStyle(el).textAlign;
      blocks.push({ el: el, align: ta === 'center' ? 'c' : (ta === 'right' || ta === 'end') ? 'r' : 'l', words: words, lines: [] });
    }
    dirty = true;
  }

  function unsplit() {
    chunks.forEach(function (c) {
      if (c.parentNode && c._orig) c.parentNode.replaceChild(c._orig, c);
    });
    chunks = [];
    blocks = [];
  }

  /* ---------- measuring lines ---------- */

  function measure() {
    var sy = window.scrollY || window.pageYOffset;
    blocks.forEach(function (b) {
      b.words.forEach(function (w) { w.style.transform = ''; w.style.opacity = ''; });
    });
    blocks.forEach(function (b) {
      var items = b.words.map(function (w) {
        var r = w.getBoundingClientRect();
        return { el: w, top: r.top + sy, cy: r.top + sy + r.height / 2, l: r.left, r: r.right, cx: r.left + r.width / 2 };
      });
      items.sort(function (a, c) { return a.top - c.top || a.l - c.l; });
      var lines = [], cur = null;
      items.forEach(function (it) {
        if (!cur || Math.abs(it.top - cur.top) > 4) {
          cur = { top: it.top, cy: it.cy, min: it.l, max: it.r, words: [] };
          lines.push(cur);
        }
        cur.min = Math.min(cur.min, it.l);
        cur.max = Math.max(cur.max, it.r);
        cur.words.push(it);
      });
      lines.forEach(function (ln) {
        ln.ref = b.align === 'c' ? (ln.min + ln.max) / 2 : b.align === 'r' ? ln.max : ln.min;
        ln.last = -1;
      });
      b.lines = lines;
    });
    dirty = false;
  }

  /* ---------- applying the lens ---------- */

  function smooth(t) { return t * t * (3 - 2 * t); }

  function render() {
    if (dirty) measure();
    var sy = window.scrollY || window.pageYOffset;
    var vh = window.innerHeight;
    var mid = sy + vh / 2;
    var half = vh / 2;
    var lo = sy - vh * 0.25, hi = sy + vh * 1.25;
    for (var i = 0; i < blocks.length; i++) {
      var lines = blocks[i].lines;
      for (var j = 0; j < lines.length; j++) {
        var ln = lines[j];
        if (ln.cy < lo || ln.cy > hi) continue;
        var d = Math.min(1, Math.abs(ln.cy - mid) / half);
        var t = d <= PLATEAU ? 0 : smooth((d - PLATEAU) / (1 - PLATEAU));
        var s = 1 - (1 - MIN_SCALE) * t;
        var key = Math.round(s * 1000);
        if (key === ln.last) continue;
        ln.last = key;
        var o = (1 - (1 - MIN_OPACITY) * t).toFixed(3);
        for (var k = 0; k < ln.words.length; k++) {
          var w = ln.words[k];
          var dx = (s - 1) * (w.cx - ln.ref);
          w.el.style.transform = 'translate3d(' + dx.toFixed(2) + 'px,0,0) scale(' + s.toFixed(3) + ')';
          w.el.style.opacity = o;
        }
      }
    }
  }

  /* ---------- name wordmark (same as Ionaere Studio on the home page) ---------- */

  // Flies up and out of the screen while scrolling down, comes back on the way up
  var wm = document.querySelector('.about-studio__inner');

  function wmUpdate() {
    if (!wm) return;
    var h = window.innerHeight;
    var p = Math.min(Math.max((window.scrollY || window.pageYOffset) / Math.max(h * 0.6, 280), 0), 1);
    var e = p * p * (3 - 2 * p); /* smoothstep */
    wm.style.transform = 'translate3d(0,' + (-e * h * 1.1).toFixed(1) + 'px,0) scale(' + (1 + e * 0.9).toFixed(3) + ')';
    wm.style.opacity = (1 - e * e).toFixed(3);
  }

  /* ---------- wiring ---------- */

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; wmUpdate(); render(); });
  }

  function relayout() { dirty = true; onScroll(); }

  var resizeTimer;
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(relayout, 120);
  });
  window.addEventListener('load', relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);

  // Lazy images change where lines wrap
  main.querySelectorAll('img').forEach(function (img) {
    if (!img.complete) img.addEventListener('load', relayout);
  });
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(relayout);
    ro.observe(main);
  }

  // Language switched by i18n.js: put the original text back so it gets translated, then split again
  new MutationObserver(function () {
    unsplit();
    setTimeout(function () { split(); render(); }, 0);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  split();
  render();
  wmUpdate();
})();
