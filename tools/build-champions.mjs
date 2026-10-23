// Builds data/champions.json: final P1 of every season's drivers' and constructors' standings.
// The API only serves standings one season at a time, so this runs once per year
// instead of on every page load.
//
// Usage: node tools/build-champions.mjs data/champions.json <last finished season>
import { writeFileSync } from 'node:fs';

const [, , outFile, lastSeason] = process.argv;
const BASE = 'https://api.jolpi.ca/ergast/f1';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url);
    if (res.ok) return (await res.json()).MRData;
    await sleep(2000 * (attempt + 1));
  }
  throw new Error('failed ' + url);
}

const drivers = [];
const constructors = [];
for (let season = 1950; season <= Number(lastSeason); season++) {
  const d = await get(`${BASE}/${season}/driverStandings/1.json`);
  drivers.push(...d.StandingsTable.StandingsLists);
  await sleep(300);
  if (season >= 1958) {
    const c = await get(`${BASE}/${season}/constructorStandings/1.json`);
    constructors.push(...c.StandingsTable.StandingsLists);
    await sleep(300);
  }
  process.stdout.write(season + ' ');
}

writeFileSync(outFile, JSON.stringify({ lastSeason: Number(lastSeason), drivers, constructors }, null, 2) + '\n');
console.log('\nseasons', drivers.length, 'constructor seasons', constructors.length);
