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
  // Web Audio is initialized only after the visitor deliberately presses the sound button.
  const toggle = document.getElementById('worldSoundToggle');
  const volume = document.getElementById('worldSoundVolume');
  if (!toggle || !volume) return;
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    toggle.disabled = true;
    toggle.textContent = 'Audio unavailable';
    return;
  }
  let context = null, noise = null, master = null, natureTimer = null;
  const volumeValue = () => Math.max(0, Math.min(1, Number(volume.value) / 100));
  const chirp = (bird = true) => {
    if (!context || context.state !== 'running' || !master) return;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(bird ? 1050 : 650, now);
    oscillator.frequency.exponentialRampToValueAtTime(bird ? 1500 : 220, now + (bird ? 0.21 : 0.4));
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(bird ? 0.026 : 0.013, now + 0.06);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + (bird ? 0.29 : 0.45));
    oscillator.connect(envelope).connect(master);
    oscillator.start(now);
    oscillator.stop(now + (bird ? 0.3 : 0.46));
  };
  async function stopAudio() {
    if (natureTimer) clearInterval(natureTimer);
    natureTimer = null;
    toggle.setAttribute('aria-pressed', 'false');
    toggle.textContent = 'Enable nature sounds';
    volume.disabled = true;
    try { noise?.stop(); } catch {}
    if (context) { try { await context.close(); } catch {} }
    noise = null;
    master = null;
    context = null;
  }
  async function startAudio() {
    context = new AudioContextCtor();
    await context.resume();
    master = context.createGain();
    master.gain.value = volumeValue();
    master.connect(context.destination);
    const buffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    const lowpass = context.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = current.season === 'winter' ? 280 : 530;
    const bed = context.createGain();
    bed.gain.value = 0.022;
    noise = context.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    noise.connect(lowpass).connect(bed).connect(master);
    noise.start();
    natureTimer = setInterval(() => {
      if (document.hidden) return;
      chirp(current.season !== 'winter' && Math.random() > 0.35);
    }, 8500);
    toggle.setAttribute('aria-pressed', 'true');
    toggle.textContent = 'Mute nature sounds';
    volume.disabled = false;
  }
  volume.addEventListener('input', () => {
    if (context && master) master.gain.setTargetAtTime(volumeValue(), context.currentTime, 0.05);
  });
  toggle.addEventListener('click', async () => {
    toggle.disabled = true;
    try {
      if (context) await stopAudio();
      else await startAudio();
    } catch {
      await stopAudio();
      toggle.textContent = 'Sound unavailable';
    } finally { toggle.disabled = false; }
  });
  document.addEventListener('visibilitychange', () => {
    if (!context) return;
    if (document.hidden) context.suspend().catch(() => {});
    else context.resume().catch(() => {});
  });
  window.addEventListener('pagehide', () => { if (context) stopAudio(); });
})();