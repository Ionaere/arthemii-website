/*
 * Arthemii Ionaere — the entrance to the 3D space (/space/).
 * Loaded on every page by i18n.js. A small clear-glass prism slowly turns in the
 * lower right corner; click it and the black, starry space opens up from the prism.
 *
 * The prism is ray-traced live in a tiny WebGL canvas: real refraction through the
 * glass (with slight colour dispersion, like an optical prism), reflections, total
 * internal reflection at the faces and a faint green tint of thick glass. Browsers
 * without WebGL keep the simple CSS prism.
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
    // Ray-traced glass prism (WebGL)
    '.sp-prism--gl .sp-prism__stage{transform:none!important}' +
    '.sp-prism--gl .sp-prism__spin{display:none}' +
    '.sp-prism__gl{position:absolute;left:-8px;top:-14px;width:76px;height:76px;display:block;pointer-events:none}' +
    '.sp-prism--gl .sp-prism__shadow{bottom:3px;width:34px;margin-left:-17px;background:radial-gradient(rgba(0,0,0,.22),transparent 70%)}' +
    '.sp-prism--gl .sp-prism__rays{bottom:4px;width:52px;margin-left:-26px;opacity:.8}' +
    '@media (max-width:640px){.sp-prism__gl{left:-7px;top:-12px;width:66px;height:66px}}' +
    '@media print{.sp-prism{display:none}}';


  /* ---------- Ray-traced glass prism ---------- */
  var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var FS = [
    'precision highp float;',
    'uniform vec2 uRes;uniform float uAng;',
    'const float RIN=0.25;const float HH=0.75;',
    // the five planes of an equilateral triangular prism (outward normal n, offset d)
    'void pl(int i,out vec3 n,out float d){',
    '  if(i==0){n=vec3(0.,0.,1.);d=RIN;}',
    '  else if(i==1){n=vec3(-0.8660254,0.,-0.5);d=RIN;}',
    '  else if(i==2){n=vec3(0.8660254,0.,-0.5);d=RIN;}',
    '  else if(i==3){n=vec3(0.,1.,0.);d=HH;}',
    '  else{n=vec3(0.,-1.,0.);d=HH;}}',
    'vec3 rotY(vec3 v,float a){float c=cos(a),s=sin(a);return vec3(c*v.x+s*v.z,v.y,-s*v.x+c*v.z);}',
    // studio surroundings: light walls, dark table, softboxes and dark flags give the glass its contrast
    'vec3 sky(vec3 d){',
    '  float y=d.y;float az=atan(d.x,d.z);',
    '  vec3 c=mix(vec3(0.9,0.905,0.92),vec3(1.),smoothstep(0.,0.6,y));',
    '  c*=1.-0.5*exp(-pow(y/0.05,2.));',
    '  float up=smoothstep(-0.02,0.1,y);',
    '  c+=vec3(2.4)*smoothstep(0.24,0.13,abs(az-1.15))*up*smoothstep(0.95,0.45,y);',
    '  c+=vec3(1.7)*smoothstep(0.15,0.07,abs(az+2.25))*up;',
    '  c*=1.-0.93*smoothstep(0.32,0.18,abs(az-2.55))*up;',
    '  c*=1.-0.85*smoothstep(0.22,0.12,abs(az+0.55))*up*smoothstep(0.9,0.3,y);',
    '  c*=1.-0.8*smoothstep(0.17,0.09,abs(az-0.3))*smoothstep(0.04,0.3,y)*smoothstep(0.8,0.45,y);',
    '  c+=vec3(1.3)*smoothstep(0.85,0.97,y);',
    '  return c;}',
    // what a ray leaving the glass at point o (world space) in direction d sees:
    // the white table the prism stands on, with its soft contact shadow, or the room
    'vec3 env(vec3 o,vec3 d){',
    '  if(d.y<-0.002){float t=(-HH-0.001-o.y)/d.y;vec3 h=o+d*t;float r2=dot(h.xz,h.xz);',
    '    vec3 c=vec3(0.95);',
    '    c*=1.-0.7*exp(-r2/0.09)-0.25*exp(-r2/0.6);',
    '    float ring=exp(-pow((length(h.xz-vec2(0.35,0.25))-0.45)/0.08,2.));',
    '    c+=ring*0.35*(0.5+0.5*cos(6.2832*(vec3(0.,0.33,0.67)+atan(h.z-0.25,h.x-0.35)/3.)));',
    '    float far=smoothstep(2.5,9.,sqrt(r2));',
    '    return mix(c,sky(d)*0.8,far);}',
    '  return sky(d);}',
    'float fres(float c){c=clamp(1.-c,0.,1.);return 0.04+0.96*c*c*c*c*c;}',
    'bool enter(vec3 ro,vec3 rd,out float t,out vec3 nE){',
    '  float tE=-1e9,tX=1e9;vec3 n;float d;nE=vec3(0.);',
    '  for(int i=0;i<5;i++){pl(i,n,d);float dn=dot(n,rd);float s=d-dot(n,ro);',
    '    if(abs(dn)<1e-6){if(s<0.)return false;continue;}',
    '    float tt=s/dn;if(dn<0.){if(tt>tE){tE=tt;nE=n;}}else{tX=min(tX,tt);}}',
    '  t=tE;return tE<tX&&tE>0.;}',
    'void leave(vec3 q,vec3 d,out float t,out vec3 nX){',
    '  t=1e9;nX=vec3(0.,1.,0.);vec3 n;float dd;',
    '  for(int i=0;i<5;i++){pl(i,n,dd);float dn=dot(n,d);',
    '    if(dn>1e-5){float tt=(dd-dot(n,q))/dn;if(tt<t){t=tt;nX=n;}}}}',
    'float edge(vec3 p,vec3 nE){',
    '  float m=1.;vec3 n;float d;',
    '  for(int i=0;i<5;i++){pl(i,n,d);if(dot(n,nE)<0.99)m=min(m,d-dot(n,p));}',
    '  return m;}',
    // one channel of light through the glass, following up to 5 internal reflections
    'float through(vec3 p,vec3 rd,vec3 n,float ior,int ch,float ab,float ang){',
    '  vec3 d=refract(rd,n,1./ior);vec3 q=p;float acc=0.,thr=1.,len=0.;',
    '  for(int b=0;b<5;b++){float t;vec3 nx;leave(q,d,t,nx);q+=d*t;len+=t;',
    '    vec3 o=refract(d,-nx,ior);',
    '    if(dot(o,o)>0.){float f=fres(dot(o,nx));vec3 e=env(rotY(q,ang),rotY(o,ang));',
    '      float ev=ch==0?e.r:(ch==1?e.g:e.b);acc+=thr*(1.-f)*ev*exp(-ab*len);thr*=f;}',
    '    d=reflect(d,-nx);q+=d*1e-4;}',
    '  return acc;}',
    'void main(){',
    '  vec3 col=vec3(0.);float cov=0.;',
    '  float tilt=0.3;vec3 cam=vec3(0.,sin(tilt),cos(tilt))*3.3;',
    '  vec3 fw=normalize(-cam),rt=normalize(cross(fw,vec3(0.,1.,0.))),up=cross(rt,fw);',
    '  for(int sx=0;sx<2;sx++)for(int sy=0;sy<2;sy++){',
    '    vec2 uv=(gl_FragCoord.xy+vec2(float(sx),float(sy))*0.5-0.25)/uRes*2.-1.;',
    '    uv.y+=0.04;',
    '    vec3 rd=normalize(fw+(uv.x*rt+uv.y*up)*0.33);',
    '    vec3 ro=rotY(cam,-uAng);rd=rotY(rd,-uAng);',
    '    float t;vec3 n;',
    '    if(enter(ro,rd,t,n)){',
    '      vec3 p=ro+rd*t;float F=fres(dot(-rd,n));',
    '      vec3 refl=env(rotY(p,uAng),rotY(reflect(rd,n),uAng));',
    '      vec3 tr=vec3(through(p,rd,n,1.44,0,0.06,uAng),through(p,rd,n,1.52,1,0.03,uAng),through(p,rd,n,1.62,2,0.05,uAng));',
    '      vec3 c=refl*F+tr*(1.-F);',
    // dichroic shimmer: thin-film colours that shift with the viewing angle and height, so the
    // whole prism plays in rainbow colours as it turns (like the dichroic glass in the works)
    '      float cv=abs(dot(rd,n));',
    '      float ph=1.7*cv+0.55*p.y+0.3*dot(n.xz,vec2(0.7,-0.4))+0.12*uAng+0.25*tr.g;',
    '      vec3 iri=0.5+0.5*cos(6.2832*(ph+vec3(0.,0.33,0.67)));',
    '      c=mix(c,c*(0.45+1.1*iri),0.6);',
    // thick glass shows green-dark at its polished edges
    '      float e=smoothstep(0.005,0.035,edge(p,n));',
    '      c=mix(c*vec3(0.42,0.58,0.54)+vec3(0.04),c,e);',
    '      col+=c;cov+=1.;}}',
    '  if(cov==0.){gl_FragColor=vec4(0.);return;}',
    '  col/=cov;col=clamp((1.-exp(-1.8*col))/(1.-exp(-1.8)),0.,1.);',
    // clear glass: where it only shows light surroundings it lets the page through,
    // so over the white page it looks the same, over a photo the photo shows through
    '  vec3 k=1.-col;float g=clamp(max(max(k.r,k.g),k.b),0.1,1.);',
    '  float a=cov/4.;gl_FragColor=vec4((col-1.+g)*a,g*a);}'
  ].join('\n');

  function glassPrism(a) {
    var cv = document.createElement('canvas');
    cv.className = 'sp-prism__gl';
    var gl;
    try { gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false }) || cv.getContext('experimental-webgl'); } catch (e) { gl = null; }
    if (!gl) return;
    function sh(type, src) {
      var o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o);
      if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) { if (window.console) console.warn('[space-portal]', gl.getShaderInfoLog(o)); return null; }
      return o;
    }
    var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return;
    var pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
    gl.useProgram(pr);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var uRes = gl.getUniformLocation(pr, 'uRes'), uAng = gl.getUniformLocation(pr, 'uAng');

    a.querySelector('.sp-prism__stage').appendChild(cv);
    a.classList.add('sp-prism--gl');

    function size() {
      var w = cv.clientWidth || 76, r = Math.min(window.devicePixelRatio || 1, 2);
      var px = Math.round(w * r);
      if (cv.width !== px) { cv.width = cv.height = px; gl.viewport(0, 0, px, px); gl.uniform2f(uRes, px, px); }
    }
    var ang = 0.6, speed = 0, last = 0, raf = 0, hover = false;
    var BASE = Math.PI * 2 / 7, FAST = Math.PI * 2 / 2.6;
    /* keeps turning even when the phone has Reduce Motion switched on (owner's choice) */
    var still = false;
    function draw() { size(); gl.uniform1f(uAng, ang); gl.drawArrays(gl.TRIANGLES, 0, 3); }
    function frame(now) {
      raf = 0;
      var dt = last ? Math.min(0.1, (now - last) / 1000) : 0; last = now;
      var target = hover ? FAST : BASE;
      speed += (target - speed) * Math.min(1, dt * 3);
      ang = (ang + speed * dt) % (Math.PI * 2);
      draw();
      if (!document.hidden) raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf && !still) { last = 0; raf = requestAnimationFrame(frame); } }
    speed = BASE;
    draw();
    start();
    a.addEventListener('mouseenter', function () { hover = true; if (still) { draw(); } });
    a.addEventListener('mouseleave', function () { hover = false; });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) start(); });
    window.addEventListener('resize', draw);
    cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); if (raf) cancelAnimationFrame(raf); raf = 0; a.classList.remove('sp-prism--gl'); cv.remove(); });
  }

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
    glassPrism(a);

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
