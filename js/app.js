import { startRouter } from './router.js';
import { startStatus } from './status.js';
import * as pitwall from './views/pitwall.js';
import * as calendar from './views/calendar.js';
import * as results from './views/results.js';
import * as standings from './views/standings.js';
import * as records from './views/records.js';
import * as weekend from './views/weekend.js';
import * as driver from './views/driver.js';
import * as team from './views/team.js';

startStatus();
startRouter({ pitwall, calendar, results, standings, records, weekend, driver, team }, 'pitwall');

// Light/dark toggle. Without a saved choice the system setting decides.
const THEME_KEY = 'pitlane:theme';
const toggle = document.getElementById('theme-toggle');
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

const currentTheme = () => document.documentElement.dataset.theme ?? (systemDark.matches ? 'dark' : 'light');

function updateToggle() {
  const dark = currentTheme() === 'dark';
  toggle.textContent = dark ? '☀' : '☾';
  toggle.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
}

toggle.addEventListener('click', () => {
  const theme = currentTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem(THEME_KEY, theme); } catch {}
  updateToggle();
});
systemDark.addEventListener('change', updateToggle);
updateToggle();
