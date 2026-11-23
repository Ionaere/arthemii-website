/*
 * Home page, Projects (desktop only): each opened project is laid out like a magazine page —
 * one large photo first, then the text, then the rest of the photos in even rows across
 * the full width. Phones keep the original layout.
 */
(function () {
  'use strict';

  var MIN_W = 769;          /* desktop from here */
  var ROW_H = 430;          /* target height of a photo row, px */
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
    '.tb-editorial .tech-block__row>*{border-radius:8px!important}';
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
    return { inner: inner, photos: photos, text: text, orig: orig, media: media, on: false, hero: null };
  }

  function pack(b) {
    var rest = b.media.filter(function (m) { return m !== b.heroItem; });
    b.photos.innerHTML = '';
    var W = b.photos.clientWidth || b.inner.clientWidth;
    var row = [], sum = 0;
    function flush(last) {
      if (!row.length) return;
      var el = document.createElement('div');
      el.className = 'tech-block__row tb-row';
      row.forEach(function (m) {
        m.style.flex = ''; m.style.width = '';
        if (last) { m.style.flex = 'none'; m.style.width = Math.min(ratio(m) * ROW_H, W) + 'px'; }
        el.appendChild(m);
      });
      b.photos.appendChild(el);
      row = []; sum = 0;
    }
    rest.forEach(function (m) {
      row.push(m); sum += ratio(m);
      if (sum * ROW_H + GAP * (row.length - 1) >= W) flush(false);
    });
    /* a short last row keeps the normal height instead of blowing up */
    if (row.length) flush(sum * ROW_H < W * 0.8);
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
      b.on = true;
    }
    pack(b);
  }

  function restore(b) {
    if (!b.on) return;
    b.photos.innerHTML = '';
    b.orig.forEach(function (o) {
      o.items.forEach(function (m) { m.style.flex = ''; m.style.width = ''; o.row.appendChild(m); });
      b.photos.appendChild(o.row);
    });
    if (b.hero) b.hero.remove();
    b.hero = null;
    if (b.text) b.text.classList.remove('tb-text');
    b.inner.classList.remove('tb-editorial');
    b.on = false;
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
          blocks.forEach(function (b) { if (m.target.contains(b.inner)) setTimeout(function () { pack(b); }, 30); });
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
