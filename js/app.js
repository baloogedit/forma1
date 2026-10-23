import { startRouter } from './router.js';
import { startStatus } from './status.js';

startStatus();
// Each view is a separate module that is only downloaded when its page is first visited.
startRouter({
  pitwall: () => import('./views/pitwall.js'),
  calendar: () => import('./views/calendar.js'),
  results: () => import('./views/results.js'),
  standings: () => import('./views/standings.js'),
  records: () => import('./views/records.js'),
  weekend: () => import('./views/weekend.js'),
  driver: () => import('./views/driver.js'),
  team: () => import('./views/team.js'),
}, 'pitwall');

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

// Offline support and "install app": the service worker caches the app's own files (see sw.js).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((err) => console.warn('Service worker not registered', err));
  });
}
