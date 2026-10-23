import { getSchedule, getSeasonResults } from '../api.js';
import { esc, shortDate, isSprintWeekend, pageHead } from '../utils.js';
import { mountSessionResults } from '../sessions.js';

export const title = 'Results';

export async function load() {
  const [schedule, races] = await Promise.all([getSchedule(), getSeasonResults()]);
  // the schedule entry knows the weekend's sessions; the race rows are already loaded
  const weekendByRound = new Map(schedule.map((race) => [race.round, race]));
  return races.map((race) => ({ weekend: weekendByRound.get(race.round) ?? race, results: race.Results }));
}

export function render(root, races, [openRound]) {
  root.innerHTML = `
    ${pageHead('Past finishes', 'Results')}
    ${races.length
      ? `<div class="accordion">${races.map(({ weekend }) => item(weekend)).join('')}</div>`
      : '<p class="empty">No races finished yet this season.</p>'}`;

  const byRound = new Map(races.map((entry) => [entry.weekend.round, entry]));

  const setOpen = (entry, open) => {
    entry.classList.toggle('open', open);
    entry.querySelector('.acc-head').setAttribute('aria-expanded', open);
    // build the session tabs the first time a race is opened
    if (open && !entry.dataset.mounted) {
      const { weekend, results } = byRound.get(entry.dataset.round);
      mountSessionResults(entry.querySelector('.session-results'), weekend, { preloaded: { race: results }, initial: 'race' });
      entry.dataset.mounted = 'true';
    }
  };

  root.querySelectorAll('.acc-head').forEach((head) => {
    head.addEventListener('click', () => {
      const entry = head.parentElement;
      const open = !entry.classList.contains('open');
      setOpen(entry, open);
      // keep the URL shareable without triggering a re-render
      history.replaceState(null, '', open ? `#/results/${entry.dataset.round}` : '#/results');
    });
  });

  if (openRound) {
    const entry = root.querySelector(`.acc-item[data-round="${CSS.escape(openRound)}"]`);
    if (entry) {
      setOpen(entry, true);
      entry.scrollIntoView({ block: 'start' });
      window.scrollBy(0, -140); // clear the sticky header
    }
  }
}

function item(race) {
  return `
    <article class="acc-item" data-round="${esc(race.round)}">
      <button class="acc-head" aria-expanded="false" aria-controls="round-${esc(race.round)}-panel" id="round-${esc(race.round)}-head">
        <span class="r"><span class="sr-only">Round </span>R${esc(race.round)}</span>
        <span class="name">${esc(race.raceName)}${isSprintWeekend(race) ? '<span class="tag">Sprint</span>' : ''}</span>
        <span class="date">${esc(shortDate(race))}</span>
        <span class="toggle" aria-hidden="true">+</span>
      </button>
      <div class="acc-body" id="round-${esc(race.round)}-panel" role="region" aria-labelledby="round-${esc(race.round)}-head">
        <div class="session-results"></div>
        <p class="weekend-link"><a class="link-arrow" href="#/weekend/${esc(race.round)}">Weekend schedule →</a></p>
      </div>
    </article>`;
}
