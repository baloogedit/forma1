// Minimal hash router. Each view module exports:
//   load(params)              -> Promise of data
//   render(root, data, params) -> optional cleanup function
//   title                     -> page title, or a function (data, params) => title
//   nav (optional)            -> which header link to highlight
//   skeleton (optional)       -> placeholder shape while loading: 'dashboard' | 'cards' | 'list'
import { skeleton } from './skeleton.js';
import { resetDataAge, getDataAge } from './api.js';
import { setDataTime } from './status.js';

const root = () => document.getElementById('app');

let routes = {};
let fallback = '';
let cleanup = null;
let renderToken = 0;
let firstRender = true;

export function startRouter(routeTable, defaultRoute) {
  routes = routeTable;
  fallback = defaultRoute;
  window.addEventListener('hashchange', () => handle());
  listenForRefreshes();
  handle();
}

// Pages render from saved data first; when a background refresh brings in new
// data, re-render the current page in place. Refreshes arrive in bursts (one
// per endpoint), so wait for them to settle.
function listenForRefreshes() {
  let timer = null;
  let changed = false;
  window.addEventListener('pitlane:refreshed', (event) => {
    changed ||= event.detail.changed;
    clearTimeout(timer);
    timer = setTimeout(() => {
      handle({ silent: true, rerender: changed });
      changed = false;
    }, 400);
  });
}

// "#/results/12" -> { name: "results", params: ["12"] }
function parseHash() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  return { name: parts[0] ?? fallback, params: parts.slice(1) };
}

// silent: refresh the current page in place (no skeleton, keep scroll and focus
// position). rerender: false only re-reads the data to update its age.
async function handle({ silent = false, rerender = true } = {}) {
  const { name, params } = parseHash();
  const view = routes[name];
  if (!view) {
    location.hash = '#/';
    return;
  }

  const token = ++renderToken;
  const el = root();
  if (!silent) {
    if (cleanup) cleanup();
    cleanup = null;
    updateNav(view.nav ?? name); // sub-pages can highlight their parent section
    el.innerHTML = skeleton(view.skeleton);
    window.scrollTo(0, 0);
  }

  resetDataAge();
  try {
    const data = await view.load(params);
    if (token !== renderToken) return; // the user navigated away meanwhile
    if (rerender) {
      const scrollY = window.scrollY;
      if (cleanup) cleanup();
      cleanup = view.render(el, data, params) ?? null;
      setTitle(typeof view.title === 'function' ? view.title(data, params) : view.title);
      if (silent) window.scrollTo(0, scrollY);
      else announcePage(el);
    }
    setDataTime(getDataAge());
  } catch (err) {
    if (silent || token !== renderToken) return; // keep showing what we have
    console.error(err);
    el.innerHTML = `
      <div class="card error-card">
        <p class="eyebrow">Box, box</p>
        <h2 class="card-title">Couldn't load data</h2>
        <p>The F1 data service didn't respond. Check your connection and try again.</p>
        <button class="btn" id="retry">Retry</button>
      </div>`;
    el.querySelector('#retry').addEventListener('click', () => handle());
  }
}

function updateNav(name) {
  document.querySelectorAll('#nav a').forEach((a) => {
    const active = a.dataset.route === name;
    a.classList.toggle('active', active);
    if (active) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

function setTitle(title) {
  document.title = title ? `${title} – PIT/LANE` : 'PIT/LANE – Formula 1';
}

// After an in-app navigation, move focus to the new content like a real page
// load would, so keyboard and screen-reader users start at the top of it.
// The first load is left alone: the browser already starts at the top.
function announcePage(el) {
  if (firstRender) {
    firstRender = false;
    return;
  }
  el.focus({ preventScroll: true });
}
