var INSIGHTS_CACHE_KEY = 'kilimowise_insights_cache';

document.addEventListener('DOMContentLoaded', function () {
  redirectIfNotLoggedIn();
  loadInsights();
});

function loadInsights() {
  showLoading(true);

  getInsights().then(function (data) {
    showLoading(false);
    clearCachedBanner();
    cacheInsights(data);
    renderInsights(data);
  }).catch(function () {
    showLoading(false);
    var cached = getCachedInsights();
    if (cached) {
      showCachedBanner();
      renderInsights(cached);
    } else {
      showAllEmpty();
    }
  });
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
        '<h3>' + escapeHtml(s.crop || s.season || '—') + '</h3>' +
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

function showAllEmpty() {
  document.getElementById('seasonsEmpty').classList.remove('hidden');
  document.getElementById('marketEmpty').classList.remove('hidden');
  document.getElementById('tipsEmpty').classList.remove('hidden');
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

function showCachedBanner() {
  var el = document.getElementById('cachedBanner');
  if (el) el.classList.remove('hidden');
}

function clearCachedBanner() {
  var el = document.getElementById('cachedBanner');
  if (el) el.classList.add('hidden');
}
