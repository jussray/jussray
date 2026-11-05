/* Juss & Co atmospheric theme preferences: local-only, no tracking or cookies. */
(() => {
  'use strict';
  const hero = document.querySelector('.hero');
  if (!hero || document.getElementById('atmosphereButton')) return;
  const key = 'jussco:atmosphere:v1';
  const mediaReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const defaults = { adaptive:true, season:'auto', holiday:true, mood:'violet', intensity:78, reduceMotion:!!mediaReduce };
  const seasons = { spring:['✿','Spring','Mar – May'], summer:['☀','Summer','Jun – Aug'], autumn:['❧','Autumn','Sep – Nov'], winter:['❄','Winter','Dec – Feb'], night:['✦','Night','Classic'] };
  const moods = { violet:'#c7a5ff', rose:'#ff9bb6', amber:'#ffd08c', mint:'#9fe9d5', blue:'#95c9ff' };
  const validSeason = new Set(['auto','spring','summer','autumn','winter']);
  const safeRead = () => { try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; } };
  const read = safeRead();
  const prefs = {
    adaptive: typeof read.adaptive === 'boolean' ? read.adaptive : defaults.adaptive,
    season:validSeason.has(read.season) ? read.season : defaults.season,
    holiday:typeof read.holiday === 'boolean' ? read.holiday : defaults.holiday,
    mood:Object.hasOwn(moods,read.mood) ? read.mood : defaults.mood,
    intensity:Number.isFinite(read.intensity) ? Math.min(100,Math.max(20,read.intensity)) : defaults.intensity,
    reduceMotion:typeof read.reduceMotion === 'boolean' ? read.reduceMotion : defaults.reduceMotion
  };
  const save = () => { try { localStorage.setItem(key,JSON.stringify(prefs)); } catch { /* preference remains usable for this visit */ } };
  const seasonOf = date => {
    const m = date.getMonth();
    return m >= 2 && m <= 4 ? 'spring' : m >= 5 && m <= 7 ? 'summer' : m >= 8 && m <= 10 ? 'autumn' : 'winter';
  };
  const holidayOf = date => {
    const m=date.getMonth(), day=date.getDate();
    if (m===9 && day>=20 && day<=31) return 'halloween';
    if (m===11 && day>=15 && day<=26) return 'christmas';
    if ((m===11 && day>=27) || (m===0 && day<=4)) return 'new-year';
    return 'none';
  };

  // Move the original canvas out of the clipped hero so stars remain stationary while glass panels scroll.
  const stars=document.getElementById('stars');
  if (stars && stars.parentElement !== document.body) {
    document.body.insertBefore(stars,document.body.firstChild);
    window.dispatchEvent(new Event('resize'));
  }
  const sheen=document.createElement('div'); sheen.className='atmosphere-sheen'; sheen.setAttribute('aria-hidden','true');
  const particles=document.createElement('div'); particles.className='atmosphere-particles'; particles.setAttribute('aria-hidden','true');
  for(let i=0;i<16;i++){
    const p=document.createElement('span');
    p.style.setProperty('--x',String((13+i*23)%94)+'%');
    p.style.setProperty('--y',String((9+i*31)%83)+'%');
    p.style.setProperty('--size',String(13+(i*7)%18)+'px');
    p.style.setProperty('--duration',String(7+(i*3)%11)+'s');
    p.style.setProperty('--delay',String((i%6)*-.8)+'s');
    particles.appendChild(p);
  }
  sheen.appendChild(particles); hero.appendChild(sheen);
  const button=document.createElement('button');
  button.type='button';button.id='atmosphereButton';button.className='atmosphere-badge';
  button.setAttribute('aria-controls','atmospherePanel');button.setAttribute('aria-expanded','false');
  button.setAttribute('aria-label','Customize the Juss & Co atmosphere');
  button.innerHTML='<span class="atmosphere-symbol" id="atmosphereSymbol" aria-hidden="true"></span><span><span id="atmosphereName"></span><small id="atmosphereMonths"></small></span><span class="atmosphere-gear" aria-hidden="true">⚙</span>';
  hero.appendChild(button);
  const panel=document.createElement('aside');
  panel.id='atmospherePanel';panel.className='atmosphere-panel';panel.hidden=true;panel.setAttribute('aria-label','Atmosphere preferences');
  panel.innerHTML=`
    <div class="atmosphere-panel-head"><div><h2>Juss &amp; Co</h2><p>✧ Adaptive atmosphere<br>Choose the scene, mood and motion that feel right.</p></div>
      <button id="atmosphereClose" type="button" class="atmosphere-close" aria-label="Close atmosphere settings">×</button></div>
    <div class="atmosphere-group"><label class="atmosphere-toggle" for="atmosphereAdaptive"><span>Adaptive theme</span><input id="atmosphereAdaptive" type="checkbox"></label></div>
    <div class="atmosphere-group"><label for="atmosphereSeason">Preferred season</label>
      <select id="atmosphereSeason"><option value="auto">Auto (local calendar)</option><option value="spring">✿ Spring</option>
        <option value="summer">☀ Summer</option><option value="autumn">❧ Autumn</option><option value="winter">❄ Winter</option></select></div>
    <div class="atmosphere-group"><strong>Color mood</strong><div class="atmosphere-moods" aria-label="Choose color mood">
      ${Object.entries(moods).map(([name,color])=>'<button type="button" class="atmosphere-mood" data-mood="'+name+'" aria-label="'+name+' mood" aria-pressed="false" style="--chip:'+color+'"></button>').join('')}
    </div></div>
    <div class="atmosphere-group"><label for="atmosphereIntensity">Visual intensity <output id="atmosphereIntensityValue"></output></label>
      <input type="range" min="20" max="100" step="1" id="atmosphereIntensity"></div>
    <div class="atmosphere-group"><label class="atmosphere-toggle" for="atmosphereHoliday"><span>Holiday details</span><input id="atmosphereHoliday" type="checkbox"></label>
      <label class="atmosphere-toggle" for="atmosphereMotion"><span>Reduce motion</span><input id="atmosphereMotion" type="checkbox"></label></div>
    <div class="atmosphere-group"><button id="atmosphereReset" class="atmosphere-reset" type="button">Reset to automatic</button></div>
    <p>Preferences stay on this device. No account or location access is needed.</p>`;
  document.body.appendChild(panel);
  const $ = id => document.getElementById(id);
  const syncControls=()=>{
    $('atmosphereAdaptive').checked=prefs.adaptive;
    $('atmosphereSeason').value=prefs.season;
    $('atmosphereSeason').disabled=!prefs.adaptive;
    $('atmosphereHoliday').checked=prefs.holiday;
    $('atmosphereMotion').checked=prefs.reduceMotion;
    $('atmosphereIntensity').value=String(prefs.intensity);
    $('atmosphereIntensityValue').textContent=prefs.intensity+'%';
    panel.querySelectorAll('[data-mood]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.mood===prefs.mood)));
  };
  const apply=()=>{
    const now=new Date();
    const season=prefs.adaptive ? (prefs.season==='auto'?seasonOf(now):prefs.season) : 'night';
    const holiday=prefs.adaptive && prefs.holiday ? holidayOf(now) : 'none';
    document.body.dataset.season=season;
    document.body.dataset.holiday=holiday;
    document.body.dataset.mood=prefs.mood;
    document.body.classList.toggle('atmosphere-calm',prefs.reduceMotion || !!mediaReduce);
    document.body.style.setProperty('--atmosphere-intensity',String(prefs.intensity/100));
    const meta=seasons[season];
    $('atmosphereSymbol').textContent=meta[0];
    $('atmosphereName').textContent=holiday==='none'?meta[1]:holiday.replace('-', ' ').replace(/^./,c=>c.toUpperCase());
    $('atmosphereMonths').textContent=meta[2];
    const symbol={spring:'✿',summer:'✧',autumn:'❧',winter:'❄',night:'✦'}[season];
    particles.querySelectorAll('span').forEach(el=>el.textContent=symbol);
    syncControls();
    if(stars) stars.style.visibility=prefs.reduceMotion || !!mediaReduce ? 'hidden' : '';
  };
  const change=(key,value)=>{ prefs[key]=value;save();apply(); };
  button.addEventListener('click',()=>{ panel.hidden=!panel.hidden;button.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden) $('atmosphereClose').focus(); });
  const close=()=>{panel.hidden=true;button.setAttribute('aria-expanded','false');button.focus();};
  $('atmosphereClose').addEventListener('click',close);
  document.addEventListener('keydown',e=>{if(e.key==='Escape' && !panel.hidden) close();});
  document.addEventListener('pointerdown',e=>{if(!panel.hidden && !panel.contains(e.target) && !button.contains(e.target)){panel.hidden=true;button.setAttribute('aria-expanded','false');}});
  $('atmosphereAdaptive').addEventListener('change',e=>change('adaptive',e.target.checked));
  $('atmosphereSeason').addEventListener('change',e=>change('season',e.target.value));
  $('atmosphereHoliday').addEventListener('change',e=>change('holiday',e.target.checked));
  $('atmosphereMotion').addEventListener('change',e=>change('reduceMotion',e.target.checked));
  $('atmosphereIntensity').addEventListener('input',e=>change('intensity',Number(e.target.value)));
  panel.querySelectorAll('[data-mood]').forEach(el=>el.addEventListener('click',()=>change('mood',el.dataset.mood)));
  $('atmosphereReset').addEventListener('click',()=>{Object.assign(prefs,defaults);save();apply();});
  apply();
})();
