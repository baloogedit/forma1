import { getSchedule, getChampions } from '../api.js';
import { esc, driverName, seasonStatus, pageHead } from '../utils.js';

export const title = 'Records';

export async function load() {
  const schedule = await getSchedule();

  // the current season's leader isn't a champion until the season is over
  const season = Number(schedule[0]?.season ?? new Date().getFullYear());
  const lastFinished = seasonStatus(schedule).next ? season - 1 : season;

  return getChampions(lastFinished);
}

export function render(root, { drivers, constructors }) {
  const driverTitles = countTitles(drivers, (s) => s.DriverStandings[0].Driver.driverId,
    (s) => driverName(s.DriverStandings[0].Driver));
  const teamTitles = countTitles(constructors, (s) => s.ConstructorStandings[0].Constructor.constructorId,
    (s) => s.ConstructorStandings[0].Constructor.name);
  const streak = longestStreak(drivers);
  const youngest = youngestChampion(drivers);
  const firstSeason = drivers[0]?.season ?? '';

  root.innerHTML = `
    ${pageHead(`All-time · since ${firstSeason}`, 'Records')}

    <div class="stat-grid">
      ${titleCard('Most drivers\' titles', driverTitles)}
      ${titleCard('Most constructors\' titles', teamTitles)}
      ${statCard('Most titles in a row', streak.count, streak.name, `${streak.from}–${streak.to}`)}
      ${statCard('Youngest champion', youngest.age, youngest.name, `${youngest.season} season`)}
    </div>

    <div class="records-grid">
      <section class="card">
        <h2 class="card-title">Drivers' Titles</h2>
        ${rankList(driverTitles.slice(0, 10))}
      </section>
      <section class="card">
        <h2 class="card-title">Constructors' Titles</h2>
        ${rankList(teamTitles.slice(0, 10))}
      </section>
    </div>

    <section class="card section-gap">
      <h2 class="card-title">World Champions</h2>
      <div class="champ-table">${championsTable(drivers, constructors)}</div>
    </section>`;
}

// -> [{ name, count, seasons }] sorted by count, then by earliest title
function countTitles(lists, idOf, nameOf) {
  const map = new Map();
  for (const s of lists) {
    const id = idOf(s);
    if (!map.has(id)) map.set(id, { name: nameOf(s), count: 0, seasons: [] });
    const entry = map.get(id);
    entry.count++;
    entry.seasons.push(s.season);
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.seasons[0] - b.seasons[0]);
}

function longestStreak(lists) {
  let best = { count: 0 };
  let current = null;
  for (const s of lists) {
    const driver = s.DriverStandings[0].Driver;
    const continues = current && current.id === driver.driverId && Number(s.season) === Number(current.to) + 1;
    if (continues) {
      current.count++;
      current.to = s.season;
    } else {
      current = { id: driver.driverId, name: driverName(driver), count: 1, from: s.season, to: s.season };
    }
    if (current.count > best.count) best = { ...current };
  }
  return best;
}

// Age measured at the end of the title season (31 Dec).
function youngestChampion(lists) {
  let best = null;
  for (const s of lists) {
    const driver = s.DriverStandings[0].Driver;
    if (!driver.dateOfBirth) continue;
    const ms = new Date(`${s.season}-12-31`) - new Date(driver.dateOfBirth);
    if (!best || ms < best.ms) best = { ms, name: driverName(driver), season: s.season };
  }
  if (!best) return { age: '–', name: '', season: '' };
  return { ...best, age: Math.floor(best.ms / (365.25 * 24 * 3600 * 1000)) };
}

function seasonsText(entry) {
  if (!entry) return '';
  return entry.seasons.length > 4
    ? `${entry.seasons[0]} – ${entry.seasons.at(-1)}`
    : entry.seasons.join(', ');
}

// Shows every name sharing the top count, e.g. Schumacher & Hamilton on 7.
function titleCard(label, titles) {
  const leaders = titles.filter((e) => e.count === titles[0]?.count);
  const sub = leaders.length > 1 ? `${leaders.length}-way tie` : seasonsText(leaders[0]);
  return statCard(label, leaders[0]?.count, leaders.map((e) => e.name).join(' & '), sub);
}

function statCard(label, value, who, sub) {
  return `
    <section class="card stat-card">
      <p class="eyebrow">${esc(label)}</p>
      <div class="value">${esc(value ?? '–')}</div>
      <div class="who">${esc(who ?? '')}</div>
      <div class="sub">${esc(sub)}</div>
    </section>`;
}

function rankList(entries) {
  return `
    <ul class="rank-list">
      ${entries.map((e, i) => `
        <li>
          <span class="pos">${i + 1}</span>
          <div><div>${esc(e.name)}</div><small>${esc(seasonsText(e))}</small></div>
          <span class="pts">${e.count}</span>
        </li>`).join('')}
    </ul>`;
}

function championsTable(drivers, constructors) {
  const teamBySeason = new Map(constructors.map((s) => [s.season, s.ConstructorStandings[0].Constructor.name]));
  return `
    <table class="results">
      <caption class="sr-only">World champions by season</caption>
      <thead>
        <tr><th>Season</th><th>Driver</th><th>Driver's team</th><th>Constructors' champion</th></tr>
      </thead>
      <tbody>
        ${[...drivers].reverse().map((s) => {
          const d = s.DriverStandings[0];
          return `
            <tr>
              <td class="season">${esc(s.season)}</td>
              <td>${esc(driverName(d.Driver))}</td>
              <td class="muted">${esc(d.Constructors.map((c) => c.name).join(' / '))}</td>
              <td>${esc(teamBySeason.get(s.season) ?? '—')}</td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}
