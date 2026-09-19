const STORAGE_KEY = 'c1n3m4_data';
let mode = 'linear';

const DEFAULT_DATA = [
  { time: new Date('2026-09-18T17:30:00').getTime(), visitors: 0,   views: 0    },
  { time: new Date('2026-09-18T18:15:00').getTime(), visitors: 45,  views: 0    },
  { time: new Date('2026-09-19T09:52:00').getTime(), visitors: 475, views: 2558 },
];

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function save(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    console.warn('localStorage unavailable — data won\'t persist');
  }
}

let data = load() ?? [...DEFAULT_DATA];
save(data);

function formatTimestamp(ts) {
  return new Date(ts).toLocaleString('en-GB', {
    day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}

function getRates() {
  if (data.length < 2) return null;
  const a = data[data.length - 2];
  const b = data[data.length - 1];
  const hrs = (b.time - a.time) / 3_600_000;
  return {
    visitors: (b.visitors - a.visitors) / hrs,
    views:    (b.views    - a.views)    / hrs,
  };
}

function getAvgRates() {
  if (data.length < 2) return null;
  const first = data[0];
  const last  = data[data.length - 1];
  const hrs = (last.time - first.time) / 3_600_000;
  return {
    visitors: (last.visitors - first.visitors) / hrs,
    views:    (last.views    - first.views)    / hrs,
  };
}

function predict(hours) {
  const last    = data[data.length - 1];
  const recent  = getRates();
  const avg     = getAvgRates();

  if (mode === 'linear') {
    const rv = recent.visitors * 0.7 + avg.visitors * 0.3;
    const rp = recent.views    * 0.7 + avg.views    * 0.3;
    return {
      visitors: Math.max(Math.round(last.visitors + rv * hours), last.visitors),
      views:    Math.max(Math.round(last.views    + rp * hours), last.views),
    };
  } else {
    const fv = Math.pow(1 + recent.visitors / Math.max(last.visitors, 1), hours);
    const fp = Math.pow(1 + recent.views    / Math.max(last.views,    1), hours);
    return {
      visitors: Math.max(Math.round(last.visitors * Math.min(fv, 8)), last.visitors),
      views:    Math.max(Math.round(last.views    * Math.min(fp, 8)), last.views),
    };
  }
}

function render() {
  renderStats();
  renderPredictions();
  renderHistory();
}

function renderStats() {
  const last  = data.at(-1);
  const rates = getRates();

  document.getElementById('visitors').textContent = last
    ? last.visitors.toLocaleString() : '0';
  document.getElementById('views').textContent = last
    ? last.views.toLocaleString() : '0';
  document.getElementById('vRate').textContent = rates
    ? rates.visitors.toFixed(1) : '—';
  document.getElementById('pRate').textContent = rates
    ? rates.views.toFixed(0) : '—';
}

function renderPredictions() {
  const box = document.getElementById('predictions');
  if (data.length < 2) {
    box.innerHTML = '<div class="empty">Add at least 2 data points</div>';
    return;
  }

  const TARGETS = [
    { label: 'In 6 h',   hours: 6   },
    { label: 'In 12 h',  hours: 12  },
    { label: 'In 24 h',  hours: 24  },
    { label: 'In 2 days', hours: 48  },
    { label: 'In 3 days', hours: 72  },
    { label: 'In 7 days', hours: 168 },
  ];

  box.innerHTML = TARGETS.map(({ label, hours }) => {
    const { visitors, views } = predict(hours);
    return `
      <div class="pred-row">
        <span class="pred-time">${label}</span>
        <div class="pred-vals">
          <div class="pred-main">${visitors.toLocaleString()} visitors</div>
          <div class="pred-sub">${views.toLocaleString()} views</div>
        </div>
      </div>`;
  }).join('');
}

function renderHistory() {
  const list = document.getElementById('historyList');
  if (data.length === 0) {
    list.innerHTML = '<div class="empty">No data yet</div>';
    return;
  }
  list.innerHTML = data.map((d, i) => `
    <div class="history-item">
      <div>
        <div>${formatTimestamp(d.time)}</div>
        <div class="history-meta">${d.visitors.toLocaleString()} visitors · ${d.views.toLocaleString()} views</div>
      </div>
      <button class="del-btn" onclick="deletePoint(${i})" aria-label="Delete">✕</button>
    </div>
  `).join('');
}

function addPoint() {
  const date     = document.getElementById('dateInput').value;
  const time     = document.getElementById('timeInput').value;
  const visitors = parseInt(document.getElementById('visitorsInput').value, 10);
  const views    = parseInt(document.getElementById('viewsInput').value, 10);

  if (!date || !time || isNaN(visitors) || isNaN(views)) {
    alert('Please fill in all four fields.');
    return;
  }

  data.push({ time: new Date(`${date}T${time}:00`).getTime(), visitors, views });
  data.sort((a, b) => a.time - b.time);
  save(data);

  document.getElementById('visitorsInput').value = '';
  document.getElementById('viewsInput').value    = '';
  setDefaultDateTime();
  render();
}

function deletePoint(index) {
  data.splice(index, 1);
  save(data);
  render();
}

function clearAll() {
  if (confirm('Delete all data points?')) {
    data = [];
    save(data);
    render();
  }
}

function setMode(m) {
  mode = m;
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === m);
  });
  renderPredictions();
}

function setDefaultDateTime() {
  const now = new Date();
  document.getElementById('dateInput').value = now.toISOString().slice(0, 10);
  document.getElementById('timeInput').value = now.toTimeString().slice(0, 5);
}

setDefaultDateTime();
render();
