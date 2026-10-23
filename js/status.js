// "Updated 12 min ago" in the footer, and a banner when the app is showing
// saved data because it is offline or the API can't be reached.
let dataTime = null;
let refreshFailed = false;

const updatedEl = () => document.getElementById('updated');
const bannerEl = () => document.getElementById('status-banner');

// "just now", "12 min ago", "3 h ago", "2 days ago"
function ago(time) {
  const min = Math.floor((Date.now() - time) / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function render() {
  updatedEl().textContent = dataTime ? ` · Updated ${ago(dataTime)}` : '';

  const offline = !navigator.onLine;
  const banner = bannerEl();
  if ((offline || refreshFailed) && dataTime) {
    banner.textContent = offline
      ? `You're offline – showing saved data from ${ago(dataTime)}.`
      : `Couldn't reach the F1 data service – showing saved data from ${ago(dataTime)}.`;
    banner.hidden = false;
  } else {
    banner.hidden = true;
  }
}

// Called by the router after each render with the age of the page's data.
export function setDataTime(time) {
  dataTime = time;
  render();
}

export function startStatus() {
  window.addEventListener('pitlane:refreshed', () => { refreshFailed = false; render(); });
  window.addEventListener('pitlane:refresh-failed', () => { refreshFailed = true; render(); });
  window.addEventListener('online', render);
  window.addEventListener('offline', render);
  setInterval(render, 60 * 1000); // keep "x min ago" current
}
