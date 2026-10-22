/* Juss & Co conversion intent v1. No cookies, identities, email values, or URL payloads. */
(() => {
  'use strict';
  function classify(target) {
    if (!target || typeof target.closest !== 'function') return null;
    if (target.closest('#copyBtn')) return ['contact_click', 'copy_email'];
    const anchor = target.closest('a[href]');
    if (anchor) {
      const href = (anchor.getAttribute('href') || '').trim();
      if (/^mailto:/i.test(href)) return ['contact_click', 'email'];
      if (/^tel:/i.test(href)) return ['call_click', 'phone'];
      let host;
      try { host = new URL(href, window.location.href).hostname.toLowerCase(); }
      catch { return null; }
      if (host === 'wa.me' || host === 'api.whatsapp.com') return ['whatsapp_click', 'whatsapp'];
      if (anchor.matches('.os-link')) return ['app_open', 'standalone_system'];
      if (host === 'jussbeautifulhair.com' || host === 'www.jussbeautifulhair.com') return ['shop_click', 'jbh'];
      if (anchor.matches('#dCta a')) return ['project_open', 'world_cta'];
      if (host === 'games.jussco.company') return ['app_open', 'games'];
      return null;
    }
    if (target.closest('#worlds .card')) return ['world_detail_open', 'world_card'];
    return null;
  }

  document.addEventListener('click', event => {
    if (navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' || window.doNotTrack === '1') return;
    const item = classify(event.target);
    if (!item || !window.zaraz || typeof window.zaraz.track !== 'function') return;
    try {
      const promise = window.zaraz.track(item[0], {
        project: 'juss-and-co', surface: 'front_door', action: item[1], schema: 'v1'
      });
      if (promise && typeof promise.catch === 'function') promise.catch(() => {});
    } catch { /* Analytics must never interrupt a visitor's action. */ }
  }, { capture: true, passive: true });
})();
