import { initNatureAudio } from './juss-nature-audio.mjs';
import { atmosphereAt } from './juss-season.mjs';
(() => {
  const carousel = document.getElementById('worldProductTrack');
  if (!carousel) return;
  const timezone = (() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; }
    catch { return 'UTC'; }
  })();
  let current = { season: 'autumn', holiday: '', timezone };
  try { current = atmosphereAt(new Date(), timezone); } catch {}
  document.body.dataset.jussSeason = current.season;
  document.body.dataset.jussHoliday = current.holiday;
  const seasonLabel = document.getElementById('worldSeasonLabel');
  if (seasonLabel) seasonLabel.textContent = current.season;
  const holidayLabel = document.getElementById('worldHolidayLabel');
  if (holidayLabel) {
    const names = { halloween: 'Autumn lights', 'winter-lights': 'Winter lights', 'new-year': 'New year glow' };
    holidayLabel.textContent = names[current.holiday] || 'Seasonal atmosphere';
  }

  const projects = [
    { slug: 'founder-control-room', name: 'Founder Control Room', symbol: '♛', color: '#ffd48d', world: 'Founder Control Room' },
    { slug: 'chief-ai-machine', name: 'Chief AI', symbol: '✧', color: '#7dd9ff', world: 'Chief AI' },
    { slug: 'promptos', name: 'PromptOS', symbol: '▱', color: '#c49aff', world: 'PromptOS' },
    { slug: 'sekret-bip', name: 'Se’kret Bip', symbol: '✦', color: '#e6a6ff', world: "Se'kret Bip" },
    { slug: 'solwealth', name: 'SOL', symbol: '☼', color: '#ffde8b', world: 'Solwealth' },
    { slug: 'think-tank', name: 'Think Tank', symbol: '◈', color: '#85d1ff', world: 'Think Tank' },
    { slug: 'truth-weaver', name: 'Truth Weaver', symbol: '❧', color: '#eab48b', world: 'Truth Weaver' },
    { slug: 'sleepwealth-agent', name: 'SleepWealth', symbol: '↗', color: '#fbd788', world: 'SleepWealth Agent' },
    { slug: 'juss-beautiful-hair', name: 'JBH', symbol: '✺', color: '#ffa2d6', world: 'Juss Beautiful Hair' }
  ];
  const canonicalPublicLink = value => {
    if (typeof value !== 'string') return '';
    try {
      const url = new URL(value, window.location.href);
      return url.protocol === 'https:' ? url.href : '';
    } catch { return ''; }
  };
  const createCard = (product, record, canonical) => {
    const anchor = document.createElement('a');
    anchor.className = 'world-card';
    anchor.style.setProperty('--world-card', product.color);
    // Unopened product doors remain in the public portfolio, not a fabricated checkout or login.
    const link = (product.slug !== 'sekret-bip' && product.slug !== 'solwealth')
      ? canonicalPublicLink(record?.link?.url || canonical?.link) : '';
    anchor.href = link || '/portfolio.html';
    anchor.setAttribute('aria-label', 'Explore ' + product.name + (link ? '' : ' in the portfolio'));
    if (link) anchor.rel = 'noopener noreferrer';
    const icon = document.createElement('span');
    icon.className = 'world-card-icon';
    icon.textContent = product.symbol;
    icon.setAttribute('aria-hidden', 'true');
    const title = document.createElement('span');
    title.className = 'world-card-title';
    title.textContent = product.name;
    const status = document.createElement('span');
    status.className = 'world-card-status';
    status.textContent = record?.label || canonical?.publicLabel || 'Explore';
    anchor.append(icon, title, status);
    return anchor;
  };
  // Product identities and founder-declared publication status come from existing public-safe registries.
  Promise.all([
    fetch('/data/worlds.json').then(r => r.ok ? r.json() : null).catch(() => null),
    fetch('/data/portfolio.json').then(r => r.ok ? r.json() : null).catch(() => null)
  ]).then(([worlds, portfolio]) => {
    const byWorld = new Map((worlds?.worlds || []).map(w => [w.name, w]));
    const bySlug = new Map((portfolio?.projects || []).map(p => [p.slug, p]));
    carousel.replaceChildren(...projects.map(p => createCard(p, byWorld.get(p.world), bySlug.get(p.slug))));
  }).catch(() => {
    carousel.replaceChildren(...projects.map(p => createCard(p, null, null)));
  });
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  for (const [button, direction] of [['worldCarouselPrev', -1], ['worldCarouselNext', 1]]) {
    document.getElementById(button)?.addEventListener('click', () => {
      carousel.scrollBy({ left: direction * Math.min(carousel.clientWidth * 0.72, 540), behavior: reduce ? 'instant' : 'smooth' });
    });
  }
  initNatureAudio(current.season);
})();