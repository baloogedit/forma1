// Tabbed results (Sprint / Qualifying / Race) for one weekend, shared by the
// weekend page and the Results accordion. Each session is fetched on first view.
import { getSessionResults } from './api.js';
import { esc, driverName, weekendSessions, sessionState } from './utils.js';

const LABELS = { sprint: 'Sprint', qualifying: 'Qualifying', race: 'Race' };

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
    <div class="toggle-group small" role="tablist">
      ${types.map((t) => `<button data-type="${t}" role="tab">${LABELS[t]}</button>`).join('')}
    </div>
    <div class="session-body"></div>`;

  const body = container.querySelector('.session-body');
  const buttons = container.querySelectorAll('[data-type]');
  let current = null;

  async function show(type) {
    if (!types.includes(type)) return;
    current = type;
    buttons.forEach((b) => {
      b.classList.toggle('active', b.dataset.type === type);
      b.setAttribute('aria-selected', b.dataset.type === type);
    });

    if (!cache[type]) {
      body.innerHTML = '<div class="loading small"><div class="spinner"></div>Loading</div>';
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
      body.innerHTML = type === 'qualifying' ? qualifyingTable(rows) : raceTable(rows);
    }
  }

  buttons.forEach((b) => b.addEventListener('click', () => show(b.dataset.type)));
  show(types.includes(initial) ? initial : types.at(-1)); // default: the latest session
  return { show };
}

function podium(top3) {
  return `
    <div class="podium">
      ${top3.map((r) => `
        <div>
          <span class="p">P${esc(r.position)}</span>
          <strong>${esc(driverName(r.Driver))}</strong>
          <small>${esc(r.Constructor.name)}</small>
        </div>`).join('')}
    </div>`;
}

// Race and sprint share the same classification format.
function raceTable(results) {
  return `
    ${podium(results.slice(0, 3))}
    <div class="table-scroll">
      <table class="results">
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
              <td>${esc(driverName(r.Driver))}${r.FastestLap?.rank === '1' ? '<span class="fl" title="Fastest lap">FL</span>' : ''}</td>
              <td class="muted">${esc(r.Constructor.name)}</td>
              <td class="muted">${r.grid === '0' ? 'PL' : esc(r.grid)}</td>
              <td class="muted">${esc(r.laps)}</td>
              <td>${esc(r.Time?.time ?? r.status)}</td>
              <td class="right">${esc(r.points)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function qualifyingTable(results) {
  return `
    <div class="table-scroll">
      <table class="results">
        <thead>
          <tr><th>Pos</th><th>Driver</th><th>Team</th><th>Q1</th><th>Q2</th><th>Q3</th></tr>
        </thead>
        <tbody>
          ${results.map((r) => `
            <tr>
              <td class="num">${esc(r.position)}</td>
              <td>${esc(driverName(r.Driver))}${r.position === '1' ? '<span class="fl" title="Pole position">POLE</span>' : ''}</td>
              <td class="muted">${esc(r.Constructor.name)}</td>
              <td class="muted">${esc(r.Q1 ?? '—')}</td>
              <td class="muted">${esc(r.Q2 ?? '—')}</td>
              <td>${esc(r.Q3 ?? '—')}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}
