// Jolpica-F1 API (Ergast-compatible) with a localStorage cache.
const BASE = 'https://api.jolpi.ca/ergast/f1';
const PAGE_SIZE = 100; // the API caps `limit` at 100
const HOUR = 60 * 60 * 1000;
const CACHE_PREFIX = 'pitlane:';

function cacheRead(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function cacheWrite(key, data) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ time: Date.now(), data }));
  } catch {
    // storage full or blocked – the app still works without the cache
  }
}

// Fetch one endpoint and return its MRData. Falls back to stale cache when offline.
async function get(path, params = {}, ttl = HOUR) {
  const query = new URLSearchParams(params).toString();
  const key = path + (query ? '?' + query : '');
  const cached = cacheRead(key);
  if (cached && Date.now() - cached.time < ttl) return cached.data;

  try {
    const res = await fetch(`${BASE}${path}.json${query ? '?' + query : ''}`);
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const json = await res.json();
    // don't cache empty answers – results often appear a while after a session ends
    if (json.MRData.total !== '0') cacheWrite(key, json.MRData);
    return json.MRData;
  } catch (err) {
    if (cached) return cached.data;
    throw err;
  }
}

export async function getSchedule() {
  const data = await get('/current', { limit: PAGE_SIZE });
  return data.RaceTable.Races;
}

export async function getDriverStandings() {
  const data = await get('/current/driverStandings', { limit: PAGE_SIZE });
  return data.StandingsTable.StandingsLists[0]?.DriverStandings ?? [];
}

export async function getConstructorStandings() {
  const data = await get('/current/constructorStandings', { limit: PAGE_SIZE });
  return data.StandingsTable.StandingsLists[0]?.ConstructorStandings ?? [];
}

// Results are paginated per driver row, so one race can be split across pages – merge by round.
export async function getSeasonResults() {
  const byRound = new Map();
  let offset = 0;
  let total = Infinity;

  while (offset < total) {
    const data = await get('/current/results', { limit: PAGE_SIZE, offset });
    total = Number(data.total);
    for (const race of data.RaceTable.Races) {
      const existing = byRound.get(race.round);
      if (existing) existing.Results.push(...race.Results);
      else byRound.set(race.round, { ...race, Results: [...race.Results] });
    }
    offset += PAGE_SIZE;
  }

  return [...byRound.values()].sort((a, b) => b.round - a.round);
}

const SESSION_ENDPOINTS = {
  race: ['results', 'Results'],
  sprint: ['sprint', 'SprintResults'],
  qualifying: ['qualifying', 'QualifyingResults'],
};

// Classification of one session of one weekend. type: 'race' | 'sprint' | 'qualifying'
export async function getSessionResults(season, round, type) {
  const [path, key] = SESSION_ENDPOINTS[type];
  const data = await get(`/${season}/${round}/${path}`, { limit: PAGE_SIZE });
  return data.RaceTable.Races[0]?.[key] ?? [];
}

// The API only serves standings per season, so past champions ship as a snapshot
// (data/champions.json) and any season finished after it is fetched live.
export async function getChampions(lastFinishedSeason) {
  const res = await fetch('data/champions.json');
  if (!res.ok) throw new Error('Missing champions snapshot');
  const snapshot = await res.json();
  const drivers = [...snapshot.drivers];
  const constructors = [...snapshot.constructors];

  const WEEK = 7 * 24 * HOUR;
  for (let season = snapshot.lastSeason + 1; season <= lastFinishedSeason; season++) {
    const [d, c] = await Promise.all([
      get(`/${season}/driverStandings/1`, {}, WEEK),
      get(`/${season}/constructorStandings/1`, {}, WEEK),
    ]);
    drivers.push(...d.StandingsTable.StandingsLists);
    constructors.push(...c.StandingsTable.StandingsLists);
  }

  return { drivers, constructors };
}
