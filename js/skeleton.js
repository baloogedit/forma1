// Grey placeholders in the shape of each page, shown while its data loads.
// They reuse the real layout classes, so they collapse on phones like the page does.
const block = (cls = '') => `<div class="skeleton ${cls}"></div>`;
const repeat = (n, html) => Array.from({ length: n }, () => html).join('');

const head = `
  <div class="page-head">
    ${block('sk-eyebrow')}
    ${block('sk-title')}
  </div>`;

const SHAPES = {
  dashboard: `
    <div class="dash-grid">
      ${block('sk-hero')}
      ${repeat(3, block('sk-card'))}
    </div>`,
  cards: `<div class="cal-grid">${repeat(9, block('sk-card'))}</div>`,
  list: `<div class="sk-list">${repeat(8, block('sk-row'))}</div>`,
};

// kind: 'dashboard' | 'cards' | 'list'
export function skeleton(kind = 'list') {
  return `
    <div aria-hidden="true">${head}${SHAPES[kind] ?? SHAPES.list}</div>
    <p class="sr-only" role="status">Loading</p>`;
}

// Placeholder rows for a table that is loading inside a page.
export function tableSkeleton(rows = 6) {
  return `
    <div class="sk-list" aria-hidden="true">${repeat(rows, block('sk-row small'))}</div>
    <p class="sr-only" role="status">Loading</p>`;
}
