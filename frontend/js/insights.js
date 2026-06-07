var INSIGHTS_CACHE_KEY = 'kilimowise_insights_cache';
var INSIGHTS_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

var STATIC_SEASONS = [
  { title: 'Maize — Long Rains', content: 'Plant maize from March to May for best yields. Prepare soil with organic compost 2 weeks before planting.' },
  { title: 'Wheat — Dry Season', content: 'Best planted from June to August. Requires well-drained soil and moderate irrigation.' },
  { title: 'Beans — Short Rains', content: 'Plant beans from October to December. Intercrop with maize for better land utilization.' }
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

var fallbackInsights = {
  seasonal: STATIC_SEASONS,
  market: STATIC_MARKET,
  tips: STATIC_TIPS
};

function loadInsights(forceRefresh) {
  showLoading(true);
  hideMeta();

  var cached = getCachedInsights();
  if (!forceRefresh && cached && isCacheFresh(cached)) {
    showLoading(false);
    renderInsights(cached.payload);
    showMeta(__('insights.cached') + ' · ' + formatRelativeTime(cached.savedAt), false);
    return;
  }

  var farmerId = getFarmerId();
  if (!farmerId) {
    showLoading(false);
    renderInsights(fallbackInsights);
    showMeta('—', true);
    return;
  }

  if (typeof getInsightsApi !== 'function') {
    showLoading(false);
    renderInsights(fallbackInsights);
    showMeta('—', true);
    return;
  }

  getInsightsApi(farmerId).then(function (data) {
    showLoading(false);
    if (!data) {
      renderInsights(fallbackInsights);
      showMeta('—', true);
      return;
    }
    var payload = normalizeInsights(data);
    renderInsights(payload);
    cacheInsights({ payload: payload, savedAt: Date.now() });
    showMeta(__('insights.cached') + ' · ' + __('insights.justNow'), false);
  }).catch(function () {
    showLoading(false);
    if (cached && cached.payload) {
      renderInsights(cached.payload);
      showMeta(__('insights.offline') + ' · ' + formatRelativeTime(cached.savedAt), true);
    } else {
      renderInsights(fallbackInsights);
      showMeta('—', true);
    }
  });
}

function refreshInsights() {
  loadInsights(true);
}

function normalizeInsights(data) {
  function toItems(arr) {
    if (!arr) return [];
    return arr.map(function (x) {
      return { title: x.title || '', content: x.content || '' };
    }).filter(function (x) { return x.content; });
  }
  return {
    seasonal: toItems(data.seasonal),
    market: toItems(data.market),
    tips: toItems(data.tips)
  };
}

function renderInsights(data) {
  renderSeasons(data.seasonal);
  renderMarket(data.market);
  renderTips(data.tips);
}

function renderSeasons(seasons) {
  var el = document.getElementById('seasonsList');
  var empty = document.getElementById('seasonsEmpty');
  if (!el) return;
  el.innerHTML = '';

  if (!seasons || seasons.length === 0) {
    if (empty) empty.classList.remove('hidden');
    return;
  }
  if (empty) empty.classList.add('hidden');

  seasons.forEach(function (s) {
    var card = document.createElement('div');
    card.className = 'insight-card alt fade-up';
    card.innerHTML =
      '<div class="flex justify-between items-center mb-2">' +
        '<h3>' + escapeHtml(s.title || '—') + '</h3>' +
        '<span class="badge accent">' + __('insights.seasonal') + '</span>' +
      '</div>' +
      '<p>' + escapeHtml(s.content || '') + '</p>';
    el.appendChild(card);
  });
}

function renderMarket(market) {
  var el = document.getElementById('marketList');
  var empty = document.getElementById('marketEmpty');
  if (!el) return;
  el.innerHTML = '';

  if (!market || market.length === 0) {
    if (empty) empty.classList.remove('hidden');
    return;
  }
  if (empty) empty.classList.add('hidden');

  market.forEach(function (m) {
    var card = document.createElement('div');
    card.className = 'insight-card info fade-up';
    card.innerHTML =
      '<div class="flex justify-between items-center mb-2">' +
        '<h3>' + escapeHtml(m.title || '—') + '</h3>' +
        '<span class="badge info">' + __('insights.market') + '</span>' +
      '</div>' +
      '<p>' + escapeHtml(m.content || '') + '</p>';
    el.appendChild(card);
  });
}

function renderTips(tips) {
  var el = document.getElementById('tipsList');
  var empty = document.getElementById('tipsEmpty');
  if (!el) return;
  el.innerHTML = '';

  if (!tips || tips.length === 0) {
    if (empty) empty.classList.remove('hidden');
    return;
  }
  if (empty) empty.classList.add('hidden');

  tips.forEach(function (t, i) {
    var card = document.createElement('div');
    card.className = 'insight-card fade-up';
    var titleText = t.title && t.title.trim() ? t.title : __('insights.tips') + ' ' + (i + 1);
    card.innerHTML =
      '<div class="flex justify-between items-center mb-2">' +
        '<div class="flex items-center" style="gap: var(--s-2);">' +
          '<span class="list-item-icon" style="width:32px;height:32px;background:var(--primary-soft);color:var(--primary);"></span>' +
          '<h3 style="margin: 0;">' + escapeHtml(titleText) + '</h3>' +
        '</div>' +
        '<span class="badge primary">' + __('insights.tips') + '</span>' +
      '</div>' +
      '<p>' + escapeHtml(t.content || '—') + '</p>';
    card.querySelector('.list-item-icon').appendChild(window.svg('lightbulb', 16));
    el.appendChild(card);
  });
}

function showLoading(show) {
  var el = document.getElementById('loadingState');
  if (el) el.classList.toggle('hidden', !show);
}

function showMeta(text, isFallback) {
  var el = document.getElementById('insightMeta');
  if (!el) return;
  el.innerHTML = '';
  var ic = window.svg(isFallback ? 'wifi-off' : 'check', 12);
  el.appendChild(ic);
  el.appendChild(document.createTextNode(' ' + text));
}

function hideMeta() {
  var el = document.getElementById('insightMeta');
  if (el) el.innerHTML = '';
}

function formatRelativeTime(ts) {
  if (!ts) return '';
  var diff = Date.now() - ts;
  if (diff < 60_000) return __('insights.justNow');
  if (diff < 3_600_000) return Math.floor(diff / 60_000) + ' ' + __('insights.minAgo');
  if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + ' ' + __('insights.hrAgo');
  return Math.floor(diff / 86_400_000) + ' ' + __('insights.dayAgo');
}

function isCacheFresh(cached) {
  return cached && cached.savedAt && (Date.now() - cached.savedAt) < INSIGHTS_CACHE_TTL_MS;
}

function cacheInsights(data) {
  try { localStorage.setItem(INSIGHTS_CACHE_KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
}

function getCachedInsights() {
  try { return JSON.parse(localStorage.getItem(INSIGHTS_CACHE_KEY)); } catch (e) { return null; }
}

document.addEventListener('DOMContentLoaded', function () {
  redirectIfNotLoggedIn();
  loadInsights();
});

window.addEventListener('pageshow', function (e) {
  if (e.persisted) loadInsights(true);
});
window.addEventListener('focus', function () { loadInsights(true); });
document.addEventListener('visibilitychange', function () {
  if (!document.hidden) loadInsights(true);
});
