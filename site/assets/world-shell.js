/* Juss & Co world shell: same lake world and same header on every page.
   Without JS the page keeps its own header, so nothing is lost. */
(function () {
  var root = document.documentElement;
  var NAV = [
    ['Home', '/', 'home'], ['Portfolio', '/portfolio.html', 'portfolio'], ['Products', '/#products', 'products'],
    ['Worlds', '/#worlds', 'worlds'], ['Solutions', '/services.html', 'services'], ['Our Work', '/work.html', 'work'],
    ['Proof', '/#proof', 'proof'], ['Founder', '/#why', 'founder'], ['Contact', '/#contact', 'contact']
  ];
  var path = location.pathname.replace(/\/+$/, '') || '/';
  var current = { '/portfolio.html': 'portfolio', '/services.html': 'services', '/work.html': 'work' }[path] || '';

  function atmo() {
    var h = new Date().getHours();
    return h >= 5 && h < 8 ? 'dawn' : h >= 8 && h < 17 ? 'day' : h >= 17 && h < 20 ? 'sunset' : 'night';
  }

  function build() {
    root.classList.add('ws-on');
    if (!document.body.hasAttribute('data-atmo')) document.body.setAttribute('data-atmo', atmo());
    if (!document.querySelector('.ws-scene, .scene, .page-scene')) {
      var scene = document.createElement('div');
      scene.className = 'ws-scene';
      scene.setAttribute('aria-hidden', 'true');
      ['day', 'sunset', 'night'].forEach(function (k) { var d = document.createElement('div'); d.className = 'art ' + k; scene.appendChild(d); });
      var t = document.createElement('div'); t.className = 'tint'; scene.appendChild(t);
      document.body.insertBefore(scene, document.body.firstChild);
    }
    // Upgrade the page's own header (header.top, else its first page-level header); create one if the page has none.
    var header = document.querySelector('header.top') || document.querySelector('body > header, body > .wrap > header, body > div > header');
    if (!header) { header = document.createElement('header'); var scn = document.querySelector('.ws-scene'); document.body.insertBefore(header, scn ? scn.nextSibling : document.body.firstChild); }
    header.className = 'top ws-top';
    header.textContent = '';
    var brand = document.createElement('a');
    brand.className = 'brand'; brand.href = '/';
    brand.innerHTML = '<svg viewBox="0 0 30 22" aria-hidden="true"><path d="M2 20h26l2-14-8 6-7-10-7 10-8-6z"/></svg>Juss <b>&amp;</b> Co';
    var nav = document.createElement('nav');
    nav.className = 'ws-nav'; nav.setAttribute('aria-label', 'Primary');
    NAV.forEach(function (n) {
      var a = document.createElement('a'); a.href = n[1]; a.textContent = n[0];
      if (n[2] === current) a.setAttribute('aria-current', 'page');
      nav.appendChild(a);
    });
    var cta = document.createElement('a');
    cta.className = 'ws-cta'; cta.href = '/services.html'; cta.textContent = 'Work with Juss →';
    header.appendChild(brand); if (current !== 'services') header.appendChild(cta); header.appendChild(nav);
    var on = nav.querySelector('[aria-current]');
    if (on && on.scrollIntoView && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = on.offsetLeft - 16;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
