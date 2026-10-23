import { startRouter } from './router.js';
import * as pitwall from './views/pitwall.js';
import * as calendar from './views/calendar.js';
import * as results from './views/results.js';
import * as standings from './views/standings.js';
import * as records from './views/records.js';
import * as weekend from './views/weekend.js';

startRouter({ pitwall, calendar, results, standings, records, weekend }, 'pitwall');
