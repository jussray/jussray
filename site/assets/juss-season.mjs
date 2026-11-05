// Juss & Co owner-managed public calendar. No visitor theme picker, tracking or geolocation.
const SOUTHERN_TIMEZONES = /^(Australia\/|Antarctica\/|Pacific\/(Auckland|Chatham|Fiji|Port_Moresby)|America\/(Santiago|Punta_Arenas|Argentina\/|Montevideo|Asuncion|Sao_Paulo)|Africa\/(Johannesburg|Maseru|Mbabane|Maputo|Harare|Windhoek))/;
function localParts(date, timezone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone, month: 'numeric', day: 'numeric'
  }).formatToParts(date);
  return {
    month: Number(parts.find(p => p.type === 'month').value),
    day: Number(parts.find(p => p.type === 'day').value)
  };
}
export function seasonAt(date, timezone = 'UTC') {
  const { month } = localParts(date, timezone);
  const northern = month === 12 || month <= 2 ? 'winter'
    : month <= 5 ? 'spring' : month <= 8 ? 'summer' : 'autumn';
  if (!SOUTHERN_TIMEZONES.test(timezone)) return northern;
  return ({ winter: 'summer', spring: 'autumn', summer: 'winter', autumn: 'spring' })[northern];
}
export function holidayAt(date, timezone = 'UTC') {
  const { month, day } = localParts(date, timezone);
  // Site-owner curated visual treatments. Public visitors cannot choose or override them.
  if (month === 10 && day >= 28) return 'halloween';
  if (month === 12 && day >= 20 && day <= 26) return 'winter-lights';
  if ((month === 12 && day >= 30) || (month === 1 && day <= 2)) return 'new-year';
  return '';
}
export function atmosphereAt(date, timezone = 'UTC') {
  return { season: seasonAt(date, timezone), holiday: holidayAt(date, timezone), timezone };
}
