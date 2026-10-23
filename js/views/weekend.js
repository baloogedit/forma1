import { getSchedule } from '../api.js';
import {
  esc, location, isSprintWeekend, weekendSessions, sessionState,
  dayLabel, timeLabel, timeZone, timeUntil, pageHead,
} from '../utils.js';
import { mountSessionResults } from '../sessions.js';

export const nav = 'calendar'; // highlight Calendar in the header
export const title = (race) => race?.raceName ?? 'Race weekend';

export async function load([round]) {
  const schedule = await getSchedule();
  return schedule.find((race) => race.round === round) ?? null;
}

export function render(root, race) {
  if (!race) {
    root.innerHTML = `
      ${pageHead('Calendar', 'Not found')}
      <a class="link-arrow" href="#/calendar">← Back to the calendar</a>`;
    return;
  }

  const sessions = weekendSessions(race);
  const sprint = isSprintWeekend(race);

  root.innerHTML = `
    <a class="link-arrow back" href="#/calendar">← Calendar</a>
    <header class="page-head">
      <p class="eyebrow">Round ${esc(race.round)} · ${sprint ? 'Sprint weekend' : 'Race weekend'}</p>
      <h1 class="page-title compact">${esc(race.raceName)}</h1>
      <p class="page-sub">${esc(race.Circuit.circuitName)} — ${esc(location(race))}</p>
    </header>

    <div class="weekend-grid">
      <section class="card">
        <h2 class="card-title">Weekend Schedule</h2>
        <p class="tz-note">Times shown in your local time (${esc(timeZone())})</p>
        <ul class="schedule" id="schedule"></ul>
      </section>

      <section class="card">
        <h2 class="card-title">Results</h2>
        <div id="weekend-results"></div>
        <p class="tz-note">Free practice and sprint qualifying timings aren't available from the data source.</p>
      </section>
    </div>`;

  const list = root.querySelector('#schedule');
  const resultsBox = root.querySelector('#weekend-results');
  let tabs = null;
  let finishedCount = -1;

  // Session states change over the weekend, so redraw the list (and the
  // results tabs when a session with results finishes) every 30 seconds.
  const update = () => {
    const states = sessions.map((s) => sessionState(s));
    const nextIndex = states.indexOf('upcoming');
    list.innerHTML = sessions.map((s, i) => scheduleRow(s, states[i], i === nextIndex)).join('');

    const finished = sessions.filter((s, i) => s.results && states[i] !== 'upcoming').length;
    if (finished !== finishedCount) {
      finishedCount = finished;
      tabs = mountSessionResults(resultsBox, race);
    }
  };

  // "Results" buttons in the schedule switch the results tab
  list.addEventListener('click', (event) => {
    const button = event.target.closest('[data-results]');
    if (!button || !tabs) return;
    tabs.show(button.dataset.results);
    resultsBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  update();
  const timer = setInterval(update, 30 * 1000);
  return () => clearInterval(timer);
}

function scheduleRow(session, state, isNext) {
  let status;
  if (state === 'live') status = '<span class="badge-inline live">Live</span>';
  else if (state === 'done' && session.results) status = `<button class="badge-inline result" data-results="${session.results}">Results</button>`;
  else if (state === 'done') status = '<span class="badge-inline done">Done</span>';
  else status = `<span class="badge-inline ${isNext ? 'next' : 'upcoming'}">${esc(timeUntil(session.start))}</span>`;

  const kind = session.key === 'Race' ? 'race' : session.key === 'Sprint' ? 'sprint' : '';
  return `
    <li class="session ${state} ${isNext ? 'is-next' : ''} ${kind}">
      <span class="s-day">${esc(dayLabel(session.start))}</span>
      <span class="s-time">${esc(timeLabel(session.start))}</span>
      <span class="s-name"><strong>${esc(session.name)}</strong><small>${esc(session.short)}</small></span>
      ${status}
    </li>`;
}
