var INSIGHTS_CACHE_KEY = 'kilimowise_insights_cache';

var STATIC_SEASONS = [
  { crop: 'Maize', season: 'Long Rains', description: 'Plant maize from March to May for best yields. Prepare soil with organic compost 2 weeks before planting.' },
  { crop: 'Wheat', season: 'Dry Season', description: 'Best planted from June to August. Requires well-drained soil and moderate irrigation.' },
  { crop: 'Beans', season: 'Short Rains', description: 'Plant beans from October to December. Intercrop with maize for better land utilization.' }
];

var STATIC_MARKET = [
  { title: 'Maize prices remain stable', content: 'Current market price for maize is KES 4,500 per 90kg bag. Demand expected to rise during the dry season.' },
  { title: 'Dairy product demand increasing', content: 'Milk demand increases by 15% during dry months. Farmers can expect better prices from June through August.' }
];

var STATIC_TIPS = [
  { content: 'Rotate crops every season to maintain soil fertility and reduce pest buildup.' },
  { content: 'Water your crops early morning or late evening to reduce evaporation loss.' },
  { content: 'Use organic manure to improve soil structure and water retention capacity.' },
  { content: 'Monitor weather forecasts regularly to plan planting and harvesting schedules.' }
];

document.addEventListener('DOMContentLoaded', function () {
  redirectIfNotLoggedIn();
  loadInsights();
});

function loadInsights() {
  showLoading(true);

  var cached = getCachedInsights();
  if (cached) {
    showLoading(false);
    renderInsights(cached);
    return;
  }

  var data = {
    seasons: STATIC_SEASONS,
    market: STATIC_MARKET,
    tips: STATIC_TIPS
  };
  cacheInsights(data);
  showLoading(false);
  renderInsights(data);
}

function renderInsights(data) {
  renderSeasons(data.seasons);
  renderMarket(data.market);
  renderTips(data.tips);
}

function renderSeasons(seasons) {
  var el = document.getElementById('seasonsList');
  var empty = document.getElementById('seasonsEmpty');
  el.innerHTML = '';

  if (!seasons || seasons.length === 0) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  seasons.forEach(function (s) {
    var card = document.createElement('div');
    card.className = 'insight-card';
    card.innerHTML =
      '<div class="flex-between mb-8">' +
        '<h3>' + escapeHtml(s.crop || '—') + '</h3>' +
        '<span class="badge badge-season">' + escapeHtml(s.season || '') + '</span>' +
      '</div>' +
      '<p>' + escapeHtml(s.description || '') + '</p>';
    el.appendChild(card);
  });
}

function renderMarket(market) {
  var el = document.getElementById('marketList');
  var empty = document.getElementById('marketEmpty');
  el.innerHTML = '';

  if (!market || market.length === 0) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  market.forEach(function (m) {
    var card = document.createElement('div');
    card.className = 'insight-card';
    card.innerHTML =
      '<h3>' + escapeHtml(m.title || '—') + '</h3>' +
      '<p>' + escapeHtml(m.content || '') + '</p>';
    el.appendChild(card);
  });
}

function renderTips(tips) {
  var el = document.getElementById('tipsList');
  var empty = document.getElementById('tipsEmpty');
  el.innerHTML = '';

  if (!tips || tips.length === 0) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  tips.forEach(function (t) {
    var card = document.createElement('div');
    card.className = 'insight-card';
    card.innerHTML = '<p>' + escapeHtml(t.content || '—') + '</p>';
    el.appendChild(card);
  });
}

function showLoading(show) {
  document.getElementById('loadingState').classList.toggle('hidden', !show);
}

function cacheInsights(data) {
  localStorage.setItem(INSIGHTS_CACHE_KEY, JSON.stringify(data));
}

function getCachedInsights() {
  try {
    return JSON.parse(localStorage.getItem(INSIGHTS_CACHE_KEY));
  } catch (e) {
    return null;
  }
}
