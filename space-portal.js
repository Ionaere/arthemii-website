/*
 * Arthemii Ionaere — the entrance to the 3D space (/space/).
 * Loaded on every page by i18n.js. A small stained-glass prism slowly turns in the
 * lower right corner; click it and the black, starry space opens up from the prism.
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
    // The corner button
    '.sp-prism{position:fixed;right:16px;bottom:16px;z-index:950;width:60px;height:60px;display:block;cursor:pointer;perspective:420px;' +
    '-webkit-tap-highlight-color:transparent;transition:transform .45s cubic-bezier(.16,1,.3,1)}' +
    '.sp-prism:hover,.sp-prism:focus-visible{transform:scale(1.18);outline:none}' +
    '.sp-prism__stage{position:absolute;inset:0;transform-style:preserve-3d;transform:rotateX(-18deg);pointer-events:none}' +
    '.sp-prism__spin{position:absolute;left:50%;top:50%;width:0;height:0;transform-style:preserve-3d;animation:sp-spin 7s linear infinite}' +
    '.sp-prism:hover .sp-prism__spin{animation-duration:2.6s}' +
    '.sp-prism__face{position:absolute;left:-15px;top:-24px;width:30px;height:48px;border:1px solid rgba(255,255,255,.75);opacity:.9;overflow:hidden;backface-visibility:visible}' +
    '.sp-prism__f1{transform:rotateY(0deg) translateZ(8.7px);background:linear-gradient(160deg,rgba(255,80,60,.92),rgba(255,190,60,.86) 45%,rgba(60,90,255,.86))}' +
    '.sp-prism__f2{transform:rotateY(120deg) translateZ(8.7px);background:linear-gradient(160deg,rgba(40,200,170,.92),rgba(40,90,255,.86) 55%,rgba(170,60,255,.86))}' +
    '.sp-prism__f3{transform:rotateY(240deg) translateZ(8.7px);background:linear-gradient(160deg,rgba(255,220,80,.92),rgba(255,90,150,.86) 50%,rgba(60,200,255,.86))}' +
    '.sp-prism__glint{position:absolute;inset:0;background:linear-gradient(115deg,transparent 40%,rgba(255,255,255,.95) 50%,transparent 60%);' +
    'background-size:250% 100%;animation:sp-glint 3.5s ease-in-out infinite;mix-blend-mode:screen}' +
    '.sp-prism__shadow{position:absolute;left:50%;bottom:2px;width:40px;height:8px;margin-left:-20px;border-radius:50%;background:radial-gradient(rgba(0,0,0,.25),transparent 70%)}' +
    '.sp-prism__rays{position:absolute;left:50%;bottom:6px;width:46px;height:10px;margin-left:-23px;border-radius:50%;' +
    'background:conic-gradient(from 0deg,rgba(255,0,0,.35),rgba(255,200,0,.35),rgba(0,255,120,.35),rgba(0,120,255,.35),rgba(200,0,255,.35),rgba(255,0,0,.35));' +
    'filter:blur(3px);animation:sp-hue 7s linear infinite}' +
    '.sp-prism__hint{position:absolute;right:calc(100% + 8px);top:50%;transform:translate(4px,-50%);white-space:nowrap;padding:6px 11px;border-radius:999px;' +
    'background:#111;color:#fff;font:600 11px/1 system-ui,-apple-system,sans-serif;letter-spacing:.04em;opacity:0;' +
    'transition:opacity .25s ease,transform .25s ease;pointer-events:none}' +
    '.sp-prism:hover .sp-prism__hint,.sp-prism:focus-visible .sp-prism__hint,.sp-prism.is-hint .sp-prism__hint{opacity:1;transform:translate(0,-50%)}' +
    '@keyframes sp-spin{to{transform:rotateY(360deg)}}' +
    '@keyframes sp-glint{0%,100%{background-position:120% 0}50%{background-position:-20% 0}}' +
    '@keyframes sp-hue{to{filter:blur(3px) hue-rotate(360deg)}}' +
    // Entering: the black starry space opens as a circle from the prism
    '.sp-peel{position:fixed;inset:0;z-index:9999;pointer-events:none;' +
    'background:radial-gradient(2px 2px at 20% 30%,#fff 50%,transparent 51%),radial-gradient(1.5px 1.5px at 70% 20%,#fff 50%,transparent 51%),' +
    'radial-gradient(1.5px 1.5px at 40% 75%,#cfe3ff 50%,transparent 51%),radial-gradient(2px 2px at 85% 60%,#ffe6c7 50%,transparent 51%),' +
    'radial-gradient(1px 1px at 55% 45%,#fff 50%,transparent 51%),radial-gradient(1px 1px at 12% 82%,#fff 50%,transparent 51%),#000;' +
    'clip-path:circle(0 at var(--x,100%) var(--y,100%));transition:clip-path .75s cubic-bezier(.65,0,.35,1)}' +
    '.sp-peel.is-go{clip-path:circle(150vmax at var(--x,100%) var(--y,100%))}' +
    '@media (max-width:640px){.sp-prism{right:10px;bottom:10px;width:52px;height:52px}.sp-prism__stage{transform:rotateX(-18deg) scale(.86)}}' +
    '@media print{.sp-prism{display:none}}';

  function init() {
    if (document.querySelector('.sp-prism')) return;
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);

    var a = document.createElement('a');
    a.className = 'sp-prism';
    a.href = target();
    a.setAttribute('aria-label', HINT[lang()]);
    a.setAttribute('data-no-i18n', '');
    a.setAttribute('translate', 'no');
    a.innerHTML =
      '<span class="sp-prism__stage"><span class="sp-prism__rays"></span><span class="sp-prism__shadow"></span>' +
      '<span class="sp-prism__spin">' +
      '<span class="sp-prism__face sp-prism__f1"><i class="sp-prism__glint"></i></span>' +
      '<span class="sp-prism__face sp-prism__f2"><i class="sp-prism__glint"></i></span>' +
      '<span class="sp-prism__face sp-prism__f3"><i class="sp-prism__glint"></i></span>' +
      '</span></span><span class="sp-prism__hint"></span>';
    var hint = a.querySelector('.sp-prism__hint');
    hint.textContent = HINT[lang()];
    document.body.appendChild(a);

    // The language can change after this script runs (switcher, auto-detect)
    function refresh() { a.href = target(); hint.textContent = HINT[lang()]; a.setAttribute('aria-label', HINT[lang()]); }
    a.addEventListener('mouseenter', refresh);
    a.addEventListener('focus', refresh);

    // Once per visit, say what the prism is for
    try {
      if (!sessionStorage.getItem('spHint')) {
        sessionStorage.setItem('spHint', '1');
        setTimeout(function () { a.classList.add('is-hint'); }, 1800);
        setTimeout(function () { a.classList.remove('is-hint'); }, 6800);
      }
    } catch (e) {}

    var going = false;
    function go() {
      if (going) return;
      going = true;
      refresh();
      var r = a.getBoundingClientRect();
      var p = document.createElement('div');
      p.className = 'sp-peel';
      p.style.setProperty('--x', Math.round(r.left + r.width / 2) + 'px');
      p.style.setProperty('--y', Math.round(r.top + r.height / 2) + 'px');
      document.body.appendChild(p);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { p.classList.add('is-go'); });
      });
      setTimeout(function () { location.href = a.href; }, 700);
    }
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // open in a new tab as usual
      e.preventDefault();
      go();
    });
    // Coming back with the browser's back button: remove the overlay
    window.addEventListener('pageshow', function () {
      going = false;
      document.querySelectorAll('.sp-peel').forEach(function (n) { n.remove(); });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
