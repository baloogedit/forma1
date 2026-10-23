import { getDriverStandings, getConstructorStandings } from '../api.js';
import { esc, driverName, bar, pageHead } from '../utils.js';
import { setupTabs } from '../tabs.js';

export const title = 'Standings';

export async function load() {
  const [drivers, constructors] = await Promise.all([getDriverStandings(), getConstructorStandings()]);
  return { drivers, constructors };
}

// The tab lives in the URL (#/standings/constructors) so it can be shared and survives a reload.
export function render(root, data, [tab = 'drivers']) {
  root.innerHTML = `
    ${pageHead('World championship', 'Standings')}
    <div class="toggle-group" role="tablist" aria-label="Championship">
      <button data-value="drivers" role="tab">Drivers</button>
      <button data-value="constructors" role="tab">Constructors</button>
    </div>
    <div id="standings-panel"><ul class="standings" id="standings-list"></ul></div>`;

  const list = root.querySelector('#standings-list');
  const panel = root.querySelector('#standings-panel');

  const show = (selected) => {
    history.replaceState(history.state, '', selected === 'drivers' ? '#/standings' : `#/standings/${selected}`);
    const rows = selected === 'drivers' ? data.drivers.map(driverRow) : data.constructors.map(teamRow);
    const max = Number((selected === 'drivers' ? data.drivers : data.constructors)[0]?.points) || 1;
    list.innerHTML = rows.length
      ? rows.map((row, i) => rowHtml(row, i, max)).join('')
      : '<li><span></span><p class="empty">No standings yet this season.</p></li>';
  };

  setupTabs(root.querySelector('[role="tablist"]'), panel, show).select(tab === 'constructors' ? tab : 'drivers');
}

function driverRow(d) {
  const team = d.Constructors.at(-1)?.name ?? '';
  return { pos: d.position ?? d.positionText, name: driverName(d.Driver), href: `#/driver/${d.Driver.driverId}`, sub: `${team} · ${d.wins} wins`, points: d.points };
}

function teamRow(c) {
  return { pos: c.position ?? c.positionText, name: c.Constructor.name, href: `#/team/${c.Constructor.constructorId}`, sub: `${c.Constructor.nationality} · ${c.wins} wins`, points: c.points };
}

function rowHtml(row, index, max) {
  return `
    <li class="${index === 0 ? 'leader' : ''}">
      <span class="pos">${esc(row.pos)}</span>
      <div><strong><a class="inline-link" href="${esc(row.href)}">${esc(row.name)}</a></strong><small>${esc(row.sub)}</small></div>
      ${bar((Number(row.points) / max) * 100)}
      <span class="pts">${esc(row.points)}</span>
    </li>`;
}
