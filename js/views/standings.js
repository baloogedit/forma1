import { getDriverStandings, getConstructorStandings } from '../api.js';
import { esc, driverName, bar, pageHead } from '../utils.js';

let activeTab = 'drivers'; // remembered while the app is open

export const title = 'Standings';

export async function load() {
  const [drivers, constructors] = await Promise.all([getDriverStandings(), getConstructorStandings()]);
  return { drivers, constructors };
}

export function render(root, data) {
  root.innerHTML = `
    ${pageHead('World championship', 'Standings')}
    <div class="toggle-group" role="tablist">
      <button data-tab="drivers" role="tab">Drivers</button>
      <button data-tab="constructors" role="tab">Constructors</button>
    </div>
    <ul class="standings" id="standings-list"></ul>`;

  const list = root.querySelector('#standings-list');
  const buttons = root.querySelectorAll('[data-tab]');

  const show = (tab) => {
    activeTab = tab;
    buttons.forEach((b) => {
      b.classList.toggle('active', b.dataset.tab === tab);
      b.setAttribute('aria-selected', b.dataset.tab === tab);
    });
    const rows = tab === 'drivers' ? data.drivers.map(driverRow) : data.constructors.map(teamRow);
    const max = Number((tab === 'drivers' ? data.drivers : data.constructors)[0]?.points) || 1;
    list.innerHTML = rows.length
      ? rows.map((row, i) => rowHtml(row, i, max)).join('')
      : '<li><span></span><p class="empty">No standings yet this season.</p></li>';
  };

  buttons.forEach((b) => b.addEventListener('click', () => show(b.dataset.tab)));
  show(activeTab);
}

function driverRow(d) {
  const team = d.Constructors.at(-1)?.name ?? '';
  return { pos: d.position ?? d.positionText, name: driverName(d.Driver), sub: `${team} · ${d.wins} wins`, points: d.points };
}

function teamRow(c) {
  return { pos: c.position ?? c.positionText, name: c.Constructor.name, sub: `${c.Constructor.nationality} · ${c.wins} wins`, points: c.points };
}

function rowHtml(row, index, max) {
  return `
    <li class="${index === 0 ? 'leader' : ''}">
      <span class="pos">${esc(row.pos)}</span>
      <div><strong>${esc(row.name)}</strong><small>${esc(row.sub)}</small></div>
      ${bar((Number(row.points) / max) * 100)}
      <span class="pts">${esc(row.points)}</span>
    </li>`;
}
