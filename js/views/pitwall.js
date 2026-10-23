import { getSchedule, getDriverStandings, getConstructorStandings } from '../api.js';
import {
  esc, raceStart, location, driverName, seasonStatus, countdownParts, pad, bar, pageHead,
  weekendSessions, sessionState, isSprintWeekend, dayLabel, timeLabel,
} from '../utils.js';

export const title = 'Pit Wall';
export const skeleton = 'dashboard';

export async function load() {
  const [schedule, drivers, constructors] = await Promise.all([
    getSchedule(),
    getDriverStandings(),
    getConstructorStandings(),
  ]);
  return { schedule, drivers, constructors };
}

export function render(root, { schedule, drivers, constructors }) {
  const { done, next, total } = seasonStatus(schedule);
  const season = schedule[0]?.season ?? new Date().getFullYear();
  const progress = total ? (done.length / total) * 100 : 0;

  root.innerHTML = `
    ${pageHead(`Season ${season} · Round ${done.length} of ${total}`, 'Pit Wall')}
    <div class="dash-grid">
      ${next ? heroCard(next) : seasonOverCard(season)}

      <section class="card">
        <h2 class="card-title">Season Progress</h2>
        ${bar(progress)}
        <p class="progress-text">${done.length} races run, ${total - done.length} to go.</p>
        <a class="link-arrow" href="#/calendar">Full calendar →</a>
      </section>

      <section class="card">
        <h2 class="card-title">Drivers' Top 5</h2>
        ${driversTop5(drivers)}
        <a class="link-arrow" href="#/standings">All standings →</a>
      </section>

      <section class="card">
        <h2 class="card-title">Teams</h2>
        <ul class="team-list">
          ${constructors.slice(0, 5).map((c) => `
            <li>
              <span class="pos">${esc(c.position ?? c.positionText)}</span>
              <span>${esc(c.Constructor.name)}</span>
              <span class="pts">${esc(c.points)}</span>
            </li>`).join('')}
        </ul>
      </section>
    </div>`;

  if (!next) return;

  const target = raceStart(next);
  const tiles = root.querySelectorAll('[data-unit]');
  const spoken = root.querySelector('#countdown-text');
  const tick = () => {
    const parts = countdownParts(target);
    tiles.forEach((tile) => { tile.textContent = pad(parts[tile.dataset.unit]); });
    // the screen-reader text only changes once a minute, not every second
    const text = countdownText(parts);
    if (spoken.textContent !== text) spoken.textContent = text;
  };
  tick();
  const timer = setInterval(tick, 1000);
  return () => clearInterval(timer);
}

function heroCard(race) {
  const units = [['days', 'Days'], ['hrs', 'Hrs'], ['min', 'Min'], ['sec', 'Sec']];
  const nextSession = weekendSessions(race).find((s) => sessionState(s) !== 'done');
  const live = nextSession && sessionState(nextSession) === 'live';
  return `
    <section class="hero">
      <p class="eyebrow">Next up · Round ${esc(race.round)}${isSprintWeekend(race) ? ' · Sprint weekend' : ''}</p>
      <h2>${esc(race.raceName)}</h2>
      <p class="circuit">${esc(race.Circuit.circuitName)} — ${esc(location(race))}</p>
      <p class="sr-only" id="countdown-text"></p>
      <div class="countdown" aria-hidden="true">
        ${units.map(([key, label]) => `
          <div><strong data-unit="${key}">00</strong><small>${label.toUpperCase()}</small></div>`).join('')}
      </div>
      <div class="hero-foot">
        ${nextSession ? `<span>${live ? 'Live now' : 'Next session'}: <strong>${esc(nextSession.name)}</strong> · ${esc(dayLabel(nextSession.start))} ${esc(timeLabel(nextSession.start))}</span>` : ''}
        <a href="#/weekend/${esc(race.round)}">Weekend schedule →</a>
      </div>
    </section>`;
}

// "Starts in 2 days, 12 hours and 18 minutes"
function countdownText({ days, hrs, min }) {
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  const parts = [];
  if (days) parts.push(plural(days, 'day'));
  if (days || hrs) parts.push(plural(hrs, 'hour'));
  parts.push(plural(min, 'minute'));
  return `Starts in ${parts.slice(0, -1).join(', ')}${parts.length > 1 ? ' and ' : ''}${parts.at(-1)}`;
}

function seasonOverCard(season) {
  return `
    <section class="hero">
      <p class="eyebrow">Chequered flag</p>
      <h2>Season ${esc(season)} complete</h2>
      <p class="circuit">See you next year. Check the final results and standings.</p>
    </section>`;
}

function driversTop5(drivers) {
  if (!drivers.length) return '<p class="empty">No standings yet this season.</p>';
  const max = Number(drivers[0].points) || 1;
  return `
    <ul class="top-list">
      ${drivers.slice(0, 5).map((d) => `
        <li>
          <span class="pos">${esc(d.position ?? d.positionText)}</span>
          <span>${esc(driverName(d.Driver))}</span>
          ${bar((Number(d.points) / max) * 100)}
          <span class="pts">${esc(d.points)}</span>
        </li>`).join('')}
    </ul>`;
}
