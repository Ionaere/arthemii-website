/*
 * Page name wordmark (like IONAERE STUDIO on the home page):
 * - shrinks long names (e.g. "Obras seleccionadas") so they always fit the width
 * The name is static: no drop-in when the page opens and no fly-away on scroll
 * (that animation is only for the title on the home page).
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

  var t;
  window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(fit, 100); });
  window.addEventListener('load', fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  // The name gets translated by i18n.js when the language changes
  if (window.MutationObserver) new MutationObserver(fit).observe(name, { childList: true, characterData: true, subtree: true });
  fit();
})();
