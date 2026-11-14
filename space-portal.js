/*
 * Arthemii Ionaere — the page corner that peels away into the 3D space (/space/).
 * Loaded on every page by i18n.js. Click the corner (or drag it towards the middle of
 * the screen) and the page peels off like a sheet of paper, revealing the 3D space.
 */
(function () {
  'use strict';
  if (window.__spacePortal) return;
  window.__spacePortal = true;
  if (/^\/space(\/|$)/.test(location.pathname)) return;

  var m = location.pathname.match(/^\/(de|es|fr|it)(\/|$)/);
  var pageLang = m ? m[1] : '';
  var HINT = {
    en: 'Enter the 3D space', de: 'In den 3D-Raum', es: 'Entrar al espacio 3D', fr: "Entrer dans l'espace 3D",
    it: 'Entra nello spazio 3D', ru: 'Войти в 3D-пространство', pt: 'Entrar no espaço 3D', nl: 'Naar de 3D-ruimte',
    pl: 'Wejdź do przestrzeni 3D', tr: '3D alana gir', zh: '进入 3D 空间', ja: '3D 空間へ', ko: '3D 공간으로'
  };
  function lang() {
    var l = pageLang || (window.I18N && window.I18N.lang) || 'en';
    return HINT[l] ? l : (HINT[l.split('-')[0]] ? l.split('-')[0] : 'en');
  }
  function target() {
    var l = lang();
    return '/space/' + (l !== 'en' ? '?lang=' + l : '');
  }

  var css =
    '.sp-curl{position:fixed;right:0;bottom:0;z-index:950;width:var(--sp-s,58px);height:var(--sp-s,58px);display:block;' +
    'cursor:pointer;touch-action:none;-webkit-tap-highlight-color:transparent;filter:drop-shadow(-4px -4px 7px rgba(0,0,0,.28));' +
    'transition:width .45s cubic-bezier(.16,1,.3,1),height .45s cubic-bezier(.16,1,.3,1)}' +
    '.sp-curl.is-drag{transition:none}' +
    '.sp-curl:hover,.sp-curl:focus-visible{--sp-s:104px}' +
    '.sp-curl__under{position:absolute;inset:0;clip-path:polygon(100% 0,100% 100%,0 100%);' +
    'background:radial-gradient(1.5px 1.5px at 72% 62%,#fff 50%,transparent 51%),radial-gradient(1px 1px at 86% 34%,#fff 50%,transparent 51%),' +
    'radial-gradient(1px 1px at 58% 88%,#cfe3ff 50%,transparent 51%),radial-gradient(1.5px 1.5px at 90% 80%,#ffe6c7 50%,transparent 51%),' +
    'radial-gradient(1px 1px at 78% 92%,#fff 50%,transparent 51%),' +
    'radial-gradient(circle at 100% 100%,#ff6a3d 0,#c2337a 18%,#4b2a9b 42%,#121230 72%,#07070f 100%)}' +
    '.sp-curl__flap{position:absolute;inset:0;clip-path:polygon(0 0,100% 0,0 100%);' +
    'background:linear-gradient(135deg,#ffffff 0%,#f4f3f1 38%,#dedcd8 62%,#b9b6b0 100%)}' +
    '.sp-curl__flap::after{content:"";position:absolute;inset:0;background:linear-gradient(135deg,transparent 46%,rgba(255,255,255,.9) 50%,transparent 54%);opacity:.6}' +
    '.sp-curl__hint{position:absolute;right:calc(100% - 14px);bottom:calc(100% + 6px);white-space:nowrap;padding:6px 11px;border-radius:999px;' +
    'background:#111;color:#fff;font:600 11px/1 system-ui,-apple-system,sans-serif;letter-spacing:.04em;opacity:0;transform:translateY(4px);' +
    'transition:opacity .25s ease,transform .25s ease;pointer-events:none}' +
    '.sp-curl:hover .sp-curl__hint,.sp-curl:focus-visible .sp-curl__hint,.sp-curl.is-drag .sp-curl__hint{opacity:1;transform:none}' +
    '.sp-curl.is-nudge{animation:sp-nudge 1.6s cubic-bezier(.16,1,.3,1) 1}' +
    '@keyframes sp-nudge{0%,100%{width:58px;height:58px}35%{width:92px;height:92px}}' +
    // Full-screen peel when entering
    '.sp-peel{position:fixed;inset:0;z-index:9999;pointer-events:none;' +
    'background:radial-gradient(2px 2px at 20% 30%,#fff 50%,transparent 51%),radial-gradient(1.5px 1.5px at 70% 20%,#fff 50%,transparent 51%),' +
    'radial-gradient(1.5px 1.5px at 40% 75%,#cfe3ff 50%,transparent 51%),radial-gradient(2px 2px at 85% 60%,#ffe6c7 50%,transparent 51%),' +
    'radial-gradient(1px 1px at 55% 45%,#fff 50%,transparent 51%),' +
    'radial-gradient(ellipse at 100% 100%,#ff6a3d 0,#c2337a 16%,#4b2a9b 38%,#121230 66%,#07070f 100%);' +
    'clip-path:polygon(100% calc(100% - var(--p,0px)),100% 100%,calc(100% - var(--p,0px)) 100%);transition:clip-path .75s cubic-bezier(.65,0,.35,1)}' +
    '.sp-peel.is-go{--p:300vmax}' +
    '@media (max-width:640px){.sp-curl{--sp-s:46px}.sp-curl:hover{--sp-s:46px}}' +
    '@media (prefers-reduced-motion:reduce){.sp-curl,.sp-peel{transition:none}.sp-curl.is-nudge{animation:none}}' +
    '@media print{.sp-curl{display:none}}';

  function init() {
    if (document.querySelector('.sp-curl')) return;
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);

    var a = document.createElement('a');
    a.className = 'sp-curl';
    a.href = target();
    a.setAttribute('aria-label', HINT[lang()]);
    a.setAttribute('data-no-i18n', '');
    a.setAttribute('translate', 'no');
    a.innerHTML = '<span class="sp-curl__under"></span><span class="sp-curl__flap"></span><span class="sp-curl__hint"></span>';
    var hint = a.querySelector('.sp-curl__hint');
    hint.textContent = HINT[lang()];
    document.body.appendChild(a);

    // The language can change after this script runs (switcher, auto-detect)
    function refresh() { a.href = target(); hint.textContent = HINT[lang()]; a.setAttribute('aria-label', HINT[lang()]); }
    a.addEventListener('mouseenter', refresh);
    a.addEventListener('focus', refresh);

    // Show visitors once that the corner can be turned
    try {
      if (!sessionStorage.getItem('spNudge')) {
        sessionStorage.setItem('spNudge', '1');
        setTimeout(function () { a.classList.add('is-nudge'); }, 2500);
      }
    } catch (e) {}

    var going = false;
    function go() {
      if (going) return;
      going = true;
      refresh();
      var p = document.createElement('div');
      p.className = 'sp-peel';
      document.body.appendChild(p);
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { p.classList.add('is-go'); });
      });
      setTimeout(function () { location.href = a.href; }, reduce ? 0 : 700);
    }

    // Drag the corner like a page; let go far enough and it peels away
    var start = null, moved = false;
    a.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      start = { x: e.clientX, y: e.clientY };
      moved = false;
      try { a.setPointerCapture(e.pointerId); } catch (err) {}
    });
    a.addEventListener('pointermove', function (e) {
      if (!start) return;
      var dx = start.x - e.clientX, dy = start.y - e.clientY;
      var d = Math.max(0, (dx + dy) / 1.4);
      if (d > 6) { moved = true; a.classList.add('is-drag'); }
      if (moved) a.style.setProperty('--sp-s', Math.min(58 + d, 420) + 'px');
    });
    function end(e) {
      if (!start) return;
      var dx = start.x - e.clientX, dy = start.y - e.clientY;
      start = null;
      a.classList.remove('is-drag');
      if (moved && (dx + dy) / 1.4 > 110) { go(); return; }
      a.style.removeProperty('--sp-s');
    }
    a.addEventListener('pointerup', end);
    a.addEventListener('pointercancel', function () { start = null; a.classList.remove('is-drag'); a.style.removeProperty('--sp-s'); });
    a.addEventListener('click', function (e) {
      e.preventDefault();
      if (moved) { moved = false; return; }
      go();
    });
    // Coming back with the browser's back button: remove the peel overlay
    window.addEventListener('pageshow', function () {
      going = false;
      document.querySelectorAll('.sp-peel').forEach(function (n) { n.remove(); });
      a.style.removeProperty('--sp-s');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
