/*
 * Home page: when a section opens (Projects, Exhibitions, ...) its name stretches across
 * the whole width; when a group inside it opens (Metal Frame Sculpting, Asterion, ...)
 * that title stretches across the width too. Closing shrinks them back.
 */
(function () {
  'use strict';

  var css =
    '.section__label,.tech-block__head>.wm-title,.exhibition-block__head .wm-title{transition:none!important}' +
    /* opened section: the name gets its own full-width line, the preview photo steps aside */
    '.section.is-open>.container>.section__toggle .section__label-row{position:relative!important;left:auto!important;right:auto!important;top:auto!important;transform:none!important;' +
      'width:100%;justify-content:center!important;margin:0 0 var(--spacing-md)!important}' +
    '.section.is-open>.container>.section__toggle .section__thumbs{opacity:0;pointer-events:none;transition:opacity .35s ease}' +
    '.section.is-open>.container>.section__toggle.has-thumbs>:not(.section__thumbs){max-width:none!important;margin-left:0!important;margin-right:0!important}' +
    '.section.is-open>.container>.section__toggle{min-height:0!important}' +
    /* opened group: the title takes the whole line, the small photo floats out of the way */
    '.tech-block.is-open .tech-block__head>.wm-title,.exhibition-block.is-open .exhibition-block__head-text{flex:1 1 auto;min-width:0}' +
    '.tech-block.is-open .wm-title.hg-grown,.exhibition-block.is-open .wm-title.hg-grown{white-space:nowrap!important;justify-content:center!important}' +
    '.tech-block.is-open .tech-block__mini,.exhibition-block.is-open .exhibition-block__mini{position:absolute;right:0}' +
    '.tech-block__head,.exhibition-block__head{position:relative}' +
    '.tech-block.is-open .wm-title.hg-wrap,.exhibition-block.is-open .wm-title.hg-wrap{white-space:normal!important;justify-content:center!important;text-align:center!important;line-height:1.3!important}' +
    '.wm-title.hg-wrap>.wm-t{margin-right:0!important}' +
    '.wm-title.hg-grown.wm-has-num{padding:0 0 0 2em!important}.wm-title.hg-grown>.wm-num{font-size:1.15em!important}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  var MAX_SECTION = 0.085; /* section names: at most 8.5% of the screen width */
  var MAX_GROUP = 0.05;    /* group titles inside: a bit smaller */

  function px(v) { return parseFloat(v) || 0; }

  /* scale el's font size so that box's content just fits avail px */
  function fitTo(el, box, avail, maxVw, minGain) {
    el.style.removeProperty('font-size');
    el.style.transition = 'none';
    var f0 = px(getComputedStyle(el).fontSize);
    var f = f0;
    for (var i = 0; i < 3; i++) {
      el.style.setProperty('font-size', f + 'px', 'important');
      var w = box.scrollWidth;
      if (!w) return;
      f = f * avail / w;
    }
    f = Math.min(f * 0.98, window.innerWidth * maxVw);
    el.style.setProperty('font-size', f0 + 'px', 'important');
    void el.offsetWidth;                    /* start the transition from the old size */
    el.style.transition = '';
    if (f <= f0 * (minGain || 1.05)) { el.style.removeProperty('font-size'); return false; }
    el.style.setProperty('font-size', f.toFixed(2) + 'px', 'important');
    return true;
  }

  function grow(block) {
    var label, box, avail, el;
    if (block.classList.contains('section')) {
      var toggle = block.querySelector(':scope > .container > .section__toggle');
      if (!toggle) return;
      box = toggle.querySelector('.section__label-row');
      label = box && box.querySelector('.section__label');
      if (!label) return;
      var chev = box.querySelector('.section__chevron');
      avail = toggle.clientWidth - (chev ? chev.offsetWidth * 2 + 24 : 0);
      box.style.width = 'max-content';
      fitTo(label, box, avail, MAX_SECTION);
      box.style.width = '';
      return;
    }
    var head = block.querySelector('.tech-block__head, .exhibition-block__head');
    el = head && head.querySelector('.wm-title');
    if (!el) return;
    var chev2 = head.querySelector('.tech-block__chev, .exhibition-block__chev');
    avail = head.clientWidth - (chev2 ? chev2.offsetWidth + 16 : 0) - 8;
    el.classList.remove('hg-wrap');
    el.classList.add('hg-grown');
    var oldFlex = el.style.flex, oldW = el.style.width;
    el.style.flex = 'none'; el.style.width = 'max-content';
    /* measure without the flexible side rules stretching */
    var grown = fitTo(el, el, avail, MAX_GROUP, window.innerWidth < 769 ? 1.3 : 1.05);
    el.style.flex = oldFlex; el.style.width = oldW;
    if (!grown) {
      /* too long for one bigger line (phones): still grow and centre it, over two lines */
      el.classList.remove('hg-grown');
      el.classList.add('hg-wrap');
      var f0 = px(getComputedStyle(el).fontSize);
      el.style.setProperty('font-size', f0 + 'px', 'important');
      void el.offsetWidth;
      el.style.setProperty('font-size', Math.min(f0 * 1.35, window.innerWidth * MAX_GROUP * 1.6).toFixed(2) + 'px', 'important');
    }
  }

  function shrink(block) {
    var el = block.classList.contains('section')
      ? block.querySelector(':scope > .container > .section__toggle .section__label')
      : block.querySelector('.tech-block__head .wm-title, .exhibition-block__head .wm-title');
    if (!el) return;
    el.style.removeProperty('font-size');
    var t = el;
    setTimeout(function () { if (!t.style.fontSize) t.classList.remove('hg-grown', 'hg-wrap'); }, 800);
  }

  var SEL = '.section.is-collapsible, .tech-block.is-collapsible, .exhibition-block.is-collapsible';
  var state = new WeakMap();

  function check(block) {
    var open = block.classList.contains('is-open');
    if (state.get(block) === open) return;
    state.set(block, open);
    if (open) grow(block);
    else shrink(block);
  }

  function init() {
    var blocks = document.querySelectorAll(SEL);
    if (!blocks.length) return;
    var mo = new MutationObserver(function (list) {
      list.forEach(function (m) { if (m.target.matches && m.target.matches(SEL)) check(m.target); });
    });
    blocks.forEach(function (b) {
      state.set(b, false);
      if (b.classList.contains('is-open')) check(b);
      mo.observe(b, { attributes: true, attributeFilter: ['class'] });
    });
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        document.querySelectorAll(SEL).forEach(function (b) { if (b.classList.contains('is-open')) grow(b); });
      }, 150);
    });
    /* titles that change language must be re-fitted */
    document.addEventListener('i18n:changed', function () {
      document.querySelectorAll(SEL).forEach(function (b) { if (b.classList.contains('is-open')) grow(b); });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 300); });
  else setTimeout(init, 300);
})();
