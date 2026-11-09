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
}
ecosystem();
