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

function wireMenu(header, btn, nav){
  if(!header||!btn||!nav) return;
  function set(open){ header.classList.toggle('nav-open',open); btn.setAttribute('aria-expanded',String(open)); btn.setAttribute('aria-label',open?'Close menu':'Open menu'); }
  btn.addEventListener('click',function(){ set(!header.classList.contains('nav-open')); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&header.classList.contains('nav-open')){ set(false); btn.focus(); } });
  nav.addEventListener('click',function(e){ if(e.target.closest('a')) set(false); });
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
    var mb = document.createElement('button');
    mb.type = 'button'; mb.className = 'menu-btn'; mb.setAttribute('aria-expanded', 'false'); mb.setAttribute('aria-label', 'Open menu');
    nav.id = 'wsNav'; mb.setAttribute('aria-controls', 'wsNav'); mb.innerHTML = '<span></span><span></span><span></span>';
    header.appendChild(brand); if (current !== 'services') header.appendChild(cta); header.appendChild(mb); header.appendChild(nav);
    wireMenu(header, mb, nav);
    var TABS = [['Home', '/', 'home'], ['Products', '/#products', 'products'], ['Solutions', '/services.html', 'services'], ['Our Work', '/work.html', 'work'], ['Founder', '/#why', 'founder']];
    var ICON = {'home': '<path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"/>', 'products': '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>', 'solutions': '<path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5"/>', 'work': '<path d="M3 18h18l1-11-6 4-4-7-4 7-6-4z"/>', 'founder': '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'};
    var ICON_KEY = { home: 'home', products: 'products', services: 'solutions', work: 'work', founder: 'founder' };
    var bar = document.createElement('nav'); bar.className = 'tabbar'; bar.setAttribute('aria-label', 'Quick navigation');
    TABS.forEach(function (t) {
      var a = document.createElement('a'); a.href = t[1];
      a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICON[ICON_KEY[t[2]]] + '</svg><span>' + t[0] + '</span>';
      if (t[2] === current) a.setAttribute('aria-current', 'page');
      bar.appendChild(a);
    });
    document.body.appendChild(bar);
    var on = nav.querySelector('[aria-current]');
    if (on && on.scrollIntoView && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = on.offsetLeft - 16;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
