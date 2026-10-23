import { getDriverProfile, getDriverStandings, getChampions } from '../api.js';
import { esc, driverName, shortDate, pageHead } from '../utils.js';

export const nav = 'standings';
export const title = ({ driver }) => (driver ? driverName(driver) : 'Driver not found');

export async function load([id]) {
  const [profile, standings, champions] = await Promise.all([
    getDriverProfile(id), getDriverStandings(), getChampions(),
  ]);
  const titles = champions.drivers
    .filter((s) => s.DriverStandings[0].Driver.driverId === id)
    .map((s) => s.season);
  const standing = standings.find((s) => s.Driver.driverId === id) ?? null;
  return { ...profile, titles, standing };
}

export function render(root, { driver, career, races, titles, standing }) {
  if (!driver) {
    root.innerHTML = `
      ${pageHead('Driver', 'Not found')}
      <a class="link-arrow" href="#/standings">← Back to the standings</a>`;
    return;
  }

  const team = standing?.Constructors.at(-1);
  const facts = [driver.permanentNumber && `#${driver.permanentNumber}`, driver.code, driver.nationality].filter(Boolean);

  root.innerHTML = `
    <a class="link-arrow back" href="#/standings">← Standings</a>
    ${pageHead(facts.join(' · '), driverName(driver))}
    <p class="page-sub">
      ${driver.dateOfBirth ? `Born ${esc(formatBirth(driver.dateOfBirth))} · ` : ''}
      ${team ? `Drives for <a class="inline-link" href="#/team/${esc(team.constructorId)}">${esc(team.name)}</a> · ` : ''}
      <a class="inline-link" href="${esc(driver.url)}" target="_blank" rel="noopener">Wikipedia ↗</a>
    </p>

    <div class="stat-grid detail-stats">
      ${stat(`${races[0]?.season ?? 'This'} season`, standing ? `P${standing.position ?? standing.positionText}` : '–', standing ? `${standing.points} pts · ${standing.wins} wins` : 'Not classified')}
      ${stat('World titles', titles.length, titles.length ? titles.join(', ') : 'None yet')}
      ${stat('Race wins', career.wins, `${career.podiums} podiums`)}
      ${stat('Pole positions', career.poles, `${career.starts} starts in ${career.seasons} seasons`)}
    </div>

    <section class="card">
      <h2 class="card-title">This Season</h2>
      ${races.length ? seasonTable(races, driverName(driver)) : '<p class="empty">No races this season.</p>'}
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

// "7 Jan 1985 (age 41)"
function formatBirth(date) {
  const born = new Date(date);
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  if (now < new Date(now.getFullYear(), born.getMonth(), born.getDate())) age--;
  return `${born.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} (age ${age})`;
}

function seasonTable(races, name) {
  return `
    <div class="table-scroll">
      <table class="results">
        <caption class="sr-only">${esc(name)} – race results this season</caption>
        <thead>
          <tr><th>Rnd</th><th>Grand Prix</th><th>Date</th><th>Grid</th><th>Finish</th><th class="right">Pts</th></tr>
        </thead>
        <tbody>
          ${[...races].reverse().map((race) => {
            const r = race.Results[0];
            return `
              <tr>
                <td class="num">${esc(race.round)}</td>
                <td><a class="inline-link" href="#/results/${esc(race.round)}">${esc(race.raceName)}</a></td>
                <td class="muted">${esc(shortDate(race))}</td>
                <td class="muted">${r.grid === '0' ? 'PL' : esc(r.grid)}</td>
                <td>${/^\d+$/.test(r.positionText) ? `P${esc(r.positionText)}` : esc(r.status)}</td>
                <td class="right">${esc(r.points)}</td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}
