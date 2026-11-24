/*
 * Home page, Projects (desktop only): each opened project is laid out like a magazine page —
 * one large photo first, then the text, then the rest of the photos in even rows across
 * the full width. Phones keep the original layout.
 */
(function () {
  'use strict';

  var MIN_W = 0;            /* phones too: large photo with the title on it */
  function rowH() { return window.innerWidth < 769 ? 150 : 330; }  /* target height of a photo row, px */
  var GAP = 8;

  var css =
    '.tech-block__inner.tb-editorial{display:block!important}' +
    '.tb-hero{margin:0 0 var(--spacing-xl)}' +
    '.tb-hero>*{display:block;width:min(100%,calc(78vh * var(--r)));aspect-ratio:var(--r);margin:0 auto;border-radius:10px;overflow:hidden;background:var(--bg-alt)}' +
    '.tb-hero picture{display:block;height:100%}' +
    '.tb-hero img,.tb-hero video{display:block;width:100%;height:100%;object-fit:cover}' +
    '.tb-editorial>.tb-text{max-width:780px;margin:0 auto var(--spacing-xl);text-align:center}' +
    '.tb-editorial>.tb-text .tech-block__desc{font-size:1.0625rem;line-height:1.85}' +
    '.tb-editorial>.tech-block__photos{gap:' + GAP + 'px!important;margin-top:0!important}' +
    '.tb-editorial .tech-block__row{gap:' + GAP + 'px!important;justify-content:center}' +
    '.tb-editorial .tech-block__row>*{border-radius:8px!important}' +
    /* the opened title sits on the top of the large photo, in white over a soft shade */
    '.tech-block.is-open .tech-block__body .tb-editorial{padding-top:0!important}' +
    '.tech-block.tb-on.is-open .tech-block__head{position:relative;z-index:3;margin-top:var(--spacing-xl);margin-bottom:calc(-1 * var(--tb-head-h, 80px) - 18px);padding-left:var(--spacing-md);padding-right:var(--spacing-md);box-sizing:border-box;width:100%;transform:translateY(18px)}' +
    '.tech-block.tb-on.is-open .tech-block__head .wm-title{color:#fff!important;text-shadow:0 1px 18px rgba(0,0,0,.35)}' +
    '.tech-block.tb-on.is-open .tech-block__head .wm-title::before,.tech-block.tb-on.is-open .tech-block__head .wm-title::after{background:rgba(255,255,255,.8)!important}' +
    '.tech-block.tb-on.is-open .tech-block__head .wm-num{color:rgba(255,255,255,.8)!important}' +
    '.tech-block.tb-on.is-open .tech-block__chev{color:#fff!important}' +
    '.tb-hero>*{position:relative;width:100%!important;aspect-ratio:auto!important}' +
    '.tech-block.tb-on.tb-above.is-open .tech-block__head{margin-bottom:var(--spacing-md)!important;transform:none!important;padding-left:0;padding-right:0}' +
    '.tech-block.tb-on.tb-above.is-open .tech-block__head .wm-title{color:var(--text)!important;text-shadow:none!important}' +
    '.tech-block.tb-on.tb-above.is-open .tech-block__head .wm-title::before,.tech-block.tb-on.tb-above.is-open .tech-block__head .wm-title::after{background:#bdbdbd!important}' +
    '.tech-block.tb-on.tb-above.is-open .tech-block__head .wm-num{color:#c9c9c9!important}' +
    '.tech-block.tb-on.tb-above.is-open .tech-block__chev{color:var(--text-secondary)!important}' +
    '.tech-block.tb-above .tb-hero>*::after{display:none}' +
    '@media (max-width:768px){.tech-block.tb-on.is-open .tech-block__head{padding-left:var(--spacing-sm);padding-right:var(--spacing-sm);margin-top:var(--spacing-md)}.tb-editorial>.tb-text{text-align:left;margin-bottom:var(--spacing-lg)}.tb-editorial>.tb-text .tech-block__desc{font-size:1rem}.tb-hero{margin-bottom:var(--spacing-lg)}.tb-editorial>.tech-block__photos,.tb-editorial .tech-block__row{gap:6px!important}.tb-editorial .tech-block__row{flex-wrap:nowrap!important}.tb-editorial .tech-block__row>*{aspect-ratio:var(--r)!important;height:auto!important;width:auto!important;min-width:0!important;flex:var(--r) 1 0!important}}' +
    '.tb-hero>*::after{content:"";position:absolute;left:0;right:0;top:0;height:min(45%,260px);background:linear-gradient(rgba(0,0,0,.5),rgba(0,0,0,0));pointer-events:none;z-index:1}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  function ratio(el) { return parseFloat(el.style.getPropertyValue('--r')) || 1.5; }

  var blocks = [];

  function prepare(block) {
    var inner = block.querySelector('.tech-block__inner');
    var photos = inner && inner.querySelector(':scope > .tech-block__photos');
    if (!photos) return null;
    var text = null;
    for (var i = 0; i < inner.children.length; i++) {
      var c = inner.children[i];
      if (c !== photos && c.tagName === 'DIV') { text = c; break; }
    }
    var rows = Array.prototype.slice.call(photos.querySelectorAll(':scope > .tech-block__row'));
    var orig = rows.map(function (r) { return { row: r, items: Array.prototype.slice.call(r.children) }; });
    var media = [];
    orig.forEach(function (o) { media = media.concat(o.items); });
    if (media.length < 2) return null;
    return { block: block, inner: inner, photos: photos, text: text, orig: orig, media: media, on: false, hero: null };
  }

  /* split the photos into rows that all fill the width exactly, with heights as even as
     possible (no lonely photo in a last row) */
  function partition(rs, k) {
    var n = rs.length, pre = [0];
    for (var i = 0; i < n; i++) pre.push(pre[i] + rs[i]);
    var mean = pre[n] / k, INF = 1e18;
    var cost = [], cut = [];
    for (var j = 0; j <= k; j++) { cost.push([]); cut.push([]); for (var i2 = 0; i2 <= n; i2++) cost[j].push(INF); }
    cost[0][0] = 0;
    for (var j2 = 1; j2 <= k; j2++) {
      for (var e = 1; e <= n; e++) {
        for (var st2 = j2 - 1; st2 < e; st2++) {
          if (cost[j2 - 1][st2] === INF) continue;
          var sum = pre[e] - pre[st2];
          /* height of a row is width / sum: penalise rows much taller or flatter than the mean */
          var d = Math.log(sum / mean), c = cost[j2 - 1][st2] + d * d + (e - st2 === 1 && n > 2 ? 1.5 : 0);
          if (c < cost[j2][e]) { cost[j2][e] = c; cut[j2][e] = st2; }
        }
      }
    }
    var groups = [], e2 = n;
    for (var j3 = k; j3 > 0; j3--) { var s3 = cut[j3][e2]; groups.unshift([s3, e2]); e2 = s3; }
    groups.cost = cost[k][n];
    return groups;
  }

  function sizeHero(b) {
    if (!b.heroItem) return;
    var W = b.inner.clientWidth || 1200;
    var hh = Math.min(W / ratio(b.heroItem), window.innerHeight * (window.innerWidth < 769 ? 0.62 : 0.78));
    if (window.innerWidth < 769) hh = Math.max(hh, W * 0.72);   /* phones: tall enough for the title */
    b.heroItem.style.height = Math.round(hh) + 'px';
  }

  function bestRows(rs, k0) {
    var best = null;
    for (var k = Math.max(1, k0 - 1); k <= Math.min(rs.length, k0 + 1); k++) {
      var g = partition(rs, k);
      if (!best || g.cost < best.cost - 1e-9) best = g;
    }
    return best;
  }

  function pack(b) {
    b.packedW = b.photos.clientWidth;
    sizeHero(b);
    var rest = b.media.filter(function (m) { return m !== b.heroItem; });
    b.photos.innerHTML = '';
    if (!rest.length) return;
    var W = b.photos.clientWidth || b.inner.clientWidth || 1200;
    /* data-layout="tall-left": the tall works side by side on the left, the wide ones two per row on the right */
    if (b.block.getAttribute('data-layout') === 'tall-left') {
      var tall = rest.filter(function (m) { return ratio(m) < 1; }), wide = rest.filter(function (m) { return ratio(m) >= 1; });
      if (tall.length && wide.length) {
        var G = 8;
        var wr = [];
        for (var q = 0; q < wide.length; q += 2) wr.push(wide.slice(q, q + 2));
        var rowSum = wr.map(function (r) { return r.reduce(function (a, m) { return a + ratio(m); }, 0); });
        var tallSum = tall.reduce(function (a, m) { return a + ratio(m); }, 0);
        /* equal heights: left height = right height (sum of the rows, with gaps) */
        var lo = 50, hi = W, Wl = W / 3;
        for (var it = 0; it < 40; it++) {
          Wl = (lo + hi) / 2;
          var Wr = W - Wl - G, hl = (Wl - G * (tall.length - 1)) / tallSum, hr = 0;
          rowSum.forEach(function (rsum, ri) { hr += (Wr - G * (wr[ri].length - 1)) / rsum; });
          hr += G * (wr.length - 1);
          if (hl > hr) hi = Wl; else lo = Wl;
        }
        var wrap = document.createElement('div');
        wrap.className = 'tb-split';
        wrap.style.cssText = 'display:flex;gap:' + G + 'px;align-items:stretch';
        var left = document.createElement('div');
        left.className = 'tech-block__row tb-row';
        left.style.cssText = 'flex:0 0 ' + Wl.toFixed(1) + 'px;width:' + Wl.toFixed(1) + 'px';
        tall.forEach(function (m) { m.style.flex = ''; m.style.width = ''; left.appendChild(m); });
        var right = document.createElement('div');
        right.style.cssText = 'flex:1 1 0;min-width:0;display:flex;flex-direction:column;gap:' + G + 'px';
        wr.forEach(function (r) {
          var el = document.createElement('div'); el.className = 'tech-block__row tb-row';
          r.forEach(function (m) { m.style.flex = ''; m.style.width = ''; el.appendChild(m); });
          right.appendChild(el);
        });
        wrap.appendChild(left); wrap.appendChild(right);
        b.photos.appendChild(wrap);
        return;
      }
    }
    var rs = rest.map(ratio), total = rs.reduce(function (a, c) { return a + c; }, 0);
    var k = Math.max(1, Math.min(rest.length, Math.round(total * rowH() / W)));
    bestRows(rs, k).forEach(function (g) {
      var el = document.createElement('div');
      el.className = 'tech-block__row tb-row';
      for (var i = g[0]; i < g[1]; i++) { rest[i].style.flex = ''; rest[i].style.width = ''; el.appendChild(rest[i]); }
      b.photos.appendChild(el);
    });
  }

  function apply(b) {
    if (!b.on) {
      var best = b.media[0];
      b.media.forEach(function (m) { if (ratio(m) > ratio(best) + 0.05) best = m; });
      b.media.forEach(function (m) { if (m.hasAttribute('data-hero')) best = m; });
      b.heroItem = best;
      b.hero = document.createElement('div');
      b.hero.className = 'tb-hero';
      best.style.flex = ''; best.style.width = '';
      b.hero.appendChild(best);
      b.inner.insertBefore(b.hero, b.inner.firstChild);
      if (b.text) b.text.classList.add('tb-text');
      b.inner.classList.add('tb-editorial');
      b.block.classList.add('tb-on');
      b.on = true;
    }
    pack(b);
  }

  function restore(b) {
    if (!b.on) return;
    b.photos.innerHTML = '';
    b.orig.forEach(function (o) {
      o.items.forEach(function (m) { m.style.flex = ''; m.style.width = ''; m.style.height = ''; o.row.appendChild(m); });
      b.photos.appendChild(o.row);
    });
    if (b.hero) b.hero.remove();
    b.hero = null;
    if (b.text) b.text.classList.remove('tb-text');
    b.inner.classList.remove('tb-editorial');
    b.block.classList.remove('tb-on');
    b.on = false;
  }

  /* how far the title reaches into the photo: half the height of the opened title row */
  function headH(b) {
    var head = b.block.querySelector('.tech-block__head');
    if (!head) return;
    var set = function () { b.block.style.setProperty('--tb-head-h', head.offsetHeight + 'px'); };
    set(); requestAnimationFrame(set); setTimeout(set, 120);
  }

  function update() {
    var desk = window.innerWidth >= MIN_W;
    blocks.forEach(function (b) { if (desk) apply(b); else restore(b); });
  }

  function init() {
    document.querySelectorAll('#projects .tech-block').forEach(function (block, i) {
      if (i >= 3) block.classList.add('tb-above');   /* Epsilon S, Tiffany: title above the photo */
      var b = prepare(block);
      if (b) blocks.push(b);
    });
    if (!blocks.length) return;
    update();
    var t, lastW = window.innerWidth;
    window.addEventListener('resize', function () {
      if (Math.abs(window.innerWidth - lastW) < 2) return;
      lastW = window.innerWidth;
      clearTimeout(t); t = setTimeout(update, 150);
    });
    /* the rows need the real width once a project is opened */
    var mo = new MutationObserver(function (list) {
      list.forEach(function (m) {
        if (m.target.classList && m.target.classList.contains('is-open') && window.innerWidth >= MIN_W) {
          blocks.forEach(function (b) { if (m.target.contains(b.inner)) { var w = b.photos.clientWidth; if (w && w !== b.packedW) { b.packedW = w; pack(b); } headH(b); } });
        }
      });
    });
    document.querySelectorAll('#projects .tech-block, #projects').forEach(function (el) {
      mo.observe(el, { attributes: true, attributeFilter: ['class'] });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 200); });
  else setTimeout(init, 200);
})();
