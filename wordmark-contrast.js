/*
 * Clean black-and-white inversion for the big name wordmarks that run over photos.
 *
 * The wordmark itself blends with mix-blend-mode: difference (white letters turn
 * into the inverse of what is behind them). Over coloured photos that inverse is
 * coloured too, so the letters look tinted / glowing. A copy of the wordmark is laid
 * exactly on top with mix-blend-mode: saturation, which removes that colour: the
 * letters become pure light or dark, with full contrast against the photo.
 * The copy follows the original's drop-in, fly-away and size.
 */
(function () {
  'use strict';
  var PAIRS = [
    ['.page-wordmark', '.page-wordmark__inner'],
    ['.about-studio', '.about-studio__inner'],
    ['.ai-arch--first .ai-arch__header', '.ai-arch__title']
  ];
  var st = document.createElement('style');
  st.textContent = '.wordmark-sat{mix-blend-mode:saturation!important;position:absolute!important;margin:0!important;pointer-events:none}';
  document.head.appendChild(st);

  var items = [];
  PAIRS.forEach(function (p) {
    var box = document.querySelector(p[0]);
    if (!box || box.classList.contains('wordmark-sat')) return;
    var inner = box.querySelector(p[1]);
    var copy = box.cloneNode(true);
    copy.classList.add('wordmark-sat');
    copy.setAttribute('aria-hidden', 'true');
    copy.removeAttribute('aria-label');
    copy.removeAttribute('id');
    box.parentNode.insertBefore(copy, box.nextSibling);
    var copyInner = inner ? copy.querySelector(p[1]) : null;
    var it = { box: box, inner: inner, copy: copy, copyInner: copyInner };
    items.push(it);
    // run the drop-in animation in step with the original
    try {
      var a = box.getAnimations ? box.getAnimations() : [];
      var b = copy.getAnimations ? copy.getAnimations() : [];
      for (var i = 0; i < a.length && i < b.length; i++) b[i].currentTime = a[i].currentTime;
    } catch (e) {}
    if (window.MutationObserver) {
      var mo = new MutationObserver(function () { sync(it); });
      mo.observe(box, { attributes: true, attributeFilter: ['style', 'class'] });
      if (inner) mo.observe(inner, { attributes: true, attributeFilter: ['style'] });
    }
  });
  if (!items.length) return;

  function sync(it) {
    it.copy.style.fontSize = it.box.style.fontSize;
    it.copy.style.top = it.box.offsetTop + 'px';
    it.copy.style.left = it.box.offsetLeft + 'px';
    it.copy.style.width = it.box.offsetWidth + 'px';
    if (it.inner && it.copyInner) {
      it.copyInner.style.transform = it.inner.style.transform;
      it.copyInner.style.opacity = it.inner.style.opacity;
    }
  }
  function syncAll() { items.forEach(sync); }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; syncAll(); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', syncAll);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncAll);
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(onScroll);
    items.forEach(function (it) { ro.observe(it.box); if (it.box.parentNode) ro.observe(it.box.parentNode); });
  }
  syncAll();
})();
