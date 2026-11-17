/*
 * "Columns" for the Gallery, Drawings, Videos and AI Content pages (styles in scroll-zoom.css).
 * The photos / drawings / video cards of each block are spread over 3 columns (2 on phones);
 * the middle column gets more pictures, so it is the tallest. While you scroll through the block,
 * the shorter columns slide down inside it at their own, slower speed, so the columns flow past
 * each other — and every column is still seen from its first to its last picture.
 */
(function () {
  'use strict';
  var GROUPS = [
    ['.gallery__rows', '.gallery__row > *'],
    ['.drawings__rows', '.drawings__row > *'],
    ['.video-grid', ':scope > .video-card']
  ];
  var blocks = [];

  function nCols() { return window.innerWidth <= 768 ? 2 : 3; }

  function collect() {
    GROUPS.forEach(function (g) {
      document.querySelectorAll(g[0]).forEach(function (box) {
        if (box.closest('.pc-col')) return;
        var items = Array.prototype.slice.call(box.querySelectorAll(g[1]));
        if (items.length < 3) return;
        items.forEach(function (it) { it.classList.add('pc-item'); });
        blocks.push({ box: box, items: items, n: 0, cols: [] });
      });
    });
  }

  function layout(b) {
    var n = nCols();
    if (b.n === n) return;
    b.n = n;
    var wrap = document.createElement('div');
    wrap.className = 'pc-cols';
    b.cols = [];
    for (var i = 0; i < n; i++) {
      var c = document.createElement('div');
      c.className = 'pc-col';
      wrap.appendChild(c);
      b.cols.push(c);
    }
    b.box.classList.add('pc');
    b.box.innerHTML = '';
    b.box.appendChild(wrap);
    // in the original order, each picture into the column that is "shortest" for its weight:
    // the middle column (or the right one on phones) takes more, so the columns differ in length
    var w = n === 2 ? [0.78, 1.22] : [0.85, 1.25, 0.72];
    b.items.forEach(function (it) {
      var best = 0;
      for (var k = 1; k < b.cols.length; k++) if (b.cols[k].offsetHeight / w[k] < b.cols[best].offsetHeight / w[best] - 1) best = k;
      b.cols[best].appendChild(it);
    });
  }

  function move() {
    var vh = window.innerHeight;
    blocks.forEach(function (b) {
      var r = b.box.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) return;
      // 0 when the block's top reaches the top of the screen, 1 when its bottom reaches the bottom
      var t = -r.top / Math.max(1, r.height - vh);
      t = t < 0 ? 0 : (t > 1 ? 1 : t);
      var hc = 0;
      b.cols.forEach(function (c) { hc = Math.max(hc, c.offsetHeight); });
      b.cols.forEach(function (c) {
        var d = (hc - c.offsetHeight) * t;   // shorter columns slide down slower than the page
        c.style.transform = 'translate3d(0,' + d.toFixed(1) + 'px,0)';
      });
    });
  }

  var ticking = false;
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; move(); }); } }

  function reveal() {
    var all = [];
    blocks.forEach(function (b) { all = all.concat(b.items); });
    if (!('IntersectionObserver' in window)) { all.forEach(function (it) { it.classList.add('pc-in'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('pc-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px' });
    all.forEach(function (it) { io.observe(it); });
  }

  function init() {
    collect();
    if (!blocks.length) return;
    blocks.forEach(layout);
    reveal();
    move();
    window.addEventListener('scroll', onScroll, { passive: true });
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { blocks.forEach(layout); move(); }, 150);
    });
    window.addEventListener('load', move);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
