/* Homepage world stage: atmosphere by local time, opt-in ambient sound, and the
   "Our Ecosystem" band built only from founder-declared site/data/worlds.json. */
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


let audio, gain;
function startSound() {
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
  audio = new AC(); gain = audio.createGain(); gain.gain.value = 0; gain.connect(audio.destination);
  const filter = audio.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 900; filter.connect(gain);
  [196, 246.94, 293.66, 392].forEach((f, i) => { const o = audio.createOscillator(); o.type = i % 2 ? 'sine' : 'triangle'; o.frequency.value = f; o.detune.value = (i - 1.5) * 4; const g = audio.createGain(); g.gain.value = 0.06; o.connect(g); g.connect(filter); o.start(); });
  return true;
}
const level = () => (+($('#vol')?.value ?? 40) / 100) * 0.5;
$('#vol')?.addEventListener('input', () => { if (audio && $('#sound').getAttribute('aria-checked') === 'true') gain.gain.setTargetAtTime(level(), audio.currentTime, 0.2); });
$('#sound')?.addEventListener('click', async () => {
  const btn = $('#sound'); const on = btn.getAttribute('aria-checked') !== 'true';
  if (on && !audio && !startSound()) return;
  if (audio) { await audio.resume(); gain.gain.setTargetAtTime(on ? level() : 0, audio.currentTime, 0.4); }
  btn.setAttribute('aria-checked', String(on));
});

const BADGE = { "Se'kret Bip": 'SK' }; // founder mockup badge
document.addEventListener('visibilitychange', () => { if (document.hidden && audio && $('#sound')?.getAttribute('aria-checked') === 'true') { gain.gain.setTargetAtTime(0, audio.currentTime, 0.1); $('#sound').setAttribute('aria-checked', 'false'); } });
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
  const dots = $('#ecoDots');
  if (dots) { dots.replaceChildren(...Array.from({ length: 4 }, () => document.createElement('i')));
    const upd = () => { const max = track.scrollWidth - track.clientWidth, k = max > 0 ? Math.round(track.scrollLeft / max * 3) : 0; [...dots.children].forEach((d, j) => d.classList.toggle('on', j === k)); };
    track.addEventListener('scroll', upd, { passive: true }); upd(); }
}
// Header search filters the ecosystem band (worlds.json names and labels only).
{ const toggle = $('#home-search-toggle'), panel = $('#home-search'), field = $('#home-search-input'), status = $('#home-search-status');
  const close = () => { panel.hidden = true; toggle.setAttribute('aria-expanded', 'false'); field.value = ''; filter(); };
  function filter() { const q = field.value.trim().toLowerCase(); let n = 0;
    document.querySelectorAll('#ecoTrack .eco-tile').forEach((li) => { const hit = !q || li.textContent.toLowerCase().includes(q); li.hidden = !hit; if (hit) n++; });
    status.textContent = q ? (n ? `${n} match${n === 1 ? '' : 'es'} in Our Ecosystem.` : `Nothing in Our Ecosystem matches "${field.value.trim()}".`) : ''; }
  if (toggle && panel && field) {
    toggle.addEventListener('click', () => { if (panel.hidden) { panel.hidden = false; toggle.setAttribute('aria-expanded', 'true'); field.focus(); } else close(); });
    field.addEventListener('input', filter);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { close(); toggle.focus(); } });
  } }
ecosystem();
