// Tabbed results (Sprint / Qualifying / Race) for one weekend, shared by the
// weekend page and the Results accordion. Each session is fetched on first view.
import { getSessionResults } from './api.js';
import { esc, driverLink, teamLink, weekendSessions, sessionState } from './utils.js';
import { setupTabs } from './tabs.js';
import { tableSkeleton } from './skeleton.js';

const LABELS = { sprint: 'Sprint', qualifying: 'Qualifying', race: 'Race' };
const CAPTIONS = { sprint: 'sprint classification', qualifying: 'qualifying results', race: 'race classification' };

// race: a schedule entry. preloaded: rows already fetched, e.g. { race: [...] }.
// Returns { show(type) } so other controls can switch tabs, or null if nothing has run yet.
export function mountSessionResults(container, race, { preloaded = {}, initial } = {}) {
  const types = weekendSessions(race)
    .filter((s) => s.results && sessionState(s) !== 'upcoming')
    .map((s) => s.results);

  if (!types.length) {
    container.innerHTML = '<p class="empty">Results appear here after each session.</p>';
    return null;
  }

  const cache = { ...preloaded };
  container.innerHTML = `
    <div class="toggle-group small" role="tablist" aria-label="Session">
      ${types.map((t) => `<button data-value="${t}" role="tab">${LABELS[t]}</button>`).join('')}
    </div>
    <div class="session-body"></div>`;

  const body = container.querySelector('.session-body');
  let current = null;

  async function show(type) {
    current = type;
    if (!cache[type]) {
      body.innerHTML = tableSkeleton();
      try {
        cache[type] = await getSessionResults(race.season, race.round, type);
      } catch {
        if (current === type) body.innerHTML = '<p class="empty">Couldn\'t load these results. Try again later.</p>';
        return;
      }
    }
    if (current !== type) return; // another tab was clicked while loading

    const rows = cache[type];
    if (!rows.length) {
      body.innerHTML = '<p class="empty">Results haven\'t been published yet.</p>';
      delete cache[type]; // try again next time
    } else {
      const caption = `${race.raceName} – ${CAPTIONS[type]}`;
      body.innerHTML = type === 'qualifying' ? qualifyingTable(rows, caption) : raceTable(rows, caption);
    }
  }

  const tabs = setupTabs(container.querySelector('[role="tablist"]'), body, show);
  tabs.select(types.includes(initial) ? initial : types.at(-1)); // default: the latest session
  return { show: tabs.select };
}

function podium(top3) {
  return `
    <div class="podium">
      ${top3.map((r) => `
        <div>
          <span class="p">P${esc(r.position)}</span>
          <strong>${driverLink(r.Driver)}</strong>
          <small>${teamLink(r.Constructor)}</small>
        </div>`).join('')}
    </div>`;
}

// Race and sprint share the same classification format.
function raceTable(results, caption) {
  return `
    ${podium(results.slice(0, 3))}
    <div class="table-scroll">
      <table class="results">
        <caption class="sr-only">${esc(caption)}</caption>
        <thead>
          <tr>
            <th>Pos</th><th>Driver</th><th>Team</th><th>Grid</th><th>Laps</th>
            <th>Time / Status</th><th class="right">Pts</th>
          </tr>
        </thead>
        <tbody>
          ${results.map((r) => `
            <tr>
              <td class="num">${esc(r.positionText)}</td>
              <td>${driverLink(r.Driver)}${r.FastestLap?.rank === '1' ? '<span class="fl" title="Fastest lap">FL</span>' : ''}</td>
              <td class="muted">${teamLink(r.Constructor)}</td>
              <td class="muted">${r.grid === '0' ? 'PL' : esc(r.grid)}</td>
              <td class="muted">${esc(r.laps)}</td>
              <td>${esc(r.Time?.time ?? r.status)}</td>
              <td class="right">${esc(r.points)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function qualifyingTable(results, caption) {
  return `
    <div class="table-scroll">
      <table class="results">
        <caption class="sr-only">${esc(caption)}</caption>
        <thead>
          <tr><th>Pos</th><th>Driver</th><th>Team</th><th>Q1</th><th>Q2</th><th>Q3</th></tr>
        </thead>
        <tbody>
          ${results.map((r) => `
            <tr>
              <td class="num">${esc(r.position)}</td>
              <td>${driverLink(r.Driver)}${r.position === '1' ? '<span class="fl" title="Pole position">POLE</span>' : ''}</td>
              <td class="muted">${teamLink(r.Constructor)}</td>
              <td class="muted">${esc(r.Q1 ?? '—')}</td>
              <td class="muted">${esc(r.Q2 ?? '—')}</td>
              <td>${esc(r.Q3 ?? '—')}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}
