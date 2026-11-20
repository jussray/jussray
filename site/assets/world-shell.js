/* Juss & Co world shell: same lake world and same header on every page.
   Without JS the page keeps its own header, so nothing is lost. */
(function () {
  var root = document.documentElement;
  var NAV = [
    ['Home', '/', 'home'], ['Portfolio', '/portfolio.html', 'portfolio'], ['Products', '/products.html', 'products'],
    ['Games', 'https://games.jussco.company/', 'games'], ['Solutions', '/services.html', 'services'],
    ['Our Work', '/work.html', 'work'], ['Ideas', '/ideas.html', 'ideas'],
    ['Founder', '/founder.html', 'founder'], ['Contact', '/contact.html', 'contact']
  ];
  var path = location.pathname.replace(/\/+$/, '') || '/';
  var current = { '/portfolio.html': 'portfolio', '/services.html': 'services', '/work.html': 'work', '/ideas.html': 'ideas' }[path] || '';

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
      var a = document.createElement('a'); a.href = n[1]; a.textContent = n[0]; if (/^https?:/.test(n[1])) a.rel = 'noopener noreferrer';
      if (n[2] === current) a.setAttribute('aria-current', 'page');
      nav.appendChild(a);
    });
    var mb = document.createElement('button');
    mb.type = 'button'; mb.className = 'menu-btn'; mb.setAttribute('aria-expanded', 'false'); mb.setAttribute('aria-label', 'Open menu');
    nav.id = 'wsNav'; mb.setAttribute('aria-controls', 'wsNav'); mb.textContent = 'Menu \u2630';
    header.appendChild(brand); header.appendChild(mb); header.appendChild(nav);
    wireMenu(header, mb, nav);
    // Placeholders written [LIKE THIS] render as pending, never as raw brackets.
    document.querySelectorAll('.ph').forEach(function (el) {
      var t = el.textContent.trim(); var m = /^\[(.+)\]$/.exec(t);
      if (m) { el.textContent = 'Pending: ' + m[1].toLowerCase(); el.setAttribute('data-placeholder', t); }
    });
    // Same living world everywhere: atmosphere motion plus matched ambient sound.
    // Pages with their own ambience panel (Ideas) keep theirs.
    if (!document.querySelector('script[src$="/assets/atmosphere.mjs"], #sound')) {
      var css = document.createElement('link'); css.rel = 'stylesheet'; css.href = '/assets/atmosphere.css'; document.head.appendChild(css);
      var mod = document.createElement('script'); mod.type = 'module'; mod.src = '/assets/atmosphere.mjs'; document.head.appendChild(mod);
    }
    var on = nav.querySelector('[aria-current]');
    if (on && on.scrollIntoView && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = on.offsetLeft - 16;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
