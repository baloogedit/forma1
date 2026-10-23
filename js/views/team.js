import { getTeamProfile, getConstructorStandings, getChampions } from '../api.js';
import { esc, driverName, shortDate, pageHead } from '../utils.js';

export const nav = 'standings';
export const title = ({ team }) => team?.name ?? 'Team not found';

export async function load([id]) {
  const [profile, standings, champions] = await Promise.all([
    getTeamProfile(id), getConstructorStandings(), getChampions(),
  ]);
  const titles = champions.constructors
    .filter((s) => s.ConstructorStandings[0].Constructor.constructorId === id)
    .map((s) => s.season);
  const standing = standings.find((s) => s.Constructor.constructorId === id) ?? null;
  return { ...profile, titles, standing };
}

export function render(root, { team, career, races, titles, standing }) {
  if (!team) {
    root.innerHTML = `
      ${pageHead('Team', 'Not found')}
      <a class="link-arrow" href="#/standings/constructors">← Back to the standings</a>`;
    return;
  }

  const drivers = seasonDrivers(races);

  root.innerHTML = `
    <a class="link-arrow back" href="#/standings/constructors">← Standings</a>
    ${pageHead(team.nationality, team.name)}
    <p class="page-sub">
      ${drivers.length ? `Drivers: ${drivers.map((d) => `<a class="inline-link" href="#/driver/${esc(d.id)}">${esc(d.name)}</a> (${d.points} pts)`).join(', ')} · ` : ''}
      <a class="inline-link" href="${esc(team.url)}" target="_blank" rel="noopener">Wikipedia ↗</a>
    </p>

    <div class="stat-grid detail-stats">
      ${stat(`${races[0]?.season ?? 'This'} season`, standing ? `P${standing.position ?? standing.positionText}` : '–', standing ? `${standing.points} pts · ${standing.wins} wins` : 'Not classified')}
      ${stat('Constructors\' titles', titles.length, titles.length ? summarise(titles) : 'None yet')}
      ${stat('Race wins', career.wins, `${career.podiums} podium finishes`)}
      ${stat('Pole positions', career.poles, `${career.seasons} seasons in F1`)}
    </div>

    <section class="card">
      <h2 class="card-title">This Season</h2>
      ${races.length ? seasonTable(races, team.name) : '<p class="empty">No races this season.</p>'}
    </section>`;
}

function stat(label, value, sub) {
  return `
    <section class="card stat-card">
      <p class="eyebrow">${esc(label)}</p>
      <div class="value">${esc(value)}</div>
      <div class="sub">${esc(sub)}</div>
    </section>`;
}

// long title lists (Ferrari has 16) are shortened to the first and last season
const summarise = (seasons) => (seasons.length > 4 ? `${seasons[0]} – ${seasons.at(-1)}` : seasons.join(', '));

// Everyone who drove for the team this season, with their points for it.
function seasonDrivers(races) {
  const byId = new Map();
  for (const race of races) {
    for (const r of race.Results) {
      const entry = byId.get(r.Driver.driverId) ?? { id: r.Driver.driverId, name: driverName(r.Driver), points: 0 };
      entry.points += Number(r.points);
      byId.set(entry.id, entry);
    }
  }
  return [...byId.values()].sort((a, b) => b.points - a.points);
}

function seasonTable(races, name) {
  return `
    <div class="table-scroll">
      <table class="results">
        <caption class="sr-only">${esc(name)} – race results this season</caption>
        <thead>
          <tr><th>Rnd</th><th>Grand Prix</th><th>Date</th><th>Finishes</th><th class="right">Pts</th></tr>
        </thead>
        <tbody>
          ${[...races].reverse().map((race) => {
            const points = race.Results.reduce((sum, r) => sum + Number(r.points), 0);
            const finishes = race.Results
              .map((r) => `${esc(r.Driver.code ?? r.Driver.familyName)} ${/^\d+$/.test(r.positionText) ? `P${esc(r.positionText)}` : esc(r.status)}`)
              .join(' · ');
            return `
              <tr>
                <td class="num">${esc(race.round)}</td>
                <td><a class="inline-link" href="#/results/${esc(race.round)}">${esc(race.raceName)}</a></td>
                <td class="muted">${esc(shortDate(race))}</td>
                <td>${finishes}</td>
                <td class="right">${points}</td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}
