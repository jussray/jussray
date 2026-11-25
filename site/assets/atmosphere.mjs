/* Shared visual atmosphere; public visitors cannot choose a season. */
const southernZones = /^(Australia\/(?!Darwin)|Pacific\/(Auckland|Chatham)|America\/(Argentina\/|Buenos_Aires|Santiago|Montevideo)|Africa\/(Johannesburg|Maseru|Mbabane))/;
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

export function timePhase(date = new Date(), zone) {
  const h = zone ? Number(new Intl.DateTimeFormat('en-GB', {timeZone:zone,hour:'numeric',hourCycle:'h23'}).format(date)) : date.getHours();
  return h >= 5 && h < 8 ? 'dawn' : h >= 8 && h < 17 ? 'day' : h >= 17 && h < 20 ? 'sunset' : 'night';
}
// Approximate solar elevation: NOAA GML solar position equations; no remote request.
// https://gml.noaa.gov/grad/solcalc/solareqns.PDF
export function solarPhase(date, coords) {
  if (!coords || !Number.isFinite(coords.latitude) || !Number.isFinite(coords.longitude) || Math.abs(coords.latitude)>90 || Math.abs(coords.longitude)>180) return null;
  const rad=Math.PI/180, year=date.getUTCFullYear(), start=Date.UTC(year,0,1), days=(Date.UTC(year+1,0,1)-start)/86400000;
  const gamma=2*Math.PI/days*((+date-start)/86400000-.5);
  const e=229.18*(.000075+.001868*Math.cos(gamma)-.032077*Math.sin(gamma)-.014615*Math.cos(2*gamma)-.040849*Math.sin(2*gamma));
  const dec=.006918-.399912*Math.cos(gamma)+.070257*Math.sin(gamma)-.006758*Math.cos(2*gamma)+.000907*Math.sin(2*gamma)-.002697*Math.cos(3*gamma)+.00148*Math.sin(3*gamma);
  const minutes=date.getUTCHours()*60+date.getUTCMinutes()+date.getUTCSeconds()/60;
  const hour=(((minutes+e+4*coords.longitude)%1440+1440)%1440)/4-180;
  const lat=coords.latitude*rad;
  const elevation=Math.asin(Math.max(-1,Math.min(1,Math.sin(lat)*Math.sin(dec)+Math.cos(lat)*Math.cos(dec)*Math.cos(hour*rad))))/rad;
  return elevation>6?'day':elevation>=-6?(hour<0?'dawn':'sunset'):'night';
}
export function regionalEvent(date, region) {
  const m=date.getMonth()+1,d=date.getDate();
  if(m===1&&d===1||m===12&&d===31)return 'new-year';
  if (region==='US'&&m===7&&d===4) return 'independence-day';
  if (region==='CA'&&m===7&&d===1) return 'canada-day';
  if (region==='FR'&&m===7&&d===14) return 'national-day';
  if (region==='DE'&&m===10&&d===3) return 'unity-day';
  if (region==='JP'&&m===2&&d===11) return 'foundation-day';
  if (['US','CA','GB','FR','DE','AU','NZ','ES','PT','BR','MX'].includes(region)&&m===12&&d>=20&&d<=26) return 'winter-lights';
  return '';
}
export function formatLocalDateTime(date, locale, timeZone) {
  return new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeStyle:'short',...(timeZone?{timeZone}:{})}).format(date);
}
const localeLabels = {"en":["Dawn","Daylight","Sunset","Night","Local time","Use local daylight","Use clock only","Location unavailable; using clock","Preview for one minute","Current Atmosphere","Home","Portfolio","Products","Games","Solutions","Our Work","Ideas","Founder","Contact"],"es":["Amanecer","Luz del día","Atardecer","Noche","Hora local","Usar luz solar local","Usar solo el reloj","Ubicación no disponible; se usa el reloj","Vista previa durante un minuto","Atmósfera actual","Inicio","Portafolio","Productos","Juegos","Soluciones","Nuestro trabajo","Ideas","Fundador","Contacto"],"fr":["Aube","Jour","Crépuscule","Nuit","Heure locale","Utiliser la lumière solaire locale","Utiliser l’horloge uniquement","Position indisponible ; horloge utilisée","Aperçu pendant une minute","Atmosphère actuelle","Accueil","Portfolio","Produits","Jeux","Solutions","Nos réalisations","Idées","Fondateur","Contact"],"de":["Morgendämmerung","Tageslicht","Abenddämmerung","Nacht","Ortszeit","Lokales Sonnenlicht verwenden","Nur Uhr verwenden","Standort nicht verfügbar; Uhr wird verwendet","Eine Minute Vorschau","Aktuelle Atmosphäre","Startseite","Portfolio","Produkte","Spiele","Lösungen","Unsere Arbeit","Ideen","Gründer","Kontakt"],"pt":["Amanhecer","Luz do dia","Anoitecer","Noite","Hora local","Usar luz solar local","Usar apenas o relógio","Localização indisponível; usando o relógio","Prévia por um minuto","Atmosfera atual","Início","Portfólio","Produtos","Jogos","Soluções","Nosso trabalho","Ideias","Fundador","Contato"],"ja":["夜明け","昼","夕暮れ","夜","現地時刻","現地の日照を使用","時計のみ使用","位置情報なし・時計を使用","1分間のプレビュー","現在の雰囲気","ホーム","ポートフォリオ","製品","ゲーム","ソリューション","実績","アイデア","創業者","お問い合わせ"],"ar":["الفجر","النهار","الغروب","الليل","الوقت المحلي","استخدام ضوء الشمس المحلي","استخدام الساعة فقط","الموقع غير متاح؛ تُستخدم الساعة","معاينة لمدة دقيقة","الأجواء الحالية","الرئيسية","الأعمال","المنتجات","الألعاب","الحلول","أعمالنا","الأفكار","المؤسس","اتصل بنا"]};
export function createTimeState(resolve = timePhase) {
  const phases = ['dawn','day','sunset','night'];
  let preview = null;
  function read(date = new Date()) {
    const actual = resolve(date);
    if (preview && (preview.actual !== actual || +date >= preview.until || +date < preview.from)) preview = null;
    return preview ? preview.phase : actual;
  }
  return {read, cycle(date = new Date()) {
    const next = phases[(phases.indexOf(read(date))+1)%phases.length];
    preview = {phase:next,actual:resolve(date),from:+date,until:+date+60000};
    return next;
  }};
}
// Device locale is a preference, not proof of a country. Coordinates are optional,
// retained in memory only, and never transmitted or persisted by this module.
function startLocalTime() {
  const root = document.documentElement;
  const locale = navigator.languages?.[0] || navigator.language || 'en';
  let language = 'en', region = '';
  try { const l = new Intl.Locale(locale); language = l.language; region = l.region || ''; } catch {}
  if (!localeLabels[language]) language = 'en';
  const labels = localeLabels[language], phases = ['dawn','day','sunset','night'];
  let coords = null, pending = false, request = 0, unavailable = false, lastMinute = '';
  const state = createTimeState(date => solarPhase(date, coords) || timePhase(date));
  // Preserve English page language for untranslated editorial copy.
  const localize = (el, text) => { if (el.textContent !== text) el.textContent = text; el.lang = language; el.dir = 'auto'; };
  const navNames = localeLabels.en.slice(10);
  function localizeNavigation() {
    for (const el of document.querySelectorAll('header nav a, .ws-nav a')) {
      const i = navNames.indexOf(el.textContent.trim());
      if (i >= 0) localize(el, labels[i+10]);
    }
  }
  localizeNavigation();
  const footer = document.querySelector('footer');
  const status = document.createElement('div'); status.className = 'local-environment';
  const clock = document.createElement('time'); clock.lang = locale; clock.dir = 'auto';
  const toggle = document.createElement('button'); toggle.type = 'button'; toggle.lang = language; toggle.dir = 'auto';
  status.append(clock, toggle);
  if (footer) footer.before(status); else document.body.append(status);
  function updateEnvironment(date) {
    const minute = Math.floor(+date/60000);
    const signature = [minute, coords?.latitude, region, Intl.DateTimeFormat().resolvedOptions().timeZone].join('|');
    if (signature === lastMinute) return;
    lastMinute = signature;
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    let season = seasonFor(date, zone);
    if (coords) { const m = date.getMonth(), idx = m===11||m<2?0:m<5?1:m<8?2:3; season = ['winter','spring','summer','autumn'][(idx+(coords.latitude<0?2:0))%4]; }
    root.dataset.season = season;
    const event = regionalEvent(date, region);
    if (event) root.dataset.holiday = event; else delete root.dataset.holiday;
    clock.dateTime = date.toISOString();
    clock.textContent = formatLocalDateTime(date, locale);
    const m=date.getMonth(), sm=m===11||m<2?11:m-(m+1)%3;
    const from=new Date(date.getFullYear()-(m<2?1:0),sm,1), to=new Date(from.getFullYear(),from.getMonth()+3,0);
    const fmt = new Intl.DateTimeFormat(locale,{month:'short',day:'numeric'});
    for (const el of document.querySelectorAll('#seasonWindow,#season-window')) { el.textContent=fmt.format(from)+' – '+fmt.format(to); el.lang=locale; }
  }
  function apply(phase) {
    if (root.dataset.tod !== phase) root.dataset.tod = phase;
    if (document.body.dataset.atmo !== phase) document.body.dataset.atmo = phase;
    for (const el of document.querySelectorAll('#atmoName, #current-season')) localize(el, labels[phases.indexOf(phase)]);
    root.dataset.daylightSource = coords ? 'solar' : 'clock';
    toggle.disabled = pending;
    localize(toggle, coords ? labels[6] : labels[5]);
    toggle.setAttribute('aria-pressed',String(!!coords));
    toggle.title = unavailable ? labels[7] : labels[4];
  }
  const sync = () => { const date = new Date(); updateEnvironment(date); apply(state.read(date)); };
  for (const button of document.querySelectorAll('#atmo, #atmo-cycle')) {
    button.title = labels[8];
    for (const el of button.querySelectorAll('small')) if (el.textContent.trim().toLowerCase()==='current atmosphere') localize(el, labels[9]);
    button.addEventListener('click', () => apply(state.cycle()));
  }
  const hint = document.querySelector('#atmoHint'); if (hint) localize(hint, labels[8]);
  toggle.addEventListener('click', () => {
    if (coords) { coords=null; request++; unavailable=false; lastMinute=''; sync(); return; }
    if (!navigator.geolocation) { unavailable=true; sync(); return; }
    pending=true; const id=++request; sync();
    navigator.geolocation.getCurrentPosition(position => {
      if(id!==request)return;
      const c=position.coords; coords={latitude:Math.round(c.latitude*10)/10,longitude:Math.round(c.longitude*10)/10};
      pending=false; unavailable=false; lastMinute=''; sync();
    }, () => { if(id!==request)return; pending=false; unavailable=true; sync(); }, {enableHighAccuracy:false,timeout:8000,maximumAge:300000});
  });
  // Revoke in-memory coordinates if permission is withdrawn.
  navigator.permissions?.query({name:'geolocation'}).then(permission => {
    permission.addEventListener('change',()=>{if(permission.state!=='granted'){coords=null;pending=false;request++;lastMinute='';sync();}});
  }).catch(()=>{});
  // Use four opacity layers, with existing artwork as a no-JS fallback.
  if (document.body.classList.contains('studio-world')) {
    const host = document.querySelector('#living-world-scene, .ws-scene, .scene, .page-scene') || document.body;
    const sky = document.createElement('div'); sky.className='studio-sky'; sky.setAttribute('aria-hidden','true');
    for(const phase of phases){const layer=document.createElement('div');layer.className='studio-sky-layer sky-'+phase;sky.append(layer);}
    host.prepend(sky); host.classList.add('studio-sky-host'); root.classList.add('studio-sky-ready');
  }
  sync();
  setInterval(sync, 1000);
  document.addEventListener('visibilitychange', sync);
  addEventListener('pageshow', sync);
  addEventListener('focus', sync);
}

export function startAtmosphere() {
  const root = document.documentElement;
  const canvas = document.createElement('canvas');
  canvas.className = 'world-atmosphere';
  canvas.setAttribute('aria-hidden', 'true');
  const context = canvas.getContext('2d');
  if (!context) return;
  const homeStage = document.querySelector('.home-world .world-stage');
  const scene = homeStage || document.body;
  scene.append(canvas);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0, height = 0, particles = [], lights = [], frame = 0, last = 0;
  function resize() {
    width = scene.clientWidth;
    height = homeStage ? homeStage.clientHeight : innerHeight;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = Math.min(width < 700 ? 12 : 22, Math.max(8, Math.floor(width / 65)));
    particles = Array.from({length: count}, () => ({x: Math.random()*width,y:Math.random()*height,r:1.5+Math.random()*3,s:.25+Math.random()*.55, phase:Math.random()*6.28}));
    // Time-of-day layer, kept small: stars and fireflies, sunset embers, water glints, dawn mist.
    lights = Array.from({length: width < 700 ? 14 : 26}, () => ({x: Math.random()*width, y: Math.random()*height, u: Math.random(), v: Math.random(), phase: Math.random()*6.28}));
  }
  function tod() {
    const body = document.body, s = root.dataset.tod || body?.dataset.atmo || body?.dataset.atmosphere;
    if (s) return s;
    const h = new Date().getHours();
    return h >= 5 && h < 8 ? 'dawn' : h >= 8 && h < 17 ? 'day' : h >= 17 && h < 20 ? 'sunset' : 'night';
  }
  let sprite = null; // firefly glow, drawn once and reused every frame
  function glow() {
    if (sprite) return sprite;
    sprite = document.createElement('canvas'); sprite.width = sprite.height = 14;
    const c = sprite.getContext('2d'), g = c.createRadialGradient(7,7,0,7,7,7);
    g.addColorStop(0,'rgba(232,255,150,1)'); g.addColorStop(1,'rgba(232,255,150,0)');
    c.fillStyle = g; c.fillRect(0,0,14,14); return sprite;
  }
  function drawLights(time) {
    const scene = tod();
    lights.forEach((p, i) => {
      const pulse = .5 + .5*Math.sin(time/(700+p.u*900)+p.phase);
      if (scene === 'night') {
        if (i % 2) { // stars twinkle in the upper sky
          context.fillStyle = `rgba(235,240,255,${.25+.6*pulse})`;
          context.beginPath(); context.arc(p.u*width, p.v*height*.42, .6+p.u*.9, 0, Math.PI*2); context.fill();
        } else { // fireflies wander above the water
          p.x += Math.sin(time/2100+p.phase)*.45; p.y += Math.cos(time/2600+p.phase)*.3;
          if (p.y < height*.35) p.y = height*.9; if (p.y > height) p.y = height*.4;
          context.globalAlpha = .85*pulse; context.drawImage(glow(), p.x-7, p.y-7); context.globalAlpha = 1;
        }
      } else if (scene === 'sunset') { // warm embers rise slowly
        p.y -= .25+p.u*.35; p.x += Math.sin(time/1900+p.phase)*.3;
        if (p.y < height*.2) { p.y = height+6; p.x = Math.random()*width; }
        context.fillStyle = `rgba(255,${150+Math.round(p.v*60)},90,${.25+.45*pulse})`;
        context.beginPath(); context.arc(p.x,p.y,1+p.v*1.6,0,Math.PI*2); context.fill();
      } else if (scene === 'day') { // sun glints flicker on the lake
        const glint = Math.max(0, Math.sin(time/(380+p.u*420)+p.phase));
        if (glint < .55) return;
        context.fillStyle = `rgba(255,255,240,${(glint-.55)*1.6})`;
        context.beginPath(); context.ellipse(p.u*width, height*(.66+p.v*.3), 3+p.u*6, .8, 0, 0, Math.PI*2); context.fill();
      } else if (i < 6) { // dawn mist drifts low across the water
        const x = ((p.u*width + time*(.006+p.v*.008)) % (width+400)) - 200, y = height*(.6+p.v*.3), r = 160+p.u*160;
        const g = context.createRadialGradient(x,y,0,x,y,r);
        g.addColorStop(0,'rgba(255,236,226,.16)'); g.addColorStop(1,'rgba(255,236,226,0)');
        context.fillStyle = g; context.fillRect(x-r,y-r,r*2,r*2);
      }
    });
  }
  function environment() { /* Local clock owns the environment state independently of animation. */ }
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
    drawLights(time);
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
  const start = () => { startLocalTime(); startAtmosphere(); import('./ambience.mjs').then((m) => m.mountAmbienceControl()).catch(() => {}); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
}
