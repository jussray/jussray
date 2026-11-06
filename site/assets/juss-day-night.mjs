// Juss & Co: passive time-of-day scene selection. No geolocation or visitor theme override.
export function phaseAt(date, timezone = 'UTC') {
  const hourText = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    hourCycle: 'h23'
  }).format(date);
  const hour = Number(hourText);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new RangeError('Invalid local hour');
  }
  if (hour >= 7 && hour < 17) return 'day';
  if ((hour >= 5 && hour < 7) || (hour >= 17 && hour < 20)) return 'dusk';
  return 'night';
}

export function installDayNight({ root = document.documentElement, clock = () => new Date() } = {}) {
  let timezone = 'UTC';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {}
  const update = () => {
    try {
      root.dataset.jussPhase = phaseAt(clock(), timezone);
    } catch {
      root.dataset.jussPhase = 'day';
    }
  };
  update();
  const timer = window.setInterval(update, 60_000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) update();
  });
  window.addEventListener('pagehide', () => window.clearInterval(timer), { once: true });
  return update;
}
