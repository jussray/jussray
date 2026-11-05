/* Shared visual atmosphere; public visitors cannot choose a season. */
const southernZones = /^(Australia\/(?!Darwin)|Pacific\/(Auckland|Chatham)|America\/(Argentina\/|Santiago|Montevideo)|Africa\/(Johannesburg|Maseru|Mbabane))/;
export function seasonFor(date = new Date(), zone = Intl.DateTimeFormat().resolvedOptions().timeZone || '') {
  const month = date.getMonth();
  let index = month === 11 || month < 2 ? 0 : month < 5 ? 1 : month < 8 ? 2 : 3;
  if (southernZones.test(zone)) index = (index + 2) % 4;
  return ['winter','spring','summer','autumn'][index];
}
export function holidayFor(date = new Date()) {
  const m = date.getMonth() + 1, d = date.getDate();
  if (m === 12 && d >= 20 && d <= 26) return 'winter-lights';
  if (m === 12 && d >= 31 || m === 1 && d === 1) return 'new-year';
  return '';
}
export function startAtmosphere() {
  const root = document.documentElement;
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  const canvas = document.createElement('canvas');
  canvas.className = 'world-atmosphere';
  canvas.setAttribute('aria-hidden', 'true');
  const context = canvas.getContext('2d');
  if (!context) return;
  document.body.append(canvas);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0, height = 0, particles = [], frame = 0, last = 0, day = '';
  function resize() {
    width = innerWidth; height = innerHeight;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = Math.min(width < 700 ? 12 : 22, Math.max(8, Math.floor(width / 65)));
    particles = Array.from({length: count}, () => ({x: Math.random()*width,y:Math.random()*height,r:1.5+Math.random()*3,s:.25+Math.random()*.55, phase:Math.random()*6.28}));
  }
  function environment() {
    const date = new Date(), nextDay = date.toDateString();
    if (nextDay === day) return;
    day = nextDay; root.dataset.season = seasonFor(date, zone);
    const holiday = holidayFor(date);
    if (holiday) root.dataset.holiday = holiday; else delete root.dataset.holiday;
  }
  function tick(time) {
    frame = 0;
    if (document.hidden || reduced.matches) return;
    frame = requestAnimationFrame(tick);
    if (time - last < 40) return;
    last = time; environment(); context.clearRect(0,0,width,height);
    const season = root.dataset.season, holiday = root.dataset.holiday;
    for (const p of particles) {
      p.y += p.s; p.x += Math.sin(time/1800+p.phase)*.27;
      if (p.y > height+10) {p.y=-10; p.x=Math.random()*width;}
      if (p.x < -10) p.x=width+10; else if (p.x>width+10) p.x=-10;
      context.fillStyle = holiday && p.r < 3 ? 'rgba(255,226,157,.65)' : season === 'winter' ? 'rgba(239,247,255,.6)' : season === 'spring' ? 'rgba(255,204,224,.5)' : season === 'summer' ? 'rgba(255,222,141,.32)' : 'rgba(255,178,91,.5)';
      context.beginPath();
      if (season === 'autumn' || season === 'spring') context.ellipse(p.x,p.y,p.r,p.r*.48,time/2500+p.phase,0,Math.PI*2);
      else context.arc(p.x,p.y,p.r*(season === 'summer' ? .45 : .7),0,Math.PI*2);
      context.fill();
    }
  }
  function sync() {
    cancelAnimationFrame(frame); frame = 0; context.clearRect(0,0,width,height);
    environment();
    if (!document.hidden && !reduced.matches) frame = requestAnimationFrame(tick);
  }
  resize(); environment(); sync();
  addEventListener('resize', resize, {passive:true});
  document.addEventListener('visibilitychange', sync);
  if (reduced.addEventListener) reduced.addEventListener('change',sync); else reduced.addListener(sync);
}
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',startAtmosphere,{once:true}); else startAtmosphere();
}
