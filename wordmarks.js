/*
 * Subsection titles in the "Ionaere Studio" style, on every page.
 * Loaded by i18n.js. Titles such as "Metal Frame Sculpting", "Tiffany Vitrage", the exhibition
 * names and "Architecture" become wide-spaced Italiana capitals with thin rules on both sides,
 * a little smaller than the section names. They stay still (no animation).
 */
(function () {
  'use strict';
  if (window.__wordmarks) return;
  window.__wordmarks = true;

  var SEL = 'h3.tech-block__title, h3.exhibition-block__title, h3.ai-arch__title';

  // Italiana, if the page does not load it yet
  if (!document.querySelector('link[href*="Italiana"]')) {
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Italiana&display=swap';
    document.head.appendChild(l);
  }

  var css =
    '.wm-title{display:flex!important;align-items:center;justify-content:center;gap:clamp(0.7rem,2vw,1.8rem);' +
    'font-family:"Italiana","Cormorant Garamond",Georgia,serif!important;font-weight:400!important;' +
    'font-size:clamp(0.95rem,1.3vw,1.2rem)!important;line-height:1.2!important;white-space:nowrap;letter-spacing:0.3em!important;' +
    'text-transform:uppercase;text-align:center;color:#111;margin:0 0 var(--spacing-md,1.5rem)!important;' +
    'transform-origin:50% 60%;will-change:auto}' +
    '.wm-title>.wm-t{margin-right:-0.3em}' +
    '.wm-title.wm-has-num{position:relative;padding:0 3.2rem}' +
    '.wm-title>.wm-num{font-family:"Cormorant Garamond",Georgia,serif;font-weight:300;color:#c9c9c9;text-transform:none;position:absolute;left:0;top:50%;transform:translateY(-50%);margin:0!important;letter-spacing:0;font-size:1.6em;line-height:1}' +
    '.wm-title::before,.wm-title::after{content:"";flex:1 1 0;min-width:18px;max-width:64px;height:1px;background:#bdbdbd}' +
    '@media (max-width:768px){.wm-title{font-size:clamp(0.85rem,3.6vw,1rem)!important;letter-spacing:0.22em!important;gap:0.5rem}' +
    '.wm-title{white-space:normal;justify-content:flex-start;text-align:left;min-width:0;line-height:1.35!important}.wm-title>.wm-t{margin-right:0;min-width:0;overflow-wrap:anywhere}.wm-title.wm-has-num{padding:0 0 0 2.6rem}.wm-title::before,.wm-title::after{display:none}.tech-block__head>.wm-title,.exhibition-block__head-text{flex:1 1 auto;min-width:0}.tech-block__head,.exhibition-block__head{min-width:0;max-width:100%}.wm-title::before,.wm-title::after{max-width:24px}}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  var items = [];
  function setup(root) {
    (root || document).querySelectorAll(SEL).forEach(function (h) {
      if (h.__wm || h.closest('.ai-arch--first')) return;
      h.__wm = true;
      h.classList.add('wm-title');
      // wrap the text so the trailing letter-spacing can be balanced (keeps i18n attributes on the h3)
      if (!h.querySelector('.wm-t')) {
        var s = document.createElement('span');
        s.className = 'wm-t';
        while (h.firstChild) s.appendChild(h.firstChild);
        h.appendChild(s);
      }
      // the block number ("01") sits on the same line as the title, at its left
      var prev = h.previousElementSibling;
      if (prev && /(^|\s)tech-block__num(\s|$)/.test(prev.className)) {
        prev.classList.add('wm-num');
        h.insertBefore(prev, h.firstChild);
        h.classList.add('wm-has-num');
      }
      items.push(h);
    });
  }

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function smooth(p) { return p * p * (3 - 2 * p); }
  var ticking = false;
  function update() {
    ticking = false;
    var vh = window.innerHeight;
    for (var i = 0; i < items.length; i++) {
      var h = items[i];
      if (!h.isConnected) continue;
      var r = h.getBoundingClientRect();
      if (!r.height) continue;                 // inside a closed section
      if (r.bottom < -vh || r.top > vh * 2) continue;
      var t = (r.top + r.height / 2) / vh;      // 0 = top of the screen, 1 = bottom
      var inn = smooth(clamp((1.02 - t) / 0.3)); // rolls in over the lowest third
      var out = smooth(clamp((0.22 - t) / 0.3)); // rolls away near the top
      var y, sc, op;
      if (out > 0) { y = -out * vh * 0.45; sc = 1 + out * 0.6; op = 1 - out * out; }
      else { y = (1 - inn) * 24; sc = 1 + (1 - inn) * 0.15; op = inn; }
      h.style.transform = (y || sc !== 1) ? 'translate3d(0,' + y.toFixed(1) + 'px,0) scale(' + sc.toFixed(3) + ')' : '';
      h.style.opacity = op < 0.999 ? op.toFixed(3) : '';
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

  function init() {
    // static titles: no scroll animation (owner's choice)
    setup();
    // titles added later (exhibitions are built by the page)
    new MutationObserver(function () { setup(); }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
