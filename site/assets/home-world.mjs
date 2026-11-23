/* Homepage world stage: atmosphere by local time, opt-in ambient sound, and the
   "Our Ecosystem" band sourced from the public worlds and systems registries. */
const $ = (s) => document.querySelector(s);
const root = document.documentElement;

const ATMOS = ['dawn', 'day', 'sunset', 'night'];
const NAMES = { dawn: 'Dawn', day: 'Daylight', sunset: 'Sunset', night: 'Night' };
// Opens on Sunset (founder v3 mockups, 2026-11-10); tapping cycles dawn / day / sunset / night.
let atmo = 'sunset';
function setAtmo(next) {
  atmo = next;
  root.dataset.tod = next;
  const name = $('#atmoName'); if (name) name.textContent = NAMES[next];
}
setAtmo(atmo);
$('#atmo')?.addEventListener('click', () => setAtmo(ATMOS[(ATMOS.indexOf(atmo) + 1) % ATMOS.length]));
// The date window under the atmosphere is the live meteorological season (Dec–Feb, Mar–May, Jun–Aug, Sep–Nov).
{ const d = new Date(), m = d.getMonth();
  const sm = m === 11 ? 11 : m < 2 ? 11 : m - (m + 1) % 3;
  const start = new Date(d.getFullYear() - (m < 2 ? 1 : 0), sm, 1);
  const end = new Date(start.getFullYear(), start.getMonth() + 3, 0);
  const fmt = (x) => x.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const el = $('#seasonWindow'); if (el) el.textContent = `${fmt(start)} – ${fmt(end)}`; }
// Features that are drawn but not built yet say so instead of pretending.
{ const toast = $('#home-toast'); let t = 0;
  document.addEventListener('click', (e) => { const b = e.target.closest('.soon'); if (!b || !toast) return;
    toast.textContent = b.dataset.soon || 'Coming soon.'; toast.hidden = false; clearTimeout(t); t = setTimeout(() => { toast.hidden = true; }, 2600); }); }


// Ambient sound: the shared engine plays a soundscape matched to the current atmosphere
// and crossfades when the atmosphere cycles (site/assets/ambience.mjs).
const amb = import('./ambience.mjs');
const soundBtn = $('#sound'), vol = $('#vol');
if (soundBtn) soundBtn.dataset.ambienceSwitch = '';
amb.then((m) => {
  if (vol) vol.value = Math.round(m.storedVolume() * 100);
  m.onAmbience((v) => soundBtn?.setAttribute('aria-checked', String(v)));
  if (soundBtn) m.armRemembered();
}).catch(() => {});
vol?.addEventListener('input', () => amb.then((m) => m.setVolume(+vol.value / 100)));
soundBtn?.addEventListener('click', async () => {
  const m = await amb; const next = soundBtn.getAttribute('aria-checked') !== 'true';
  if (!(await m.setAmbience(next))) soundBtn.setAttribute('aria-checked', 'false');
});

const FEATURED = new Map([
  ['Founder Control Room', { art: 'fcr' }],
  ['Chief AI', { art: 'chief' }],
  ['PromptOS', { art: 'promptos' }],
  ["Se'kret Bip", { art: 'bip' }],
  ['SolContinuity', { art: 'sol', title: 'SOL' }],
  ['Think Tank', { art: 'think' }],
  ['Truth Weaver', { art: 'truth' }],
  ['SleepWealth Agent', { art: 'sleepwealth', title: 'SleepWealth' }],
  ['Juss Beautiful Hair', { art: 'jbh', title: 'JBH' }],
]);
const BADGE_ART = { StoryEngine: 'story', 'Sync Party': 'sync' };
// Hidden tab: the shared ambience engine (ambience.mjs) fades and suspends itself.
const initials = (name) => name.replace(/[’']/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
// CLAUDE.md: a world links only when worlds.json declares a link and its front door is live.
// "Opening soon" worlds stay unlinked unless the founder confirmed the front door (Se'kret Bip, 2026-11-08).
const LIVE_FRONT_DOORS = new Set(["Se'kret Bip"]);
const linkable = (w) => w.link?.url && (w.st !== 'soon' || LIVE_FRONT_DOORS.has(w.name));
function tile(w) {
  const li = document.createElement('li'); li.className = 'eco-tile'; li.dataset.st = w.st || '';
  const inner = document.createElement(linkable(w) ? 'a' : 'div');
  if (linkable(w)) { inner.href = w.link.url; if (/^https?:/.test(w.link.url)) inner.rel = 'noopener noreferrer'; inner.setAttribute('aria-label', `${w.name}: ${w.label || ''}. ${w.link.text || 'Visit'}`); }
  const badge = document.createElement('span'); badge.className = 'eco-badge'; badge.setAttribute('aria-hidden', 'true'); badge.textContent = initials(w.name);
  const featured = FEATURED.get(w.name);
  if (featured) {
    badge.classList.add('is-reference');
    badge.dataset.art = featured.art;
  } else if (BADGE_ART[w.name]) { const img = document.createElement("img"); img.src = `/assets/w-${BADGE_ART[w.name]}.jpg`; img.alt = ""; img.loading = "lazy"; badge.replaceChildren(img); }
  const name = document.createElement('strong'); name.textContent = featured?.title ?? w.name;
  const status = document.createElement('small'); status.textContent = w.label || 'Status pending';
  inner.append(badge, name, status); li.append(inner); return li;
}
async function truthWeaver() {
  try {
    const response = await fetch('/data/systems.json', { cache: 'no-cache' });
    if (!response.ok) return;
    const { systems } = await response.json();
    const system = systems?.find((entry) => entry.name === 'Truth Weaver' && entry.public === true);
    if (system) return {
      name: system.name, st: system.status, label: system.label,
      link: system.publicUrl ? { url: system.publicUrl, text: 'Explore Truth Weaver' } : null,
    };
  } catch {
    // The other worlds remain available if the systems registry cannot load.
  }
}
async function ecosystem() {
  const track = $('#ecoTrack'); if (!track) return;
  try {
    const [data, truth] = await Promise.all([
      fetch('/data/worlds.json', { cache: 'no-cache' }).then((response) => response.json()),
      truthWeaver(),
    ]);
    const worlds = new Map((data.worlds || []).map((world) => [world.name, world]));
    if (truth) worlds.set(truth.name, truth);
    const ordered = [...FEATURED.keys()].map((name) => worlds.get(name)).filter(Boolean);
    ordered.push(...[...worlds.values()].filter((world) => !FEATURED.has(world.name)));
    track.replaceChildren(...ordered.map(tile));
  } catch {
    track.innerHTML = '<li class="eco-loading">The ecosystem is unavailable right now. <a href="/portfolio.html">Open the portfolio</a>.</li>';
  }
  const page = (dir) => track.scrollBy({ left: dir * track.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  $('#ecoPrev')?.addEventListener('click', () => page(-1));
  $('#ecoNext')?.addEventListener('click', () => page(1));
  const dots = $('#ecoDots');
  if (dots) { dots.replaceChildren(...Array.from({ length: 4 }, () => document.createElement('i')));
    const upd = () => { const max = track.scrollWidth - track.clientWidth, k = max > 0 ? Math.round(track.scrollLeft / max * 3) : 0; [...dots.children].forEach((d, j) => d.classList.toggle('on', j === k)); };
    track.addEventListener('scroll', upd, { passive: true }); upd(); }
}
// Header search: the whole public company map, not just the band.
// Sources are the site's own truth only: its pages, the Game Hub worlds, worlds.json and
// the public portfolio projection. Projects without a founder-declared live link open the portfolio.
const PAGES = [
  ['Our Products', '/products.html', 'Page'], ['Portfolio', '/portfolio.html', 'Page'], ['Solutions', '/services.html', 'Page'],
  ['Our Work', '/work.html', 'Page'], ['Ideas', '/ideas.html', 'Page'], ['Founder', '/founder.html', 'Page'],
  ['Contact', '/contact.html', 'Page'], ['Game Hub', 'https://games.jussco.company/', 'Page'],
  ['Public destinations', '/sites.html', 'Page'], ['Licensing', '/licensing.html', 'Page'],
];
const GAMES = [
  ['SYNC', 'https://sync.jussco.company/', 'Game · Live'], ['LUMORA', 'https://games.jussco.company/#lumora-world', 'Game · In development'],
  ['ChatQuest', 'https://games.jussco.company/#chatquest-world', 'Game · In development'], ['Bip & Seek', 'https://games.jussco.company/#bipseek-world', 'Game · In development'],
  ['Jungle Jinx', 'https://games.jussco.company/#junglejinx-world', 'Game · In development'], ['Last Laugh', 'https://games.jussco.company/#lastlaugh-world', 'Game · Private prototype'],
];
const norm = (t) => t.toLowerCase().replace(/[’']/g, '').replace(/\s+/g, ' ').trim();
let index = null;
async function buildIndex() {
  if (index) return index;
  const items = [...PAGES.map(([n, u, k]) => ({ name: n, url: u, kind: k })), ...GAMES.map(([n, u, k]) => ({ name: n, url: u, kind: k }))];
  const seen = new Set(items.map((i) => norm(i.name)));
  try {
    const worlds = (await (await fetch('/data/worlds.json', { cache: 'no-cache' })).json()).worlds || [];
    for (const w of worlds) { if (seen.has(norm(w.name))) continue; seen.add(norm(w.name));
      items.push({ name: w.name, url: linkable(w) ? w.link.url : '/portfolio.html', kind: (w.display?.group || 'Project') + ' · ' + (w.label || 'Status pending') }); }
  } catch {}
  try {
    const projects = (await (await fetch('/data/portfolio.json', { cache: 'no-cache' })).json()).projects || [];
    for (const p of projects) { if (seen.has(norm(p.name))) continue; seen.add(norm(p.name));
      items.push({ name: p.name, url: '/portfolio.html', kind: (p.category || 'Project') + ' · ' + (p.publicLabel || 'Status pending'), text: p.description || '' }); }
  } catch {}
  return (index = items);
}
{ const toggle = $('#home-search-toggle'), panel = $('#home-search'), field = $('#home-search-input'), status = $('#home-search-status'), list = $('#home-search-results');
  const close = () => { panel.hidden = true; toggle.setAttribute('aria-expanded', 'false'); field.value = ''; filter(); };
  async function filter() {
    const raw = field.value.trim(), q = norm(raw); let n = 0;
    const tiles = [...document.querySelectorAll('#ecoTrack .eco-tile')];
    const hits = q ? tiles.filter((li) => norm(`${li.textContent} ${li.querySelector('a')?.getAttribute('aria-label') || ''}`).includes(q)) : tiles;
    n = q ? hits.length : 0;
    // Narrow the band only when something in it matches; never leave it empty.
    tiles.forEach((li) => { li.hidden = q && hits.length > 0 && !hits.includes(li); });
    if (!q) { status.textContent = ''; list.replaceChildren(); return; }
    const items = (await buildIndex()).filter((i) => norm(`${i.name} ${i.kind} ${i.text || ''}`).includes(q));
    if (norm(field.value.trim()) !== q) return; // a newer keystroke owns the list
    list.replaceChildren(...items.slice(0, 8).map((i) => { const li = document.createElement('li'), a = document.createElement('a');
      a.href = i.url; if (/^https?:/.test(i.url)) a.rel = 'noopener noreferrer';
      const b = document.createElement('strong'); b.textContent = i.name; const s = document.createElement('small'); s.textContent = i.kind;
      a.append(b, s); li.append(a); return li; }));
    status.textContent = items.length ? `${items.length} result${items.length === 1 ? '' : 's'}${n ? `, ${n} in Our Ecosystem` : ''}.` : `Nothing matches "${raw}".`;
  }
  if (toggle && panel && field) {
    toggle.addEventListener('click', () => { if (panel.hidden) { panel.hidden = false; toggle.setAttribute('aria-expanded', 'true'); field.focus(); buildIndex(); } else close(); });
    field.addEventListener('input', filter);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { close(); toggle.focus(); } });
  } }
ecosystem();
