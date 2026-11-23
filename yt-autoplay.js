/*
 * YouTube cards that play by themselves: muted, looping, without controls,
 * while they are on screen, and paused when scrolled away.
 *
 * Mark a card with data-autoplay:
 *   <div class="yt-placeholder" data-yt="VIDEO_ID" data-autoplay style="background-image:url(...)"></div>
 *
 * The preview ignores clicks, so a click still reaches the card: the full-screen
 * viewer (video-lightbox.js) or the inline player then opens the video with sound.
 */
(function () {
  'use strict';
  var els = Array.prototype.slice.call(document.querySelectorAll('.yt-placeholder[data-yt][data-autoplay]'));
  if (!els.length) return;

  var st = document.createElement('style');
  st.textContent =
    '.yt-placeholder[data-autoplay]{position:relative;overflow:hidden}' +
    '.yt-placeholder .yt-auto{position:absolute;inset:0;width:100%;height:100%;border:0;pointer-events:none;' +
    'transform:scale(var(--yt-s,1.06));opacity:0;transition:opacity .8s ease;z-index:1}' +
    '.yt-placeholder .yt-auto.is-on{opacity:1}';
  document.head.appendChild(st);

  // Scale the 16:9 picture so it fills the card edge to edge (and YouTube's title bar falls outside)
  function fit(el) {
    var w = el.clientWidth, h = el.clientHeight;
    if (!w || !h) return;
    var r = w / h, v = 16 / 9;
    el.style.setProperty('--yt-s', (Math.max(r / v, v / r) * 1.06).toFixed(3));
  }

  function frameFor(el) {
    var f = el.querySelector('iframe.yt-auto');
    if (f) return f;
    fit(el);
    var id = encodeURIComponent(el.getAttribute('data-yt'));
    f = document.createElement('iframe');
    f.className = 'yt-auto';
    f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&mute=1&loop=1&playlist=' + id +
      '&controls=0&disablekb=1&fs=0&iv_load_policy=3&modestbranding=1&rel=0&playsinline=1&enablejsapi=1';
    f.allow = 'autoplay; encrypted-media; picture-in-picture';
    f.setAttribute('tabindex', '-1');
    f.setAttribute('aria-hidden', 'true');
    f.title = 'Video preview';
    // Fade in once the player has had time to start (keeps the still image instead of a black flash)
    f.addEventListener('load', function () { setTimeout(function () { f.classList.add('is-on'); }, 1200); });
    el.appendChild(f);
    return f;
  }

  function send(f, func) {
    try { f.contentWindow.postMessage(JSON.stringify({ event: 'command', func: func, args: [] }), '*'); } catch (e) {}
  }

  function play(el) {
    var f = el.querySelector('iframe.yt-auto');
    if (!f) frameFor(el); else send(f, 'playVideo');
  }
  function pause(el) {
    var f = el.querySelector('iframe.yt-auto');
    if (f) send(f, 'pauseVideo');
  }

  window.addEventListener('resize', function () { els.forEach(fit); });

  if (!('IntersectionObserver' in window)) { els.forEach(play); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting && !document.hidden) play(e.target); else pause(e.target);
    });
  }, { threshold: 0.25 });
  els.forEach(function (el) { io.observe(el); });

  document.addEventListener('visibilitychange', function () {
    els.forEach(function (el) {
      if (document.hidden) { pause(el); return; }
      var r = el.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) play(el);
    });
  });
})();
