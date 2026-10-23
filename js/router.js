// Minimal hash router. Each view module exports:
//   load(params)              -> Promise of data
//   render(root, data, params) -> optional cleanup function
//   title                     -> page title, or a function (data, params) => title
//   nav (optional)            -> which header link to highlight
const root = () => document.getElementById('app');

let routes = {};
let fallback = '';
let cleanup = null;
let renderToken = 0;
let firstRender = true;

export function startRouter(routeTable, defaultRoute) {
  routes = routeTable;
  fallback = defaultRoute;
  window.addEventListener('hashchange', handle);
  handle();
}

// "#/results/12" -> { name: "results", params: ["12"] }
function parseHash() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  return { name: parts[0] ?? fallback, params: parts.slice(1) };
}

async function handle() {
  const { name, params } = parseHash();
  const view = routes[name];
  if (!view) {
    location.hash = '#/';
    return;
  }

  if (cleanup) cleanup();
  cleanup = null;
  updateNav(view.nav ?? name); // sub-pages can highlight their parent section

  const token = ++renderToken;
  const el = root();
  el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading</div>';
  window.scrollTo(0, 0);

  try {
    const data = await view.load(params);
    if (token !== renderToken) return; // the user navigated away meanwhile
    cleanup = view.render(el, data, params) ?? null;
    setTitle(typeof view.title === 'function' ? view.title(data, params) : view.title);
    announcePage(el);
  } catch (err) {
    if (token !== renderToken) return;
    console.error(err);
    el.innerHTML = `
      <div class="card error-card">
        <p class="eyebrow">Box, box</p>
        <h2 class="card-title">Couldn't load data</h2>
        <p>The F1 data service didn't respond. Check your connection and try again.</p>
        <button class="btn" id="retry">Retry</button>
      </div>`;
    el.querySelector('#retry').addEventListener('click', handle);
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
