/*
 * Page name wordmark (like IONAERE STUDIO on the home page):
 * - shrinks long names (e.g. "Obras seleccionadas") so they always fit the width
 * - flies up and out of the screen while scrolling down, comes back on the way up
 * The drop-in when the page opens is CSS (styles.css, .page-wordmark).
 */
(function () {
  'use strict';
  var box = document.querySelector('.page-wordmark');
  if (!box) return;
  var inner = box.querySelector('.page-wordmark__inner');
  var name = box.querySelector('.page-wordmark__name');
  if (!inner || !name) return;

  function fit() {
    box.style.fontSize = '';
    var cs = window.getComputedStyle(inner);
    var gap = parseFloat(cs.columnGap || cs.gap) || 0;
    var avail = inner.clientWidth - 2 * gap - 2 * 16;   // keep at least a short rule on each side
    var w = name.offsetWidth;
    if (w > avail && avail > 0) {
      var size = parseFloat(window.getComputedStyle(box).fontSize);
      box.style.fontSize = (size * avail / w * 0.98).toFixed(2) + 'px';
    }
  }

  var ticking = false;
  function update() {
    ticking = false;
    var h = window.innerHeight;
    var p = Math.min(Math.max((window.scrollY || window.pageYOffset) / Math.max(h * 0.6, 280), 0), 1);
    var e = p * p * (3 - 2 * p); /* smoothstep */
    inner.style.transform = 'translate3d(0,' + (-e * h * 1.1).toFixed(1) + 'px,0) scale(' + (1 + e * 0.9).toFixed(3) + ')';
    inner.style.opacity = (1 - e * e).toFixed(3);
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

  var t;
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { onScroll(); clearTimeout(t); t = setTimeout(fit, 100); });
  window.addEventListener('load', fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  // The name gets translated by i18n.js when the language changes
  if (window.MutationObserver) new MutationObserver(fit).observe(name, { childList: true, characterData: true, subtree: true });
  fit();
  update();
})();
