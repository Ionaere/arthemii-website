/*
 * Home page, desktop only — the same magazine layout as the projects:
 * - Exhibitions and Architecture sections open on one large photo with the section name over it.
 * - Every opened exhibition: its first photo large with the exhibition title over it, then the
 *   text, then the other photos in compact even rows across the full width.
 * Phones keep the current layout.
 */
(function () {
  'use strict';

  var MIN_W = 769;
  var ROW_H = 330;
  var GAP = 8;
  var SECTION_HERO = {
    exhibitions: 'img/opt/2024-12-IMG_9484-Enhanced-NR-scaled-1600.jpg',
    architecture: 'img/renders/DQz7gIWjB1K.webp'
  };
  var BASE = (document.querySelector('script[src*="editorial-more.js"]') || {}).getAttribute
    ? document.querySelector('script[src*="editorial-more.js"]').getAttribute('src').replace(/editorial-more\.js.*$/, '')
    : '';

  var shade = 'linear-gradient(rgba(0,0,0,.5),rgba(0,0,0,0))';
  var css =
    '@media (max-width:' + (MIN_W - 1) + 'px){.sec-hero{display:none!important}}' +
    /* section hero */
    '.sec-hero{margin:0 0 var(--spacing-xl)}' +
    '.sec-hero__img{position:relative;height:min(72vh,48vw);border-radius:10px;overflow:hidden;background:var(--bg-alt)}' +
    '.sec-hero__img img{display:block;width:100%;height:100%;object-fit:cover}' +
    '.sec-hero__img::after{content:"";position:absolute;left:0;right:0;top:0;height:60%;background:' + shade + ';pointer-events:none}' +
    '@media (min-width:' + MIN_W + 'px){' +
      '.section.sh-on.is-open>.container>.section__toggle{position:relative;z-index:3;margin-bottom:calc(-1 * var(--sh-h, 200px) - 28px)!important;transform:translateY(28px);padding:0 var(--spacing-lg)!important;box-sizing:border-box}' +
      '.section.sh-on.is-open>.container>.section__toggle .section__label{color:#fff!important;text-shadow:0 1px 18px rgba(0,0,0,.35)}' +
      '.section.sh-on.is-open>.container>.section__toggle .section__label::before,.section.sh-on.is-open>.container>.section__toggle .section__label::after{background:rgba(255,255,255,.8)!important}' +
      '.section.sh-on.is-open>.container>.section__toggle .section__title{color:rgba(255,255,255,.92)!important;text-shadow:0 1px 12px rgba(0,0,0,.35)}' +
      '.section.sh-on.is-open>.container>.section__toggle .section__chevron{color:#fff!important}' +
      '.section.sh-on.is-open>.container>.section__toggle .section__chevron svg{stroke:#fff}' +
      '.section.sh-on.is-open>.container>.section__toggle .yt-channel{width:max-content!important;margin-left:auto!important;display:flex!important}' +
    '}' +
    /* exhibitions */
    '.exhibition-block__header.tb-editorial{display:block!important}' +
    '.tb-editorial>.tb-hidden{display:none!important}' +
    '.exb-hero{margin:0 0 var(--spacing-xl)}' +
    '.exb-hero>.exhibition-block__photo{display:block!important;position:relative;width:100%;border-radius:10px;overflow:hidden;background:var(--bg-alt)}' +
    '.exb-hero>.exhibition-block__photo img{width:100%!important;height:100%!important;object-fit:cover}' +
    '.exb-hero--pair{display:flex;gap:' + GAP + 'px}' +
    '.exb-hero--pair>.exhibition-block__photo{flex:var(--r) 1 0;min-width:0;width:auto}' +
    '.exb-hero>.exhibition-block__photo::after{content:"";position:absolute;left:0;right:0;top:0;height:min(50%,280px);background:' + shade + ';pointer-events:none}' +
    '.tb-editorial>.tb-text{max-width:780px;margin:0 auto var(--spacing-xl);text-align:center}' +
    '.tb-editorial>.tb-text .exhibition-block__stats{justify-content:center}' +
    '.tb-gallery{display:flex;flex-direction:column;gap:' + GAP + 'px}' +
    '.tb-gallery .tb-row{display:flex;gap:' + GAP + 'px}' +
    '.tb-gallery .tb-row>.exhibition-block__photo{display:block!important;flex:var(--r) 1 0;min-width:0;aspect-ratio:var(--r);border-radius:8px;overflow:hidden;background:var(--bg-alt)}' +
    '.tb-gallery .tb-row>.exhibition-block__photo img{width:100%;height:100%;object-fit:cover}' +
    '.exhibition-block.tb-on.is-open .exhibition-block__head{position:relative;z-index:3;margin-bottom:calc(-1 * var(--tb-head-h, 90px) - 18px);transform:translateY(18px);padding-left:var(--spacing-md);padding-right:var(--spacing-md);box-sizing:border-box;width:100%}' +
    '.exhibition-block.tb-on.is-open .exhibition-block__head .wm-title{color:#fff!important;text-shadow:0 1px 18px rgba(0,0,0,.35)}' +
    '.exhibition-block.tb-on.is-open .exhibition-block__head .wm-title::before,.exhibition-block.tb-on.is-open .exhibition-block__head .wm-title::after{background:rgba(255,255,255,.8)!important}' +
    '.exhibition-block.tb-on.is-open .exhibition-block__meta,.exhibition-block.tb-on.is-open .exhibition-block__meta *{color:#fff!important;border-color:rgba(255,255,255,.7)!important}' +
    '.exhibition-block.tb-on.is-open .exhibition-block__meta{justify-content:center;text-align:center}' +
    '.exhibition-block.tb-on.is-open .exhibition-block__chev{color:#fff!important}' +
    '.exhibition-block.is-open .exhibition-block__body .tb-editorial{padding-top:0!important}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  function desk() { return window.innerWidth >= MIN_W; }
  function ratio(el) { return parseFloat(el.style.getPropertyValue('--r')) || 1.5; }

  function partition(rs, k) {
    var n = rs.length, pre = [0];
    for (var i = 0; i < n; i++) pre.push(pre[i] + rs[i]);
    var mean = pre[n] / k, INF = 1e18, cost = [], cut = [];
    for (var j = 0; j <= k; j++) { cost.push([]); cut.push([]); for (var q = 0; q <= n; q++) cost[j].push(INF); }
    cost[0][0] = 0;
    for (var j2 = 1; j2 <= k; j2++) for (var e = 1; e <= n; e++) for (var s = j2 - 1; s < e; s++) {
      if (cost[j2 - 1][s] === INF) continue;
      var d = Math.log((pre[e] - pre[s]) / mean), c = cost[j2 - 1][s] + d * d + (e - s === 1 && n > 2 ? 1.5 : 0);
      if (c < cost[j2][e]) { cost[j2][e] = c; cut[j2][e] = s; }
    }
    var groups = [], e2 = n;
    for (var j3 = k; j3 > 0; j3--) { var s3 = cut[j3][e2]; groups.unshift([s3, e2]); e2 = s3; }
    groups.cost = cost[k][n];
    return groups;
  }

  function loadImg(photo, cb) {
    var img = photo.querySelector('img');
    if (!img) return;
    if (!img.getAttribute('src') && img.getAttribute('data-src')) img.src = img.getAttribute('data-src');
    img.loading = 'eager';
    function done() { if (img.naturalWidth) { photo.style.setProperty('--r', (img.naturalWidth / img.naturalHeight).toFixed(3)); cb && cb(); } }
    if (img.complete && img.naturalWidth) done(); else img.addEventListener('load', done, { once: true });
  }

  function headHeight(block, sel, prop) {
    var head = block.querySelector(sel);
    if (!head) return;
    var set = function () { block.style.setProperty(prop, head.offsetHeight + 'px'); };
    set(); requestAnimationFrame(set); setTimeout(set, 120);
  }

  /* ---------- exhibitions ---------- */
  var exb = [];

  function exPrepare(block) {
    var header = block.querySelector('.exhibition-block__header');
    var cont = header && header.querySelector('.exhibition-block__photos');
    if (!cont) return null;
    var photos = Array.prototype.slice.call(cont.querySelectorAll('.exhibition-block__photo'));
    if (!photos.length) return null;
    var cols = Array.prototype.filter.call(header.children, function (c) { return c.tagName === 'DIV'; });
    var text = cols.filter(function (c) { return !c.contains(cont); })[0] || null;
    var photoCol = cols.filter(function (c) { return c.contains(cont); })[0] || null;
    return { block: block, header: header, cont: cont, photos: photos, text: text, photoCol: photoCol, on: false };
  }

  function bestRows(rs, k0) {
    var best = null;
    for (var k = Math.max(1, k0 - 1); k <= Math.min(rs.length, k0 + 1); k++) {
      var g = partition(rs, k);
      if (!best || g.cost < best.cost - 1e-9) best = g;
    }
    return best;
  }

  function exPack(b) {
    b.packedW = b.header.clientWidth;
    var rest = b.photos.slice(1);
    if (!b.gallery) return;
    b.gallery.innerHTML = '';
    var W = b.header.clientWidth || 1200;
    var hero = b.photos[0];
    if (rest.length === 1) {
      /* two photos: side by side as one large picture under the title */
      b.hero.classList.add('exb-hero--pair');
      b.hero.appendChild(rest[0]);
      var hh = Math.round(Math.min((W - GAP) / (ratio(hero) + ratio(rest[0])), window.innerHeight * 0.74));
      hero.style.height = rest[0].style.height = hh + 'px';
      return;
    }
    hero.style.height = Math.round(Math.min(W / ratio(hero), window.innerHeight * 0.74)) + 'px';
    if (!rest.length) return;
    var rs = rest.map(ratio), total = rs.reduce(function (a, c) { return a + c; }, 0);
    var k = Math.max(1, Math.min(rest.length, Math.round(total * ROW_H / W)));
    bestRows(rs, k).forEach(function (g) {
      var row = document.createElement('div');
      row.className = 'tb-row';
      for (var i = g[0]; i < g[1]; i++) row.appendChild(rest[i]);
      b.gallery.appendChild(row);
    });
  }

  function exApply(b) {
    if (!b.on) {
      b.hero = document.createElement('div');
      b.hero.className = 'exb-hero';
      b.hero.appendChild(b.photos[0]);
      b.header.insertBefore(b.hero, b.header.firstChild);
      b.gallery = document.createElement('div');
      b.gallery.className = 'tb-gallery';
      b.header.appendChild(b.gallery);
      if (b.text) b.text.classList.add('tb-text');
      if (b.photoCol) b.photoCol.classList.add('tb-hidden');
      b.header.classList.add('tb-editorial');
      b.block.classList.add('tb-on');
      b.on = true;
      b.photos.forEach(function (p) { loadImg(p, function () { if (b.on) exPack(b); }); });
    }
    exPack(b);
  }

  function exRestore(b) {
    if (!b.on) return;
    var nav = b.cont.querySelector('.exhibition-block__nav');
    b.photos.forEach(function (p) { p.style.height = ''; b.cont.insertBefore(p, nav || null); });
    b.hero.classList.remove('exb-hero--pair');
    b.hero.remove(); b.gallery.remove(); b.hero = b.gallery = null;
    if (b.text) b.text.classList.remove('tb-text');
    if (b.photoCol) b.photoCol.classList.remove('tb-hidden');
    b.header.classList.remove('tb-editorial');
    b.block.classList.remove('tb-on');
    b.on = false;
  }

  /* ---------- section heroes ---------- */
  var secs = [];

  function secPrepare(id) {
    var sec = document.getElementById(id);
    var inner = sec && sec.querySelector('.section__body-inner');
    if (!inner) return null;
    var hero = document.createElement('div');
    hero.className = 'sec-hero';
    hero.setAttribute('aria-hidden', 'true');
    var box = document.createElement('div');
    box.className = 'sec-hero__img';
    var img = document.createElement('img');
    img.alt = ''; img.decoding = 'async';
    img.setAttribute('data-src', BASE + SECTION_HERO[id]);
    box.appendChild(img);
    hero.appendChild(box);
    inner.insertBefore(hero, inner.firstChild);
    return { sec: sec, hero: hero, img: img };
  }

  function secUpdate(s) {
    var on = desk();
    s.sec.classList.toggle('sh-on', on);
    if (on && s.sec.classList.contains('is-open')) {
      if (!s.img.getAttribute('src')) s.img.src = s.img.getAttribute('data-src');
      headHeight(s.sec, ':scope > .container > .section__toggle', '--sh-h');
    }
  }

  function update() {
    var d = desk();
    exb.forEach(function (b) { if (d) exApply(b); else exRestore(b); });
    secs.forEach(secUpdate);
  }

  function init() {
    document.querySelectorAll('#exhibitions .exhibition-block').forEach(function (bl) {
      var b = exPrepare(bl); if (b) exb.push(b);
    });
    Object.keys(SECTION_HERO).forEach(function (id) { var s = secPrepare(id); if (s) secs.push(s); });
    update();

    var mo = new MutationObserver(function (list) {
      list.forEach(function (m) {
        var t = m.target;
        if (!t.classList || !t.classList.contains('is-open') || !desk()) return;
        exb.forEach(function (b) {
          if (b.block === t) { var w = b.header.clientWidth; if (w && w !== b.packedW) { b.packedW = w; exPack(b); } headHeight(b.block, '.exhibition-block__head', '--tb-head-h'); }
        });
        secs.forEach(function (s) { if (s.sec === t) secUpdate(s); });
      });
    });
    exb.forEach(function (b) { mo.observe(b.block, { attributes: true, attributeFilter: ['class'] }); });
    secs.forEach(function (s) { mo.observe(s.sec, { attributes: true, attributeFilter: ['class'] }); });

    var t2, lastW = window.innerWidth;
    window.addEventListener('resize', function () {
      if (Math.abs(window.innerWidth - lastW) < 2) return;
      lastW = window.innerWidth;
      clearTimeout(t2); t2 = setTimeout(update, 150);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 250); });
  else setTimeout(init, 250);
})();
