// iCalendar (.ics) export of a race weekend, so the sessions can be added to
// Google Calendar, Outlook, Apple Calendar, etc. Times are written in UTC.
import { weekendSessions, location } from './utils.js';

// 2026-10-23T18:30:00.000Z -> 20261023T183000Z
const icsDate = (date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

// commas, semicolons, backslashes and newlines must be escaped in text values
const icsText = (value) => String(value).replace(/[\\;,]/g, (c) => '\\' + c).replace(/\n/g, '\\n');

// lines longer than 75 characters are folded onto continuation lines starting with a space
const fold = (line) => line.match(/.{1,73}/g).join('\r\n ');

export function weekendIcs(race) {
  const now = icsDate(new Date());
  const place = `${race.Circuit.circuitName}, ${location(race)}`;

  const events = weekendSessions(race).map((session) => {
    const end = new Date(session.start.getTime() + session.minutes * 60 * 1000);
    return [
      'BEGIN:VEVENT',
      `UID:${race.season}-${race.round}-${session.key}@pitlane`,
      `DTSTAMP:${now}`,
      `DTSTART:${icsDate(session.start)}`,
      `DTEND:${icsDate(end)}`,
      `SUMMARY:${icsText(`${session.name} – ${race.raceName}`)}`,
      `LOCATION:${icsText(place)}`,
      'END:VEVENT',
    ];
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PIT LANE//F1 weekend//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${icsText(`${race.season} ${race.raceName}`)}`,
    ...events.flat(),
    'END:VCALENDAR',
  ].map(fold).join('\r\n') + '\r\n';
}

// Triggers a download of the weekend as e.g. "2026-r18-united-states-grand-prix.ics".
export function downloadWeekendIcs(race) {
  const blob = new Blob([weekendIcs(race)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${race.season}-r${race.round}-${race.raceName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
