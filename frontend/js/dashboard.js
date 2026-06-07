/* =====================================================================
   KiliMoWise — Dashboard
   ===================================================================== */

var DASH_FRESH_MS = 30 * 1000;
var DASH_STATE = {
  loading: false,
  lastFetch: 0
};

function getGreeting() {
  var h = new Date().getHours();
  if (h < 5) return __('dashboard.heroGreetingNight');
  if (h < 12) return __('dashboard.heroGreetingMorning');
  if (h < 17) return __('dashboard.heroGreetingAfternoon');
  if (h < 21) return __('dashboard.heroGreetingEvening');
  return __('dashboard.heroGreetingNight');
}

function timeOfDayClass() {
  var h = new Date().getHours();
  if (h < 5) return 'night';
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 21) return 'evening';
  return 'night';
}

function loadFarmerName() {
  var name = getFarmerName() || __('dashboard.heroNameFallback');
  var el = document.getElementById('heroName');
  if (el) el.textContent = name;
  var g = document.getElementById('heroGreeting');
  if (g && g.firstChild) g.firstChild.textContent = getGreeting();

  var loc = (function () {
    try { var p = JSON.parse(localStorage.getItem('kilimowise_profile') || 'null'); return p && p.location; } catch (e) { return null; }
  })();
  var locEl = document.getElementById('heroLocation');
  if (locEl) {
    locEl.textContent = loc ? '· ' + loc : '';
    locEl.style.display = loc ? '' : 'none';
  }
}

function setSkeletons() {
  ['statThisMonth', 'statLastMonth', 'statTopCategory', 'statMonthChange'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) { el.classList.add('skeleton', 'line'); el.textContent = ''; }
  });
}

function clearSkeletons() {
  ['statThisMonth', 'statLastMonth', 'statTopCategory', 'statMonthChange'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove('skeleton', 'line');
  });
}

function applyStats(stats) {
  if (!stats) return;
  clearSkeletons();

  var t = document.getElementById('statThisMonth');
  if (t) t.textContent = formatCurrency(stats.totalThisMonth || 0);

  var l = document.getElementById('statLastMonth');
  if (l) l.textContent = formatCurrency(stats.totalLastMonth || 0);

  var topEl = document.getElementById('statTopCategory');
  if (topEl) {
    topEl.textContent = stats.topCategory ? getCategoryLabel(stats.topCategory) : '—';
  }

  var change = Number(stats.monthChangePercent) || 0;
  var changeEl = document.getElementById('statMonthChange');
  if (changeEl) {
    var arrow = change > 0 ? '↑' : (change < 0 ? '↓' : '→');
    changeEl.textContent = arrow + ' ' + Math.abs(change).toFixed(0) + '%';
    changeEl.classList.remove('stat-value-up', 'stat-value-down', 'stat-value-flat');
    if (change > 0) changeEl.classList.add('stat-value-up');
    else if (change < 0) changeEl.classList.add('stat-value-down');
    else changeEl.classList.add('stat-value-flat');
  }

  var icon = document.getElementById('iconChange');
  if (icon) {
    icon.innerHTML = '';
    icon.appendChild(window.svg(change > 0 ? 'trending-up' : (change < 0 ? 'trending-down' : 'arrow-right'), 18));
  }
}

function renderEmptyStats() {
  clearSkeletons();
  setMoney(document.getElementById('statThisMonth'), 0);
  setMoney(document.getElementById('statLastMonth'), 0);
  var topEl = document.getElementById('statTopCategory');
  if (topEl) topEl.textContent = '—';
  var changeEl = document.getElementById('statMonthChange');
  if (changeEl) {
    changeEl.textContent = '→ 0%';
    changeEl.classList.remove('stat-value-up', 'stat-value-down');
    changeEl.classList.add('stat-value-flat');
  }
}

function setMoney(el, value) {
  if (el) el.textContent = formatCurrency(value || 0);
}

function loadExpensesSummary(forceRefresh) {
  var farmerId = getFarmerId();
  if (!farmerId) { renderEmptyStats(); return; }

  var now = Date.now();
  if (!forceRefresh && (now - DASH_STATE.lastFetch) < DASH_FRESH_MS) {
    return;
  }
  DASH_STATE.loading = true;

  if (typeof getExpenseStatsApi === 'function') {
    getExpenseStatsApi(farmerId).then(function (stats) {
      DASH_STATE.loading = false;
      DASH_STATE.lastFetch = Date.now();
      if (stats) {
        applyStats(stats);
        try { localStorage.setItem('kilimowise_stats_cache', JSON.stringify({ payload: stats, savedAt: Date.now() })); } catch (e) {}
      } else {
        fallbackStats(farmerId);
      }
    }).catch(function () {
      DASH_STATE.loading = false;
      fallbackStats(farmerId);
    });
  } else {
    fallbackStats(farmerId);
  }
}

function fallbackStats(farmerId) {
  getExpenses(farmerId).then(function (expenses) {
    if (!expenses || expenses.length === 0) { renderEmptyStats(); return; }
    var now = new Date();
    var ym = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    var lastDt = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    var lastYm = lastDt.getFullYear() + '-' + String(lastDt.getMonth() + 1).padStart(2, '0');
    var totalThis = 0, totalLast = 0;
    var byCat = {};
    expenses.forEach(function (e) {
      var amt = parseFloat(e.amount) || 0;
      var cat = e.category || 'OTHER';
      byCat[cat] = (byCat[cat] || 0) + amt;
      var d = e.expenseDate ? e.expenseDate.substring(0, 7) : '';
      if (d === ym) totalThis += amt;
      if (d === lastYm) totalLast += amt;
    });
    var change = totalLast > 0 ? ((totalThis - totalLast) / totalLast) * 100 : (totalThis > 0 ? 100 : 0);
    var topCat = null, topAmt = 0;
    Object.keys(byCat).forEach(function (k) {
      if (byCat[k] > topAmt) { topAmt = byCat[k]; topCat = k; }
    });
    applyStats({
      totalAllTime: expenses.reduce(function (s, e) { return s + (parseFloat(e.amount) || 0); }, 0),
      totalThisMonth: totalThis,
      totalLastMonth: totalLast,
      monthChangePercent: change,
      topCategory: topCat
    });
  }).catch(function () { renderEmptyStats(); });
}

function loadLatestTip(forceRefresh) {
  var el = document.getElementById('tipContent');
  var metaEl = document.getElementById('tipMeta');
  if (!el) return;

  function showFallback() {
    el.textContent = __('dashboard.tipFallback');
    if (metaEl) metaEl.textContent = '';
  }

  var farmerId = getFarmerId();
  if (!farmerId) { showFallback(); return; }

  var cached = null;
  try { cached = JSON.parse(localStorage.getItem('kilimowise_insights_cache') || 'null'); } catch (e) {}

  if (!forceRefresh && cached && cached.payload && cached.payload.tips && cached.payload.tips.length > 0) {
    el.textContent = cached.payload.tips[0].content;
    if (metaEl) metaEl.textContent = formatRelativeTime(cached.savedAt);
    return;
  }

  if (typeof getInsightsApi !== 'function') { showFallback(); return; }

  getInsightsApi(farmerId).then(function (data) {
    if (!data) { showFallback(); return; }
    try {
      localStorage.setItem('kilimowise_insights_cache', JSON.stringify({ payload: data, savedAt: Date.now() }));
    } catch (e) {}
    var tips = (data.tips || []).map(function (t) { return { content: t.content }; });
    if (tips.length === 0) { showFallback(); return; }
    el.textContent = tips[0].content;
    if (metaEl) metaEl.textContent = __('insights.fresh') + ' · ' + __('insights.today');
  }).catch(showFallback);
}

function formatRelativeTime(ts) {
  if (!ts) return '';
  var ms = Date.now() - ts;
  if (ms < 0) return '';
  var min = Math.floor(ms / 60000);
  if (min < 1) return __('insights.justNow');
  if (min < 60) return min + ' ' + __('insights.minAgo');
  var hr = Math.floor(min / 60);
  if (hr < 24) return hr + ' ' + __('insights.hrAgo');
  var days = Math.floor(hr / 24);
  if (days < 7) return days + ' ' + __('insights.dayAgo');
  return formatDate(new Date(ts).toISOString());
}

function loadLatestDiagnosis() {
  var section = document.getElementById('diagnosisSection');
  var titleEl = document.getElementById('diagnosisTitle');
  var previewEl = document.getElementById('diagnosisPreview');
  var badge = document.getElementById('diagnosisBadge');
  if (!section) return;

  var last = null;
  try { last = JSON.parse(localStorage.getItem('kilimowise_advice_history') || '[]')[0] || null; } catch (e) {}
  if (!last) {
    section.classList.add('hidden');
    return;
  }

  section.classList.remove('hidden');
  if (titleEl) titleEl.textContent = last.diagnosis || __('advisor.diagnosis');
  if (previewEl) previewEl.textContent = last.input || '';
  if (badge) {
    var conf = normalizeConfidence(last.confidence);
    badge.innerHTML = '';
    badge.appendChild(window.svg('leaf', 12));
    badge.appendChild(document.createTextNode(' ' + conf + '%'));
  }
}

function loadRecentExpenses(limit) {
  var listEl = document.getElementById('recentExpensesList');
  var emptyEl = document.getElementById('recentExpensesEmpty');
  if (!listEl) return;
  var farmerId = getFarmerId();
  if (!farmerId) {
    if (emptyEl) emptyEl.classList.remove('hidden');
    return;
  }
  getExpenses(farmerId).then(function (exps) {
    if (!exps || exps.length === 0) {
      if (emptyEl) emptyEl.classList.remove('hidden');
      return;
    }
    if (emptyEl) emptyEl.classList.add('hidden');
    listEl.innerHTML = '';
    exps.slice(0, limit || 3).forEach(function (e) {
      var row = document.createElement('div');
      row.className = 'kv';
      row.style.cssText = 'display:flex;align-items:center;gap:var(--s-3);padding:var(--s-3) 0;border-bottom:1px solid var(--border-soft);';
      var amt = parseFloat(e.amount) || 0;
      var iconColor = getCategoryColorSoft(e.category);
      row.innerHTML =
        '<span class="list-item-icon" style="width:36px;height:36px;border-radius:10px;background:' + iconColor + ';color:#fff;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;"></span>' +
        '<div class="list-item-body" style="flex:1;min-width:0;">' +
          '<div class="list-item-title">' + escapeHtml(getCategoryLabel(e.category)) + '</div>' +
          '<div class="list-item-meta">' + escapeHtml(e.description || '—') + ' · ' + formatDate(e.expenseDate) + '</div>' +
        '</div>' +
        '<div class="list-item-amount num">' + formatCurrency(amt) + '</div>';
      row.querySelector('.list-item-icon').appendChild(window.svg(getCategoryIcon(e.category), 18));
      listEl.appendChild(row);
    });
  }).catch(function () {
    if (emptyEl) emptyEl.classList.remove('hidden');
  });
}

function placeIcons() {
  var place = function (id, name) {
    var el = document.getElementById(id);
    if (el) el.appendChild(window.svg(name, 20));
  };
  place('iconTotal', 'wallet');
  place('iconLast', 'calendar');
  place('iconTop', 'tag');
  place('iconChange', 'trending-up');
  place('tipIcon', 'sun');
  place('ctaAskIcon', 'sparkles');
  place('ctaTrackIcon', 'plus');
  place('diagnosisArrow', 'arrow-right');
  place('qaAdvisor', 'sparkles');
  place('qaBudget', 'wallet');
  place('qaInsights', 'chart');
  place('qaProfile', 'user');
  place('tipRefresh', 'refresh');
  place('statsRefresh', 'refresh');
}

function init() {
  redirectIfNotLoggedIn();
  loadFarmerName();
  placeIcons();
  setSkeletons();
  loadExpensesSummary(true);
  loadLatestTip(true);
  loadLatestDiagnosis();
  loadRecentExpenses(3);

  var tipBtn = document.getElementById('tipRefresh');
  if (tipBtn) tipBtn.addEventListener('click', function () { loadLatestTip(true); });
  var statsBtn = document.getElementById('statsRefresh');
  if (statsBtn) statsBtn.addEventListener('click', function () { setSkeletons(); loadExpensesSummary(true); });

  if (window.shell && window.shell.applyPageFadeUp) window.shell.applyPageFadeUp();
}

document.addEventListener('DOMContentLoaded', init);

window.addEventListener('pageshow', function (event) {
  if (event.persisted) {
    DASH_STATE.lastFetch = 0;
    loadExpensesSummary(true);
    loadLatestTip(true);
    loadLatestDiagnosis();
    loadRecentExpenses(3);
  }
});

window.addEventListener('focus', function () {
  if (document.visibilityState === 'visible') {
    loadExpensesSummary(true);
    loadLatestTip(true);
  }
});

if ('visibilitychange' === 'visibilitychange') {
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      loadExpensesSummary(true);
      loadLatestTip(true);
    }
  });
}
