# PIT/LANE – Formula 1 SPA

A single-page application for following the Formula 1 season. It shows the race calendar with full weekend schedules, results for every session, the championship standings, driver and team profiles, and all-time records.

It is written in plain HTML, CSS and JavaScript (ES modules), with no framework, build step or dependencies. Live data comes from the free [Jolpica-F1 API](https://github.com/jolpica/jolpica-f1), the successor to Ergast.

## Running it

The app uses ES modules and a service worker. Browsers only allow both over `http://`, not when the file is opened directly (`file://`). Serve the folder with any static server, for example:

- **VS Code:** right-click `index.html` and choose **Open with Live Server** (Live Server extension).
- **Node:** `npx serve .`
- **Python:** `python -m http.server 8000`

Then open the address the server prints, for example `http://localhost:8000`.

> The service worker caches the app's files. After editing code, reload twice, or tick *Update on reload* under DevTools → Application → Service workers.

## Features

| Page | Route | What it shows |
|---|---|---|
| Pit Wall | `#/` | Next race with a live countdown and next session, season progress, top 5 drivers and teams |
| Calendar | `#/calendar` | Every round, marked done, next or upcoming, and sprint weekends |
| Race weekend | `#/weekend/:round` | Session timetable in local time with live/next markers, results tabs, "Add to calendar" (.ics) |
| Results | `#/results/:round?` | Finished races; each opens to Race / Sprint / Qualifying classifications |
| Standings | `#/standings/:tab?` | Drivers' and constructors' championship (`drivers` or `constructors` tab, kept in the URL) |
| Driver / Team | `#/driver/:id`, `#/team/:id` | Career totals (titles, wins, podiums, poles), current standing and this season's results |
| Records | `#/records` | Most titles, longest title streak, youngest champion, all world champions |

Other features:

- **Light and dark mode:** follows the system setting, can be toggled, and the choice is remembered.
- **Offline use and installation:** the app works offline and can be installed as a PWA. Previously viewed data is shown from the cache, with a banner when it can't be refreshed.
- **Team colours:** a team-colour marker next to names makes the tables quicker to scan.

## Architecture

```
index.html            app shell: header/nav, status banner, <main id="app">, footer
manifest.webmanifest  PWA metadata and icons
sw.js                 service worker: caches the app's own files (stale-while-revalidate)
css/
  style.css           theme tokens (light/dark), layout, components, responsive rules
  fonts.css           self-hosted Barlow and Bebas Neue (@font-face)
js/
  app.js              entry point: route table (lazy imports), theme toggle, SW registration
  router.js           hash router: skeletons, focus/title, scroll restoration, background refresh
  api.js              Jolpica client: localStorage cache, stale-while-revalidate, rate limiting
  status.js           "Updated x min ago" footer and offline banner
  utils.js            escaping, dates and session times, small HTML helpers
  sessions.js         Race / Sprint / Qualifying results tabs (Results and weekend pages)
  tabs.js             accessible tabs (WAI-ARIA pattern with keyboard support)
  skeleton.js         loading placeholders
  teams.js            team colours
  ics.js              iCalendar export of a race weekend
  views/              one module per page: pitwall, calendar, weekend, results,
                      standings, driver, team, records
data/champions.json   snapshot of every world champion 1950–2025
tools/                script that rebuilds the champions snapshot
fonts/, icons/        self-hosted fonts (with OFL licences) and app icons
```

### How a page is shown

1. `router.js` reads the hash (`#/results/12` gives the route `results` with parameters `["12"]`) and imports that view's module on first use.
2. It shows the view's loading skeleton and calls `view.load(params)`, which fetches the data through `api.js`.
3. It calls `view.render(root, data, params)`. The view writes its HTML and attaches its event handlers, and can return a cleanup function, such as the one that stops the countdown timer.
4. It sets the page title, moves focus to the content for screen readers, and restores the scroll position when the user came back with Back or Forward.

Each view module exports `load`, `render` and `title`, plus optionally `skeleton` (the loading shape) and `nav` (which header link to highlight).

### Data and caching

- **Stale-while-revalidate:** `api.js` saves every API response in `localStorage`, and saved data is returned immediately. When saved data is older than its lifetime (1 hour for season data, 1 day for career totals), it is also refreshed in the background. If the refreshed data differs, the router re-renders the page in place.
- **Rate limit:** Jolpica allows about 4 requests per second, so requests are spaced out, and an HTTP 429 response is retried with back-off.
- **Champions snapshot:** the API only returns championship standings one season at a time. Past champions therefore ship in `data/champions.json`, and only seasons finished after the snapshot are fetched live. To rebuild it:

  ```
  node tools/build-champions.mjs data/champions.json 2025
  ```

- **Service worker:** the service worker caches only the app's own files. API data stays in the `localStorage` cache described above.

### Accessibility

- **After navigation:** focus moves to the new content and the document title updates. The active nav link has `aria-current="page"`.
- **Keyboard:** a skip link leads to the content, `:focus-visible` outlines show where focus is, and the tabs follow the ARIA tab pattern (arrow keys, Home and End).
- **Screen readers:**
  - Accordion buttons are linked to their panels.
  - Tables have hidden captions.
  - The countdown has a text version that changes once a minute instead of every second.
- **Colour contrast:** text meets WCAG AA in both themes.
- **Reduced motion:** `prefers-reduced-motion` turns off animations and smooth scrolling.

## Limitations

- The data source has no timing results for free practice or sprint qualifying, so those sessions appear in the schedule only.
- Session end times are estimates (for example 60 minutes for practice), used to show "Live" and "Done".
- Team colours are approximate and kept by hand in `js/teams.js`.
