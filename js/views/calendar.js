import { getSchedule } from '../api.js';
import { esc, shortDate, location, seasonStatus, isSprintWeekend, pageHead } from '../utils.js';

export const title = 'Calendar';

export async function load() {
  return getSchedule();
}

export function render(root, schedule) {
  const { done, next } = seasonStatus(schedule);
  const doneRounds = new Set(done.map((race) => race.round));
  const season = schedule[0]?.season ?? '';
  const sprints = schedule.filter(isSprintWeekend).length;

  root.innerHTML = `
    ${pageHead(`Season ${season} · ${schedule.length} rounds · ${sprints} sprints`, 'Calendar')}
    <div class="cal-grid">
      ${schedule.map((race) => {
        if (doneRounds.has(race.round)) return raceCard(race, 'done', 'Done');
        if (race === next) return raceCard(race, 'next', 'Next');
        return raceCard(race, 'upcoming', shortDate(race));
      }).join('')}
    </div>`;

  // keep the next race in view when the season is underway
  if (next && done.length > 3) {
    root.querySelector('.race-card.next')?.scrollIntoView({ block: 'center' });
  }
}

// Every card opens the full weekend schedule.
function raceCard(race, state, badge) {
  return `
    <a class="race-card ${state}" href="#/weekend/${esc(race.round)}" title="Weekend schedule">
      <span class="badge">${esc(badge)}</span>
      <div class="round">${esc(race.round)}</div>
      <h3>${esc(race.raceName)}</h3>
      <p class="meta">${esc(location(race))} · ${esc(shortDate(race))}</p>
      ${isSprintWeekend(race) ? '<span class="tag">Sprint weekend</span>' : ''}
    </a>`;
}
