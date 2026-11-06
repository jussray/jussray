import { installDayNight } from './juss-day-night.mjs';
import { atmosphereAt } from './juss-season.mjs';
import { initNatureAudio } from './juss-nature-audio.mjs';
installDayNight();
(() => {
  let timezone = 'UTC';
  try { timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch {}
  let season = 'autumn';
  try {
    const atmosphere = atmosphereAt(new Date(), timezone);
    document.body.dataset.jussSeason = atmosphere.season;
    document.body.dataset.jussHoliday = atmosphere.holiday;
    season = atmosphere.season;
  } catch {}
  const panel = document.createElement('aside');
  panel.className = 'world-audio';
  panel.setAttribute('aria-label', 'Optional nature ambience');
  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'worldSoundToggle';
  button.setAttribute('aria-pressed', 'false');
  button.textContent = 'Enable nature sounds';
  const label = document.createElement('label');
  label.htmlFor = 'worldSoundVolume';
  label.textContent = 'Volume ';
  const range = document.createElement('input');
  range.type = 'range';
  range.min = '0';
  range.max = '100';
  range.value = '30';
  range.disabled = true;
  range.id = 'worldSoundVolume';
  range.setAttribute('aria-label', 'Nature sound volume');
  label.appendChild(range);
  panel.append(button, label);
  document.body.appendChild(panel);
  initNatureAudio(season);
})();