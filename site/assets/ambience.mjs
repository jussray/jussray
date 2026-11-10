/* Juss & Co ambience: one generated soundscape per atmosphere (dawn, day, sunset, night).
   Every sound is synthesized in the browser: no audio files, no third-party assets.
   Off by default. Sound starts only on a user gesture; a visitor's on/off and volume
   are remembered on this device and re-armed on their next gesture, never autoplayed. */
const KEY = 'jc-ambience';
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
const write = (v) => { try { localStorage.setItem(KEY, JSON.stringify({ ...read(), ...v })); } catch { /* storage blocked */ } };

const SCENES = {
  //        pad chord (Hz)                       pad filter  water  events
  dawn:   { chord: [146.83, 220, 293.66, 369.99], cut: 1100, water: 0.55, events: ['bird', 'bird', 'chime'], every: [1400, 3600] },
  day:    { chord: [196, 246.94, 293.66, 392],    cut: 1500, water: 0.7,  events: ['bird', 'bird', 'bird', 'breeze'], every: [1200, 3200] },
  sunset: { chord: [155.56, 196, 233.08, 293.66], cut: 800,  water: 0.8,  events: ['chime', 'breeze', 'bird'], every: [2600, 5600] },
  night:  { chord: [110, 164.81, 220, 246.94],    cut: 560,  water: 0.6,  events: ['crickets', 'crickets', 'chime'], every: [1800, 4200] },
};
export const sceneNames = Object.keys(SCENES);

export function currentScene() {
  const r = document.documentElement, b = document.body;
  const s = r.dataset.tod || b?.dataset.atmo || b?.dataset.atmosphere;
  if (SCENES[s]) return s;
  const h = new Date().getHours();
  return h >= 5 && h < 8 ? 'dawn' : h >= 8 && h < 17 ? 'day' : h >= 17 && h < 20 ? 'sunset' : 'night';
}

let ctx = null, master = null, noise = null, layer = null, timer = 0, on = false, scene = '', busy = false, sleepTimer = 0;
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn(on));
const rand = (a, b) => a + Math.random() * (b - a);
const level = () => { const v = read().vol; return (Number.isFinite(v) ? v : 0.4) * 0.5; };

function noiseBuffer() {
  // Brown noise: soft, low, reads as water and wind rather than hiss.
  const len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
  return buf;
}
function noiseSource() { const s = ctx.createBufferSource(); s.buffer = noise; s.loop = true; s.start(0, Math.random() * 3); return s; }

function buildLayer(name) {
  const cfg = SCENES[name], out = ctx.createGain(), nodes = [];
  out.gain.value = 0; out.connect(master);
  // Pad: a slow, detuned chord breathing through a low-pass filter.
  const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = cfg.cut; filter.connect(out);
  const lfo = ctx.createOscillator(), lfoAmt = ctx.createGain(); lfo.frequency.value = 0.05; lfoAmt.gain.value = cfg.cut * 0.25;
  lfo.connect(lfoAmt); lfoAmt.connect(filter.frequency); lfo.start(); nodes.push(lfo);
  cfg.chord.forEach((f, i) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = i % 2 ? 'sine' : 'triangle'; o.frequency.value = f; o.detune.value = (i - 1.5) * 4;
    g.gain.value = 0.05; o.connect(g); g.connect(filter); o.start(); nodes.push(o);
  });
  // Lake: filtered noise whose level rises and falls like small waves.
  const water = noiseSource(), wf = ctx.createBiquadFilter(), wg = ctx.createGain(), wl = ctx.createOscillator(), wla = ctx.createGain();
  wf.type = 'lowpass'; wf.frequency.value = 420; wg.gain.value = 0.11 * cfg.water;
  wl.frequency.value = 0.13; wla.gain.value = 0.07 * cfg.water; wl.connect(wla); wla.connect(wg.gain); wl.start();
  water.connect(wf); wf.connect(wg); wg.connect(out); nodes.push(water, wl);
  return { name, out, nodes };
}

// One-shot nature events, scheduled on the active layer only.
const EVENTS = {
  bird(dest, t) {
    const base = rand(2600, 4200), notes = 2 + Math.floor(Math.random() * 4), pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (pan) { pan.pan.value = rand(-0.8, 0.8); pan.connect(dest); }
    for (let i = 0; i < notes; i++) {
      const o = ctx.createOscillator(), g = ctx.createGain(), s = t + i * rand(0.09, 0.16), d = rand(0.05, 0.11);
      o.type = 'sine'; o.frequency.setValueAtTime(base * rand(0.9, 1.1), s); o.frequency.exponentialRampToValueAtTime(base * rand(1.15, 1.5), s + d);
      g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(0.035, s + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, s + d);
      o.connect(g); g.connect(pan || dest); o.start(s); o.stop(s + d + 0.02);
    }
  },
  crickets(dest, t) {
    const o = ctx.createOscillator(), g = ctx.createGain(), f = rand(4300, 4800), chirps = 3 + Math.floor(Math.random() * 4);
    o.type = 'sine'; o.frequency.value = f; g.gain.value = 0.0001; o.connect(g); g.connect(dest);
    for (let i = 0; i < chirps; i++) { const s = t + i * 0.07; g.gain.setValueAtTime(0.0001, s); g.gain.linearRampToValueAtTime(0.018, s + 0.012); g.gain.linearRampToValueAtTime(0.0001, s + 0.045); }
    o.start(t); o.stop(t + chirps * 0.07 + 0.05);
  },
  chime(dest, t) {
    const pent = [523.25, 587.33, 659.25, 783.99, 880], f = pent[Math.floor(Math.random() * pent.length)] / (scene === 'night' ? 2 : 1);
    [1, 2.01].forEach((m, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f * m; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(i ? 0.008 : 0.03, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
      o.connect(g); g.connect(dest); o.start(t); o.stop(t + 3.3);
    });
  },
  breeze(dest, t) {
    const s = noiseSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), d = rand(3, 5);
    f.type = 'bandpass'; f.Q.value = 0.8; f.frequency.setValueAtTime(500, t); f.frequency.linearRampToValueAtTime(1100, t + d / 2); f.frequency.linearRampToValueAtTime(600, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05, t + d / 2); g.gain.linearRampToValueAtTime(0.0001, t + d);
    s.connect(f); f.connect(g); g.connect(dest); s.stop(t + d + 0.1);
  },
};
function schedule() {
  clearTimeout(timer);
  if (!on || !layer) return;
  const cfg = SCENES[layer.name];
  EVENTS[cfg.events[Math.floor(Math.random() * cfg.events.length)]](layer.out, ctx.currentTime + 0.05);
  timer = setTimeout(schedule, rand(...cfg.every));
}

function crossfade(name) {
  if (!ctx || name === layer?.name) return;
  const old = layer, now = ctx.currentTime;
  layer = buildLayer(name); scene = name;
  layer.out.gain.setTargetAtTime(1, now, 0.8);
  if (old) { old.out.gain.setTargetAtTime(0, now, 0.6); setTimeout(() => { old.nodes.forEach((n) => { try { n.stop(); } catch {} }); old.out.disconnect(); }, 4000); }
}

// Off or hidden: fade, then suspend the context so nothing renders in the background.
function sleep() { clearTimeout(sleepTimer); sleepTimer = setTimeout(() => { if (ctx && (!on || document.hidden)) ctx.suspend().catch(() => {}); }, 1500); }

export async function setAmbience(next) {
  disarm(); // any explicit choice cancels a remembered-on resume
  if (busy) return on === !!next;
  busy = true;
  try { return await apply(next); } finally { busy = false; }
}
async function apply(next) {
  if (next && !ctx) {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination); noise = noiseBuffer();
  }
  if (!ctx) { on = false; emit(); return false; }
  try { if (next) await ctx.resume(); } catch { return false; }
  on = !!next;
  if (on) crossfade(currentScene());
  master.gain.setTargetAtTime(on ? level() : 0, ctx.currentTime, 0.5);
  if (on) clearTimeout(sleepTimer); else sleep();
  write({ on }); schedule(); emit();
  return true;
}
export function setVolume(v) {
  write({ vol: Math.max(0, Math.min(1, v)) });
  if (ctx && on) master.gain.setTargetAtTime(level(), ctx.currentTime, 0.2);
}
export const storedVolume = () => { const v = read().vol; return Number.isFinite(v) ? v : 0.4; };
export const isOn = () => on;
/* Read-only state for browser checks: whether sound is on, the context state, and the playing scene. */
export const ambienceState = () => ({ on, context: ctx?.state || 'none', scene: on ? layer?.name || '' : '' });
export function onAmbience(fn) { listeners.add(fn); return () => listeners.delete(fn); }

// Follow the page's atmosphere: crossfade when the homepage cycles it or time moves on.
const follow = () => { if (on) crossfade(currentScene()); };
new MutationObserver(follow).observe(document.documentElement, { attributes: true, attributeFilter: ['data-tod'] });
const watchBody = () => document.body && new MutationObserver(follow).observe(document.body, { attributes: true, attributeFilter: ['data-atmo', 'data-atmosphere'] });
if (document.body) watchBody(); else document.addEventListener('DOMContentLoaded', watchBody, { once: true });
setInterval(follow, 60000);
// Hidden tab: fade out and stop the event clock; back again: fade in if the visitor left it on.
document.addEventListener('visibilitychange', () => {
  if (!ctx || !on) return;
  master.gain.setTargetAtTime(document.hidden ? 0 : level(), ctx.currentTime, 0.2);
  if (document.hidden) { clearTimeout(timer); sleep(); } else { clearTimeout(sleepTimer); ctx.resume().catch(() => {}); schedule(); }
});
// Remembered "on": resume on the visitor's next gesture, but only on a page that shows an ambience
// switch wired to this engine (armRemembered is called by that switch's owner), and never through
// the switch itself. Gestures that browsers treat as activation: pointerup, touchend, keydown.
const GESTURES = ['pointerup', 'touchend', 'keydown'];
let arm = null;
function disarm() { if (arm) { GESTURES.forEach((t) => removeEventListener(t, arm, true)); arm = null; } }
export function armRemembered() {
  if (arm || on || !read().on) return;
  arm = (e) => { if (e.target?.closest?.('[data-ambience-switch]')) return; disarm(); setAmbience(true); };
  GESTURES.forEach((t) => addEventListener(t, arm, true));
}

/* Floating control for pages without their own ambience panel. */
export function mountAmbienceControl() {
  if (document.querySelector('#sound, #ambient-toggle, .amb-float')) return null;
  if (!document.querySelector('link[href$="/assets/atmosphere.css"]')) {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = '/assets/atmosphere.css'; document.head.append(css);
  }
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'amb-float'; btn.dataset.ambienceSwitch = '';
  btn.setAttribute('aria-pressed', 'false');
  btn.innerHTML = '<span class="amb-bars" aria-hidden="true"><i></i><i></i><i></i></span><span class="amb-text">Ambient sound <b>Off</b></span>';
  const label = btn.querySelector('b');
  const render = (v) => { btn.setAttribute('aria-pressed', String(v)); label.textContent = v ? 'On' : 'Off'; };
  btn.addEventListener('click', async () => { if (!(await setAmbience(!on))) render(false); });
  onAmbience(render);
  document.body.append(btn);
  armRemembered();
  return btn;
}
