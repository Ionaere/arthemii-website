/*
 * YouTube cards that have no local copy in video-files/ play by themselves:
 * a silent, looping YouTube player is laid over the card's thumbnail while the
 * card is on (or near) the screen and removed again when it scrolls far away.
 * Clicking still works as before — the full-screen viewer (video-lightbox.js)
 * or the page's own player opens the video with sound.
 *
 * Which cards: every .yt-placeholder[data-yt] whose thumbnail is NOT a local
 * poster (video-posters/yt-ID.jpg). A local poster means a local copy exists,
 * and the page plays that file instead.
 */
(function () {
  'use strict';

  var phs = Array.prototype.slice.call(document.querySelectorAll('.yt-placeholder[data-yt]'))
    .filter(function (ph) { return !/video-posters\/yt-/.test(ph.getAttribute('style') || ''); });
  if (!phs.length) return;

  var css = document.createElement('style');
  css.textContent =
    '.yt-auto{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:1}' +
    '.yt-auto iframe{position:absolute;top:50%;left:50%;width:100%;height:100%;border:0;' +
      'transform:translate(-50%,-50%) scale(1.2);opacity:0;transition:opacity .8s ease}' +
    '.yt-auto.is-on iframe{opacity:1}';
  document.head.appendChild(css);

  function src(id) {
    return 'https://www.youtube.com/embed/' + encodeURIComponent(id) +
      '?autoplay=1&mute=1&loop=1&playlist=' + encodeURIComponent(id) +
      '&controls=0&disablekb=1&fs=0&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3';
  }

  function start(ph) {
    if (ph._yta || !ph.isConnected) return;
    if (getComputedStyle(ph).position === 'static') ph.style.position = 'relative';
    var box = document.createElement('div');
    box.className = 'yt-auto';
    box.setAttribute('aria-hidden', 'true');
    var f = document.createElement('iframe');
    f.src = src(ph.getAttribute('data-yt'));
    f.allow = 'autoplay; encrypted-media; picture-in-picture';
    f.setAttribute('tabindex', '-1');
    f.title = '';
    // YouTube shows its title and a spinner for a moment: fade the player in after that
    f.addEventListener('load', function () { setTimeout(function () { box.classList.add('is-on'); }, 1200); });
    box.appendChild(f);
    ph.appendChild(box);
    ph._yta = box;
  }

  function stop(ph) {
    if (!ph._yta) return;
    ph._yta.remove();
    ph._yta = null;
  }

  if (!('IntersectionObserver' in window)) { phs.forEach(start); return; }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting && !document.hidden) start(e.target); else stop(e.target);
    });
  }, { rootMargin: '60% 0px 60% 0px' });   // start a little before the card scrolls in
  phs.forEach(function (ph) { io.observe(ph); });

  document.addEventListener('visibilitychange', function () {
    phs.forEach(function (ph) {
      if (document.hidden) { stop(ph); return; }
      var r = ph.getBoundingClientRect();
      if (r.bottom > -0.6 * innerHeight && r.top < 1.6 * innerHeight) start(ph);
    });
  });

  // The page's own click handler swaps the placeholder for a player with sound: drop the silent one
  document.addEventListener('click', function (e) {
    var ph = e.target.closest && e.target.closest('.yt-placeholder[data-yt]');
    if (ph && !document.querySelector('.vlightbox')) { io.unobserve(ph); stop(ph); }
  }, true);

  // While the full-screen viewer is open, silence the card players (they are removed and come back after)
  var lbWatch = new MutationObserver(function () {
    var lb = document.querySelector('.vlightbox');
    if (!lb) return;
    var open = lb.classList.contains('is-open');
    phs.forEach(function (ph) {
      if (open) stop(ph);
      else {
        var r = ph.getBoundingClientRect();
        if (r.bottom > -0.6 * innerHeight && r.top < 1.6 * innerHeight) start(ph);
      }
    });
  });
  var lbEl = document.querySelector('.vlightbox');
  if (lbEl) lbWatch.observe(lbEl, { attributes: true, attributeFilter: ['class'] });
})();
