// Escape text from the API before putting it into innerHTML.
export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Any { date, time } from the API (UTC) as a Date.
function toDate({ date, time }) {
  return new Date(`${date}T${time ?? '12:00:00Z'}`);
}

export function raceStart(race) {
  return toDate(race);
}

// Weekend sessions as the schedule names them. `minutes` is used to tell when a
// session is over; `results` is the session's results type in the API (if any).
const SESSION_TYPES = [
  { key: 'FirstPractice', name: 'Practice 1', short: 'FP1', minutes: 60 },
  { key: 'SecondPractice', name: 'Practice 2', short: 'FP2', minutes: 60 },
  { key: 'ThirdPractice', name: 'Practice 3', short: 'FP3', minutes: 60 },
  { key: 'SprintQualifying', name: 'Sprint Qualifying', short: 'SQ', minutes: 45 },
  { key: 'SprintShootout', name: 'Sprint Shootout', short: 'SQ', minutes: 45 },
  { key: 'Sprint', name: 'Sprint', short: 'Sprint', minutes: 60, results: 'sprint' },
  { key: 'Qualifying', name: 'Qualifying', short: 'Quali', minutes: 60, results: 'qualifying' },
];

export function weekendSessions(race) {
  const sessions = SESSION_TYPES
    .filter((type) => race[type.key])
    .map((type) => ({ ...type, start: toDate(race[type.key]) }));
  sessions.push({ key: 'Race', name: 'Grand Prix', short: 'Race', minutes: 120, results: 'race', start: raceStart(race) });
  return sessions.sort((a, b) => a.start - b.start);
}

// 'done' | 'live' | 'upcoming'
export function sessionState(session, now = new Date()) {
  const end = session.start.getTime() + session.minutes * 60 * 1000;
  if (now >= end) return 'done';
  if (now >= session.start) return 'live';
  return 'upcoming';
}

export const isSprintWeekend = (race) => Boolean(race.Sprint);

// "Fri, Oct 23"
export function dayLabel(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit' });
}

// "19:30" in the viewer's timezone
export function timeLabel(date) {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export const timeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

// "in 2d 4h", "in 3h 12m", "in 8m"
export function timeUntil(date, now = new Date()) {
  const { days, hrs, min } = countdownParts(date, now);
  if (days) return `in ${days}d ${hrs}h`;
  if (hrs) return `in ${hrs}h ${min}m`;
  return `in ${Math.max(min, 1)}m`;
}

// "Oct 11"
export function shortDate(race) {
  return raceStart(race).toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
}

export function fullDateTime(race) {
  return raceStart(race).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function location(race) {
  const loc = race.Circuit.Location;
  return `${loc.locality}, ${loc.country}`;
}

export function driverName(driver) {
  return `${driver.givenName} ${driver.familyName}`;
}

// Splits the schedule into finished races and the next one.
export function seasonStatus(schedule, now = new Date()) {
  const next = schedule.find((race) => raceStart(race) > now) ?? null;
  const done = schedule.filter((race) => raceStart(race) <= now);
  return { done, next, total: schedule.length };
}

export function countdownParts(target, now = new Date()) {
  const diff = Math.max(0, target - now);
  const sec = Math.floor(diff / 1000);
  return {
    days: Math.floor(sec / 86400),
    hrs: Math.floor((sec % 86400) / 3600),
    min: Math.floor((sec % 3600) / 60),
    sec: sec % 60,
  };
}

export const pad = (n) => String(n).padStart(2, '0');

export function bar(percent) {
  const width = Math.max(0, Math.min(100, percent));
  return `<div class="bar"><span style="width:${width}%"></span></div>`;
}

export function pageHead(eyebrow, title) {
  return `
    <header class="page-head">
      <p class="eyebrow">${esc(eyebrow)}</p>
      <h1 class="page-title">${esc(title)}</h1>
    </header>`;
}
