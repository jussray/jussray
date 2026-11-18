/* Shared Adaptive Atmosphere (founder mockup, 2026-11-18).
   The site follows the visitor's season and the holidays on its own. Visitors may also
   choose a season, colour mood and intensity, switch holidays or motion off, and their
   choice is kept only in their own browser. Reduced-motion system settings always win. */
const southernZones = /^(Australia\/(?!Darwin)|Pacific\/(Auckland|Chatham)|America\/(Argentina\/|Buenos_Aires|Santiago|Montevideo)|Africa\/(Johannesburg|Maseru|Mbabane))/;
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
export const MOODS = ['violet', 'rose', 'amber', 'emerald', 'sky'];
export const DEFAULT_PREFS = Object.freeze({ adaptive: true, season: 'auto', mood: 'violet', intensity: 70, holidays: true, reduceMotion: false });
const KEY = 'jc-atmosphere-v1';
const LABEL = { spring: 'Spring', summer: 'Summer', autumn: 'Autumn', winter: 'Winter', halloween: 'Halloween', 'winter-lights': 'Christmas', 'new-year': "New Year's" };

export function seasonFor(date = new Date(), zone = Intl.DateTimeFormat().resolvedOptions().timeZone || '') {
  const month = date.getMonth();
  let index = month === 11 || month < 2 ? 0 : month < 5 ? 1 : month < 8 ? 2 : 3;
  if (southernZones.test(zone)) index = (index + 2) % 4;
  return ['winter','spring','summer','autumn'][index];
}
export function holidayFor(date = new Date()) {
  const m = date.getMonth() + 1, d = date.getDate();
  if (m === 10 && d === 31) return 'halloween';
  if (m === 12 && d >= 20 && d <= 26) return 'winter-lights';
  if (m === 12 && d >= 31 || m === 1 && d === 1) return 'new-year';
  return '';
}
/* Turns stored preferences into what the page shows. Bad or tampered values fall back to defaults. */
export function cleanPrefs(raw) {
  const p = { ...DEFAULT_PREFS };
  if (raw && typeof raw === 'object') {
    if (typeof raw.adaptive === 'boolean') p.adaptive = raw.adaptive;
    if (raw.season === 'auto' || SEASONS.includes(raw.season)) p.season = raw.season;
    if (MOODS.includes(raw.mood)) p.mood = raw.mood;
    if (Number.isFinite(raw.intensity)) p.intensity = Math.min(100, Math.max(0, Math.round(raw.intensity)));
    if (typeof raw.holidays === 'boolean') p.holidays = raw.holidays;
    if (typeof raw.reduceMotion === 'boolean') p.reduceMotion = raw.reduceMotion;
  }
  return p;
}
export function resolveAtmosphere(prefs = DEFAULT_PREFS, date = new Date(), zone = '') {
  const p = cleanPrefs(prefs);
  const season = p.season === 'auto' ? seasonFor(date, zone) : p.season;
  const holiday = p.adaptive && p.holidays ? holidayFor(date) : '';
  return { season, holiday, mood: p.mood, intensity: p.intensity / 100, reduceMotion: p.reduceMotion, label: LABEL[holiday || season] };
}
function loadPrefs() { try { return cleanPrefs(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch { return { ...DEFAULT_PREFS }; } }
function savePrefs(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private window: keep the choice for this visit only */ } }

const COLORS = {
  spring: 'rgba(255,204,224,A)', summer: 'rgba(255,222,141,A)', autumn: 'rgba(255,170,80,A)', winter: 'rgba(239,247,255,A)',
  halloween: ['rgba(255,140,40,A)', 'rgba(170,110,255,A)'], 'winter-lights': ['rgba(255,226,157,A)', 'rgba(255,90,90,A)', 'rgba(120,220,140,A)'],
  'new-year': ['rgba(255,226,157,A)', 'rgba(255,120,220,A)', 'rgba(120,200,255,A)']
};
const MOOD_GLOW = { violet: '150,95,255', rose: '255,95,150', amber: '255,170,60', emerald: '60,200,140', sky: '80,160,255' };

export function startAtmosphere() {
  const root = document.documentElement;
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  const canvas = document.createElement('canvas');
  canvas.className = 'world-atmosphere';
  canvas.setAttribute('aria-hidden', 'true');
  const context = canvas.getContext('2d');
  if (!context) return;
  document.body.append(canvas);
  const systemReduced = matchMedia('(prefers-reduced-motion: reduce)');
  let prefs = loadPrefs(), state = resolveAtmosphere(prefs, new Date(), zone);
  let width = 0, height = 0, particles = [], frame = 0, last = 0, day = '';
  const still = () => systemReduced.matches || prefs.reduceMotion;
  function resize() {
    width = innerWidth; height = innerHeight;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const base = Math.min(width < 700 ? 12 : 22, Math.max(8, Math.floor(width / 65)));
    const count = Math.round(base * (0.35 + state.intensity));
    particles = Array.from({length: count}, (_, i) => ({x: Math.random()*width, y: Math.random()*height, r: 1.5+Math.random()*3, s: .25+Math.random()*.55, phase: Math.random()*6.28, tone: i}));
  }
  function apply() {
    state = resolveAtmosphere(prefs, new Date(), zone);
    root.dataset.season = state.season;
    if (state.holiday) root.dataset.holiday = state.holiday; else delete root.dataset.holiday;
    root.dataset.mood = state.mood;
    root.style.setProperty('--atmo-intensity', String(state.intensity));
    if (prefs.reduceMotion) root.dataset.motion = 'reduced'; else delete root.dataset.motion;
    canvas.style.opacity = String(0.2 + state.intensity * 0.55);
    document.dispatchEvent(new CustomEvent('atmosphere:change', { detail: { ...state } }));
  }
  function environment() {
    const nextDay = new Date().toDateString();
    if (nextDay === day) return;
    day = nextDay; apply();
  }
  function colour(p, alpha) {
    const c = COLORS[state.holiday] || COLORS[state.season];
    return (Array.isArray(c) ? c[p.tone % c.length] : c).replace('A', alpha);
  }
  function glow() {
    const rgb = MOOD_GLOW[state.mood], a = (0.1 * state.intensity).toFixed(3);
    const g = context.createRadialGradient(width/2, height*0.45, Math.min(width, height)*0.25, width/2, height*0.45, Math.max(width, height)*0.75);
    g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(1, `rgba(${rgb},${a})`);
    context.fillStyle = g; context.fillRect(0, 0, width, height);
  }
  function draw(time) {
    context.clearRect(0,0,width,height); glow();
    for (const p of particles) {
      context.fillStyle = colour(p, state.holiday ? .7 : state.season === 'summer' ? .32 : .55);
      context.beginPath();
      if (state.season === 'autumn' || state.season === 'spring') context.ellipse(p.x,p.y,p.r,p.r*.48,time/2500+p.phase,0,Math.PI*2);
      else context.arc(p.x,p.y,p.r*(state.season === 'summer' ? .45 : .7),0,Math.PI*2);
      context.fill();
    }
  }
  function tick(time) {
    frame = 0;
    if (document.hidden || still()) return;
    frame = requestAnimationFrame(tick);
    if (time - last < 40) return;
    last = time; environment();
    for (const p of particles) {
      p.y += p.s; p.x += Math.sin(time/1800+p.phase)*.27;
      if (p.y > height+10) {p.y=-10; p.x=Math.random()*width;}
      if (p.x < -10) p.x=width+10; else if (p.x>width+10) p.x=-10;
    }
    draw(time);
  }
  function sync() {
    cancelAnimationFrame(frame); frame = 0;
    environment();
    if (still()) { context.clearRect(0,0,width,height); glow(); return; }
    if (!document.hidden) frame = requestAnimationFrame(tick);
  }
  function update(next) { prefs = cleanPrefs({ ...prefs, ...next }); savePrefs(prefs); apply(); resize(); sync(); render(); }

  /* Settings panel: opened by any [data-atmo-settings] control, or the button added beside the atmosphere card. */
  if (!document.querySelector('link[href$="/assets/atmosphere.css"]')) {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = '/assets/atmosphere.css'; document.head.append(css);
  }
  const panel = document.createElement('div');
  panel.className = 'atmo-panel'; panel.hidden = true;
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-labelledby', 'atmoPanelTitle');
  panel.innerHTML = `<div class="atmo-sheet">
  <div class="atmo-head"><h2 id="atmoPanelTitle">Adaptive Atmosphere</h2><button type="button" class="atmo-x" data-close aria-label="Close">×</button></div>
  <p class="atmo-lede">A living experience that adapts on its own to the season and the holidays, and to your own style.</p>
  <p class="atmo-now" aria-live="polite"></p>
  <label class="atmo-row"><span><b>Adaptive Theme</b><small>Change with the season and holidays automatically</small></span><input type="checkbox" role="switch" data-k="adaptive"></label>
  <label class="atmo-field"><b>Preferred Season</b><select data-k="season"><option value="auto">Auto (Recommended)</option><option value="spring">Spring</option><option value="summer">Summer</option><option value="autumn">Autumn</option><option value="winter">Winter</option></select></label>
  <fieldset class="atmo-field"><legend><b>Colour Mood</b></legend><div class="atmo-moods">${MOODS.map(m => `<button type="button" class="atmo-mood" data-mood="${m}" aria-label="${m[0].toUpperCase()+m.slice(1)}" aria-pressed="false"></button>`).join('')}</div></fieldset>
  <label class="atmo-field"><b>Visual Intensity</b><input type="range" min="0" max="100" step="5" data-k="intensity"></label>
  <label class="atmo-row"><span><b>Holiday Themes</b><small>Halloween, Christmas and New Year's</small></span><input type="checkbox" role="switch" data-k="holidays"></label>
  <label class="atmo-row"><span><b>Reduce Motion</b><small>Stills the falling petals, leaves and snow</small></span><input type="checkbox" role="switch" data-k="reduceMotion"></label>
  <fieldset class="atmo-field"><legend><b>Theme Preview</b></legend><div class="atmo-previews">${SEASONS.map(s => `<button type="button" class="atmo-preview" data-season="${s}" aria-pressed="false">${LABEL[s]}</button>`).join('')}</div></fieldset>
  <p class="atmo-note">Seasonal scene paintings are on their way. Today a season changes the falling petals, leaves or snow and the colour glow. Your choices stay in this browser only.</p>
</div>`;
  document.body.append(panel);
  const $ = (s) => panel.querySelector(s);
  let opener = null;
  function render() {
    $('[data-k=adaptive]').checked = prefs.adaptive;
    $('[data-k=season]').value = prefs.season;
    $('[data-k=intensity]').value = String(prefs.intensity);
    $('[data-k=holidays]').checked = prefs.holidays;
    $('[data-k=holidays]').disabled = !prefs.adaptive;
    $('[data-k=reduceMotion]').checked = prefs.reduceMotion;
    panel.querySelectorAll('.atmo-mood').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mood === prefs.mood)));
    panel.querySelectorAll('.atmo-preview').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.season === state.season)));
    $('.atmo-now').textContent = `Now showing: ${state.label}${prefs.season === 'auto' ? ' (automatic)' : ' (your choice)'}`;
  }
  panel.addEventListener('change', (e) => {
    const k = e.target.dataset.k; if (!k) return;
    update({ [k]: e.target.type === 'checkbox' ? e.target.checked : k === 'intensity' ? Number(e.target.value) : e.target.value });
  });
  panel.addEventListener('click', (e) => {
    if (e.target === panel || e.target.closest('[data-close]')) return close();
    const mood = e.target.closest('.atmo-mood'); if (mood) return update({ mood: mood.dataset.mood });
    const prev = e.target.closest('.atmo-preview'); if (prev) return update({ season: prev.dataset.season });
  });
  panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  function open(from) { opener = from || document.activeElement; render(); panel.hidden = false; $('[data-k=adaptive]').focus(); }
  function close() { panel.hidden = true; if (opener && opener.focus) opener.focus(); }
  document.addEventListener('click', (e) => { const t = e.target.closest('[data-atmo-settings]'); if (t) { e.preventDefault(); open(t); } });
  const card = document.querySelector('#atmo, #atmo-cycle, [data-atmo-card]');
  if (card && !document.querySelector('[data-atmo-settings]')) {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'atmo-settings-btn'; btn.dataset.atmoSettings = '';
    btn.setAttribute('aria-label', 'Adaptive Atmosphere settings'); btn.setAttribute('aria-haspopup', 'dialog');
    btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6z"/></svg><span>Adaptive</span>';
    card.insertAdjacentElement('afterend', btn);
  }

  resize(); apply(); sync();
  addEventListener('resize', resize, {passive:true});
  document.addEventListener('visibilitychange', sync);
  if (systemReduced.addEventListener) systemReduced.addEventListener('change',sync); else systemReduced.addListener(sync);
}
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',startAtmosphere,{once:true}); else startAtmosphere();
}
