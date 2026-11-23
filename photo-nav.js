/*
 * Gallery photo pages: go to the previous / next photo with the keyboard
 * (← →) or a swipe on the photo, and prefetch the next page so it opens fast.
 * The links themselves are plain <a rel="prev|next"> in the page.
 */
(function () {
  'use strict';
  var prev = document.querySelector('a[rel="prev"]');
  var next = document.querySelector('a[rel="next"]');
  if (!prev || !next) return;

  function go(a) { if (a && a.href) window.location.href = a.href; }

  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(prev); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(next); }
  });

  var view = document.querySelector('.photo-view');
  if (view) {
    var sx = 0, sy = 0, on = false;
    view.addEventListener('touchstart', function (e) {
      on = e.touches.length === 1;
      if (on) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }
    }, { passive: true });
    view.addEventListener('touchend', function (e) {
      if (!on) return;
      on = false;
      var dx = e.changedTouches[0].clientX - sx;
      var dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? next : prev);
    }, { passive: true });
  }

  // Prefetch the next page so the next photo opens without waiting
  [next, prev].forEach(function (a) {
    var l = document.createElement('link');
    l.rel = 'prefetch';
    l.href = a.href;
    document.head.appendChild(l);
  });
})();

/*
 * The photo size itself is pure CSS (it scales smoothly with the window).
 * Here we only mark tall (portrait) photos so CSS can give them a lower height
 * limit, and bring the photo to the middle of the screen when the page opens.
 */
(function () {
  'use strict';
  var view = document.querySelector('.photo-view');
  var img = view && view.querySelector('img');
  if (!img) return;
  var centred = false;

  function headerH() {
    var h = document.querySelector('.header');
    return h ? h.offsetHeight : 72;
  }
  function mark() {
    var nw = img.naturalWidth, nh = img.naturalHeight;
    if (nw && nh) view.classList.toggle('is-tall', nh > nw * 1.1);
  }
  function centre() {
    if (centred) return;
    centred = true;
    // Only on a fresh open, not when the browser brings back an earlier scroll position
    if (window.scrollY > 10 || location.hash) return;
    var r = img.getBoundingClientRect(), hh = headerH();
    var avail = window.innerHeight - hh;
    var y = window.scrollY + r.top - hh - Math.max(0, (avail - r.height) / 2);
    if (y > 4) window.scrollTo({ top: y, behavior: 'smooth' });
  }
  function ready() { mark(); requestAnimationFrame(function () { requestAnimationFrame(centre); }); }
  if (img.complete && img.naturalWidth) ready();
  else img.addEventListener('load', ready);
})();

/*
 * Gallery photo pages: the title drops in beside the photo — tall and square photos,
 * text alternating left / right from page to page — or below it for wide photos;
 * the description and details follow it.
 */
(function () {
  'use strict';
  var view = document.querySelector('.photo-view');
  if (!view || view.parentElement.querySelector('.gp')) return;
  var box = view.parentElement;
  var h1 = box.querySelector(':scope > h1');
  if (!h1) return;
  var img = view.querySelector('img');

  var gp = document.createElement('div');
  gp.className = 'gp';
  box.insertBefore(gp, view);
  gp.appendChild(view);
  var text = document.createElement('div');
  text.className = 'gp-text';
  gp.appendChild(text);
  // the title and the paragraphs after it (description, details) move next to the photo
  var nodes = [h1];
  for (var n = h1.nextElementSibling; n && n.tagName === 'P'; n = n.nextElementSibling) nodes.push(n);
  nodes.forEach(function (el, i) {
    el.removeAttribute('style');
    el.className = i === 0 ? 'gp-title' : (nodes.length > 2 && i === nodes.length - 1 ? 'gp-meta' : 'gp-desc');
    text.appendChild(el);
  });

  // "Name · 2023": the year goes on its own small line under the name
  var m = h1.textContent.match(/^\s*(.+?)\s+·\s+(\d{4}.*?)\s*$/);
  if (m && h1.children.length === 0) {
    h1.textContent = m[1];
    var y = document.createElement('span');
    y.className = 'gp-year';
    y.textContent = m[2];
    h1.appendChild(y);
  }

  var count = document.querySelector('.photo-nav__count');
  var num = count ? parseInt(count.textContent, 10) || 1 : 1;

  function place() {
    var r = img && img.naturalWidth ? img.naturalWidth / img.naturalHeight : 1.5;
    gp.style.setProperty('--r', r.toFixed(3));
    gp.classList.remove('gp--side', 'gp--below', 'gp--text-left');
    if (r < 1.3) {
      gp.classList.add('gp--side');
      if (num % 2 === 0) gp.classList.add('gp--text-left');
      box.style.maxWidth = '1320px';
    } else {
      gp.classList.add('gp--below');
      box.style.maxWidth = '1000px';
    }
    requestAnimationFrame(function () { gp.classList.add('is-in'); });
  }
  if (img && !img.complete) {
    img.addEventListener('load', place);
    img.addEventListener('error', place);
  } else {
    place();
  }
})();
