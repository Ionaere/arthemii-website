/*
 * Home page, Projects (desktop only): each opened project is laid out like a magazine page —
 * one large photo first, then the text, then the rest of the photos in even rows across
 * the full width. Phones keep the original layout.
 */
(function () {
  'use strict';

  var MIN_W = 769;          /* desktop from here */
  var ROW_H = 330;          /* target height of a photo row, px */
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
    '.tech-block.tb-on.is-open .tech-block__head{position:relative;z-index:3;margin-bottom:calc(-1 * var(--tb-head-h, 80px) - 18px);padding-left:var(--spacing-md);padding-right:var(--spacing-md);box-sizing:border-box;width:100%;transform:translateY(18px)}' +
    '.tech-block.tb-on.is-open .tech-block__head .wm-title{color:#fff!important;text-shadow:0 1px 18px rgba(0,0,0,.35)}' +
    '.tech-block.tb-on.is-open .tech-block__head .wm-title::before,.tech-block.tb-on.is-open .tech-block__head .wm-title::after{background:rgba(255,255,255,.8)!important}' +
    '.tech-block.tb-on.is-open .tech-block__head .wm-num{color:rgba(255,255,255,.8)!important}' +
    '.tech-block.tb-on.is-open .tech-block__chev{color:#fff!important}' +
    '.tb-hero>*{position:relative;width:100%!important;aspect-ratio:auto!important}' +
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
          var d = Math.log(sum / mean), c = cost[j2 - 1][st2] + d * d;
          if (c < cost[j2][e]) { cost[j2][e] = c; cut[j2][e] = st2; }
        }
      }
    }
    var groups = [], e2 = n;
    for (var j3 = k; j3 > 0; j3--) { var s3 = cut[j3][e2]; groups.unshift([s3, e2]); e2 = s3; }
    return groups;
  }

  function sizeHero(b) {
    if (!b.heroItem) return;
    var W = b.inner.clientWidth || 1200;
    b.heroItem.style.height = Math.round(Math.min(W / ratio(b.heroItem), window.innerHeight * 0.78)) + 'px';
  }

  function pack(b) {
    sizeHero(b);
    var rest = b.media.filter(function (m) { return m !== b.heroItem; });
    b.photos.innerHTML = '';
    if (!rest.length) return;
    var W = b.photos.clientWidth || b.inner.clientWidth || 1200;
    var rs = rest.map(ratio), total = rs.reduce(function (a, c) { return a + c; }, 0);
    var k = Math.max(1, Math.min(rest.length, Math.round(total * ROW_H / W)));
    partition(rs, k).forEach(function (g) {
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
    set(); setTimeout(set, 450); setTimeout(set, 900);
  }

  function update() {
    var desk = window.innerWidth >= MIN_W;
    blocks.forEach(function (b) { if (desk) apply(b); else restore(b); });
  }

  function init() {
    document.querySelectorAll('#projects .tech-block').forEach(function (block) {
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
          blocks.forEach(function (b) { if (m.target.contains(b.inner)) setTimeout(function () { pack(b); headH(b); }, 30); });
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
