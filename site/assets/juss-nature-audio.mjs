export function initNatureAudio(season = 'autumn') {
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
    lowpass.frequency.value = season === 'winter' ? 280 : 530;
    const bed = context.createGain();
    bed.gain.value = 0.022;
    noise = context.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    noise.connect(lowpass).connect(bed).connect(master);
    noise.start();
    natureTimer = setInterval(() => {
      if (document.hidden) return;
      chirp(season !== 'winter' && Math.random() > 0.35);
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
}
