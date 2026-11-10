/* Homepage world stage: atmosphere by local time, opt-in ambient sound, and the
   "Our Ecosystem" band built only from founder-declared site/data/worlds.json. */
const $ = (s) => document.querySelector(s);
const root = document.documentElement;

const ATMOS = ['dawn', 'day', 'sunset', 'night'];
const NAMES = { dawn: 'Dawn', day: 'Daylight', sunset: 'Sunset', night: 'Night' };
const hour = new Date().getHours();
let atmo = hour >= 5 && hour < 8 ? 'dawn' : hour >= 8 && hour < 17 ? 'day' : hour >= 17 && hour < 20 ? 'sunset' : 'night';
function setAtmo(next) {
  atmo = next;
  root.dataset.tod = next;
  const name = $('#atmoName'); if (name) name.textContent = NAMES[next];
}
setAtmo(atmo);
$('#atmo')?.addEventListener('click', () => setAtmo(ATMOS[(ATMOS.indexOf(atmo) + 1) % ATMOS.length]));

// Ambient sound: the shared engine plays a soundscape matched to the current atmosphere
// and crossfades when the atmosphere cycles (site/assets/ambience.mjs).
const amb = import('./ambience.mjs');
const soundBtn = $('#sound'), vol = $('#vol');
if (soundBtn) soundBtn.dataset.ambienceSwitch = '';
amb.then((m) => {
  if (vol) vol.value = Math.round(m.storedVolume() * 100);
  m.onAmbience((v) => soundBtn?.setAttribute('aria-checked', String(v)));
}).catch(() => {});
vol?.addEventListener('input', () => amb.then((m) => m.setVolume(+vol.value / 100)));
soundBtn?.addEventListener('click', async () => {
  const m = await amb; const next = soundBtn.getAttribute('aria-checked') !== 'true';
  if (!(await m.setAmbience(next))) soundBtn.setAttribute('aria-checked', 'false');
});

const BADGE = { "Se'kret Bip": 'SK' }; // founder mockup badge
const initials = (name) => BADGE[name] || name.replace(/[’']/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
// CLAUDE.md: a world links only when worlds.json declares a link and its front door is live.
// "Opening soon" worlds stay unlinked unless the founder confirmed the front door (Se'kret Bip, 2026-11-08).
const LIVE_FRONT_DOORS = new Set(["Se'kret Bip"]);
const linkable = (w) => w.link?.url && (w.st !== 'soon' || LIVE_FRONT_DOORS.has(w.name));
function tile(w) {
  const li = document.createElement('li'); li.className = 'eco-tile'; li.dataset.st = w.st || '';
  const inner = document.createElement(linkable(w) ? 'a' : 'div');
  if (linkable(w)) { inner.href = w.link.url; if (/^https?:/.test(w.link.url)) inner.rel = 'noopener noreferrer'; inner.setAttribute('aria-label', `${w.name}: ${w.label || ''}. ${w.link.text || 'Visit'}`); }
  const badge = document.createElement('span'); badge.className = 'eco-badge'; badge.setAttribute('aria-hidden', 'true'); badge.textContent = initials(w.name);
  const name = document.createElement('strong'); name.textContent = w.name;
  const status = document.createElement('small'); status.textContent = w.label || 'Status pending';
  inner.append(badge, name, status); li.append(inner); return li;
}
async function ecosystem() {
  const track = $('#ecoTrack'); if (!track) return;
  try {
    const data = await (await fetch('/data/worlds.json', { cache: 'no-cache' })).json();
    track.replaceChildren(...(data.worlds || []).map(tile));
  } catch {
    track.innerHTML = '<li class="eco-loading">The ecosystem is unavailable right now. <a href="/portfolio.html">Open the portfolio</a>.</li>';
  }
  const page = (dir) => track.scrollBy({ left: dir * track.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  $('#ecoPrev')?.addEventListener('click', () => page(-1));
  $('#ecoNext')?.addEventListener('click', () => page(1));
}
ecosystem();
