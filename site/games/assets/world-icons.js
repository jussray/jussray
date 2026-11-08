/* Juss & Co world icons: glowing illustrated glyphs for ecosystem tiles (founder mockups, 2026-11-07).
   Static, first-party SVG strings parsed as SVG (never as HTML); names come from site/data/*.json. */
(function () {
  var G = {
    gold: ['#FFF3C4', '#F5C14B', '#C9822B'],
    violet: ['#E9D5FF', '#A78BFA', '#6D28D9'],
    cyan: ['#D7FBFF', '#5EE7FF', '#3B6BFF'],
    pink: ['#FFE0F0', '#FF8FC7', '#C0267A'],
    sun: ['#FFF6D6', '#FFB347', '#E8590C'],
    green: ['#E2FFE9', '#5EEAA0', '#0E9F6E']
  };
  function grad(id, c) {
    return '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset=".5" stop-color="' + c[1] + '"/><stop offset="1" stop-color="' + c[2] + '"/></linearGradient></defs>';
  }
  function svg(id, color, body) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke-linecap="round" stroke-linejoin="round">' + grad(id, G[color]) + body.replace(/URL/g, 'url(#' + id + ')') + '</svg>';
  }
  var I = {
    crown: svg('ji-crown', 'gold', '<path d="M8 46h48l4-28-14 10-14-18-14 18-14-10z" fill="URL" opacity=".9"/><path d="M8 52h48" stroke="URL" stroke-width="4"/><circle cx="32" cy="10" r="3" fill="#FFF3C4"/>'),
    console: svg('ji-console', 'violet', '<rect x="6" y="26" width="52" height="26" rx="5" stroke="URL" stroke-width="3"/><rect x="12" y="31" width="18" height="12" rx="2" fill="URL" opacity=".75"/><rect x="34" y="31" width="18" height="12" rx="2" fill="URL" opacity=".45"/><path d="M20 22l6-8 6 6 6-6 6 8z" fill="#F5C14B"/>'),
    network: svg('ji-network', 'cyan', '<circle cx="32" cy="32" r="24" stroke="URL" stroke-width="3"/><path d="M14 26l18-12 18 12-6 20H20zM32 14v38M14 26l30 20M50 26L20 46" stroke="URL" stroke-width="1.6" opacity=".85"/><g fill="#FFFFFF"><circle cx="32" cy="14" r="3"/><circle cx="14" cy="26" r="3"/><circle cx="50" cy="26" r="3"/><circle cx="20" cy="46" r="3"/><circle cx="44" cy="46" r="3"/><circle cx="32" cy="32" r="4"/></g>'),
    butterfly: svg('ji-butterfly', 'pink', '<path d="M32 30C26 12 8 8 8 22c0 9 10 12 24 8zM32 30c6-18 24-22 24-8 0 9-10 12-24 8zM32 32c-6 14-22 18-20 6 1-6 10-8 20-6zM32 32c6 14 22 18 20 6-1-6-10-8-20-6z" fill="URL" opacity=".9"/><path d="M32 22v24M30 18l-4-6M34 18l4-6" stroke="#FFE0F0" stroke-width="2"/>'),
    hair: svg('ji-hair', 'pink', '<path d="M20 54c-6-14 0-30 12-38 12 8 18 22 12 38" stroke="URL" stroke-width="4"/><path d="M26 52c-4-12 0-24 6-30M38 52c4-12 2-22-6-30" stroke="URL" stroke-width="2.4" opacity=".8"/><circle cx="46" cy="16" r="3" fill="#F5C14B"/>'),
    book: svg('ji-book', 'violet', '<path d="M32 18C24 12 14 12 6 14v34c8-2 18-2 26 4 8-6 18-6 26-4V14c-8-2-18-2-26 4z" fill="URL" opacity=".55" stroke="URL" stroke-width="2.4"/><path d="M32 18v34" stroke="#FFF3C4" stroke-width="2"/><path d="M44 6l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#F5C14B"/>'),
    infinity: svg('ji-infinity', 'pink', '<path d="M32 32c-6-8-12-12-18-12a12 12 0 000 24c6 0 12-4 18-12s12-12 18-12a12 12 0 010 24c-6 0-12-4-18-12z" stroke="URL" stroke-width="5"/>'),
    star: svg('ji-star', 'gold', '<path d="M32 6l7 16 17 2-13 11 4 17-15-9-15 9 4-17L8 24l17-2z" fill="URL"/><circle cx="32" cy="30" r="5" fill="#FFF3C4" opacity=".8"/>'),
    layers: svg('ji-layers', 'violet', '<path d="M32 8l24 12-24 12L8 20z" fill="URL"/><path d="M8 30l24 12 24-12" stroke="URL" stroke-width="3.5"/><path d="M8 40l24 12 24-12" stroke="URL" stroke-width="3.5" opacity=".75"/>'),
    sun: svg('ji-sun', 'sun', '<circle cx="32" cy="32" r="13" fill="URL"/><g stroke="URL" stroke-width="3.5"><path d="M32 4v8M32 52v8M4 32h8M52 32h8M12 12l6 6M46 46l6 6M12 52l6-6M46 18l6-6"/></g>'),
    coin: svg('ji-coin', 'gold', '<circle cx="32" cy="32" r="22" fill="URL"/><circle cx="32" cy="32" r="16" stroke="#FFF3C4" stroke-width="2"/><path d="M36 24c-2-2-10-2-10 3s10 3 10 9-8 5-10 3M31 20v24" stroke="#7A4A10" stroke-width="3"/>'),
    globe: svg('ji-globe', 'cyan', '<circle cx="32" cy="30" r="22" fill="URL" opacity=".35" stroke="URL" stroke-width="3"/><path d="M10 30h44M32 8c-8 8-8 36 0 44M32 8c8 8 8 36 0 44M14 18h36M14 42h36" stroke="URL" stroke-width="1.8"/><path d="M20 56h24" stroke="#F5C14B" stroke-width="4"/>'),
    moon: svg('ji-moon', 'violet', '<path d="M40 8a24 24 0 1016 40A20 20 0 0140 8z" fill="URL"/><path d="M14 48l10-10 8 6 14-16" stroke="#5EEAA0" stroke-width="3"/>'),
    feather: svg('ji-feather', 'gold', '<path d="M50 8C26 12 12 30 14 54 32 50 50 34 50 8z" fill="URL" opacity=".9"/><path d="M14 54L40 24M22 42h12M28 34h10" stroke="#7A4A10" stroke-width="2"/>'),
    scroll: svg('ji-scroll', 'gold', '<rect x="14" y="10" width="36" height="44" rx="4" fill="URL" opacity=".55" stroke="URL" stroke-width="2.4"/><path d="M20 22h24M20 30h24M20 38h16" stroke="#FFF3C4" stroke-width="2.4"/><circle cx="46" cy="46" r="6" fill="#C0267A"/>'),
    hoodie: svg('ji-hoodie', 'violet', '<path d="M22 10c4 6 16 6 20 0l12 8 4 20-8 2v16H14V40l-8-2 4-20z" fill="URL" opacity=".85"/><path d="M26 30v10M38 30v10" stroke="#E9D5FF" stroke-width="2"/>'),
    cart: svg('ji-cart', 'pink', '<path d="M6 12h8l6 28h28l6-20H18" stroke="URL" stroke-width="3.5"/><path d="M22 26h28M24 33h24M30 20v20M38 20v20" stroke="URL" stroke-width="1.6" opacity=".8"/><circle cx="24" cy="50" r="4" fill="URL"/><circle cx="44" cy="50" r="4" fill="URL"/>'),
    home: svg('ji-home', 'green', '<path d="M8 30L32 10l24 20" stroke="URL" stroke-width="4"/><path d="M14 26v28h36V26" fill="URL" opacity=".35" stroke="URL" stroke-width="3"/><circle cx="32" cy="38" r="6" stroke="#F5C14B" stroke-width="3"/><path d="M32 44v6" stroke="#F5C14B" stroke-width="3"/>'),
    compass: svg('ji-compass', 'cyan', '<circle cx="32" cy="32" r="24" stroke="URL" stroke-width="3"/><path d="M42 22l-6 14-14 6 6-14z" fill="URL"/><circle cx="32" cy="32" r="3" fill="#FFF"/>'),
    tree: svg('ji-tree', 'green', '<path d="M32 6L14 34h10L12 50h40L40 34h10z" fill="URL"/><path d="M32 50v8" stroke="#C9822B" stroke-width="4"/><path d="M50 8l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="#F5C14B"/>'),
    kite: svg('ji-kite', 'violet', '<path d="M40 6a18 18 0 1012 28A14 14 0 0140 6z" fill="URL"/><path d="M14 40l8-8 8 8-8 8z" fill="#FF8FC7"/><path d="M22 48c-2 6 2 8-2 12" stroke="#FFE0F0" stroke-width="2"/>'),
    leaf: svg('ji-leaf', 'green', '<path d="M12 52C10 28 26 10 54 10 54 38 36 54 12 52z" fill="URL"/><path d="M12 52L44 20" stroke="#E2FFE9" stroke-width="2.4"/>'),
    mask: svg('ji-mask', 'pink', '<path d="M10 14h44v14c0 14-10 24-22 24S10 42 10 28z" fill="URL" opacity=".9"/><path d="M20 26c2-3 6-3 8 0M36 26c2-3 6-3 8 0M22 38c6 6 14 6 20 0" stroke="#3B0A24" stroke-width="3"/>'),
    controller: svg('ji-controller', 'violet', '<path d="M14 22h36c6 0 10 6 10 14l-2 10c-1 6-8 7-11 2l-4-6H21l-4 6c-3 5-10 4-11-2L4 36c0-8 4-14 10-14z" fill="URL"/><path d="M18 30v8M14 34h8" stroke="#FFF" stroke-width="3"/><circle cx="44" cy="31" r="2.5" fill="#FFF"/><circle cx="49" cy="36" r="2.5" fill="#FFF"/>')
  };
  var BY_NAME = {
    "Se'kret Bip": 'butterfly', 'Founder Control Room': 'console', 'Chief AI': 'network', 'Juss Beautiful Hair': 'hair',
    'StoryEngine': 'book', 'Sync Party': 'infinity', 'SYNC': 'infinity', 'Bip Jr': 'star', 'PromptOS': 'layers',
    'SolContinuity': 'sun', 'Solwealth': 'coin', 'Untold Stories': 'scroll', 'SWEATS': 'hoodie',
    'SleepWealth Agent': 'moon', 'Think Tank': 'globe', 'Alexa Commerce Engine': 'cart', 'Ayure': 'home',
    'Truth Weaver': 'feather', 'LUMORA': 'tree', 'ChatQuest': 'compass', 'Bip & Seek': 'kite',
    'Jungle Jinx': 'leaf', 'Last Laugh': 'mask', 'Juss & Co Games': 'controller'
  };
  var parser = typeof DOMParser !== 'undefined' ? new DOMParser() : null;
  window.JCIcon = function (name) {
    var key = BY_NAME[name] || 'crown';
    if (!parser) return null;
    var el = parser.parseFromString(I[key], 'image/svg+xml').documentElement;
    if (!el || el.nodeName !== 'svg') return null;
    el.setAttribute('aria-hidden', 'true'); el.setAttribute('focusable', 'false'); el.setAttribute('data-icon', key);
    return document.importNode(el, true);
  };
})();
