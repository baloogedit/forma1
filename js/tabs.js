// WAI-ARIA tabs: the role="tab" buttons inside `tablist` switch one shared
// role="tabpanel". Arrow keys / Home / End move between tabs (roving tabindex),
// and selecting a tab calls onSelect(value) with the tab's data-value.
let uid = 0;

export function setupTabs(tablist, panel, onSelect) {
  const tabs = [...tablist.querySelectorAll('[role="tab"]')];
  const prefix = `tabs-${++uid}`;

  panel.id ||= `${prefix}-panel`;
  panel.setAttribute('role', 'tabpanel');
  panel.tabIndex = 0;
  tabs.forEach((tab, i) => {
    tab.id ||= `${prefix}-tab-${i}`;
    tab.type = 'button';
    tab.setAttribute('aria-controls', panel.id);
  });

  function activate(tab, { focus = false } = {}) {
    tabs.forEach((t) => {
      const selected = t === tab;
      t.setAttribute('aria-selected', selected);
      t.tabIndex = selected ? 0 : -1;
      t.classList.toggle('active', selected);
    });
    panel.setAttribute('aria-labelledby', tab.id);
    if (focus) tab.focus();
    onSelect(tab.dataset.value);
  }

  tablist.addEventListener('click', (event) => {
    const tab = event.target.closest('[role="tab"]');
    if (tab) activate(tab);
  });

  tablist.addEventListener('keydown', (event) => {
    const index = tabs.indexOf(document.activeElement);
    if (index === -1) return;
    const target = {
      ArrowRight: tabs[(index + 1) % tabs.length],
      ArrowLeft: tabs[(index - 1 + tabs.length) % tabs.length],
      Home: tabs[0],
      End: tabs.at(-1),
    }[event.key];
    if (!target) return;
    event.preventDefault();
    activate(target, { focus: true });
  });

  return {
    select(value) {
      const tab = tabs.find((t) => t.dataset.value === value);
      if (tab) activate(tab);
    },
  };
}
