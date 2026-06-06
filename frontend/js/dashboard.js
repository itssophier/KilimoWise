function getGreeting() {
  var h = new Date().getHours();
  if (h < 12) return __('dashboard.heroGreetingMorning');
  if (h < 18) return __('dashboard.heroGreetingAfternoon');
  return __('dashboard.heroGreetingEvening');
}

function timeOfDayClass() {
  var h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

function loadFarmerName() {
  var name = getFarmerName() || __('dashboard.heroNameFallback');
  var el = document.getElementById('heroName');
  if (el) el.textContent = name;
  var g = document.getElementById('heroGreeting');
  if (g && g.firstChild) g.firstChild.textContent = getGreeting();
}

function setMoney(el, value) {
  if (el) el.textContent = formatCurrency(value || 0);
}

function setSkeletons() {
  ['statThisMonth', 'statLastMonth', 'statTopCategory', 'statMonthChange'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el && el.textContent === '') el.classList.add('skeleton', 'line');
  });
}

function applyStats(stats) {
  if (!stats) return;
  setMoney(document.getElementById('statThisMonth'), stats.totalThisMonth);
  setMoney(document.getElementById('statLastMonth'), stats.totalLastMonth);

  var topEl = document.getElementById('statTopCategory');
  if (stats.topCategory && typeof getCategoryLabel === 'function') {
    topEl.textContent = getCategoryLabel(stats.topCategory);
  } else {
    topEl.textContent = '—';
  }

  var change = Number(stats.monthChangePercent) || 0;
  var changeEl = document.getElementById('statMonthChange');
  changeEl.textContent = (change > 0 ? '+' : '') + change.toFixed(0) + '%';
  changeEl.classList.remove('stat-value-up', 'stat-value-down');
  if (change > 0) changeEl.classList.add('stat-value-up');
  else if (change < 0) changeEl.classList.add('stat-value-down');

  // also swap the change icon
  var icon = document.getElementById('iconChange');
  if (icon) {
    icon.innerHTML = '';
    icon.appendChild(window.svg(change > 0 ? 'trending-up' : (change < 0 ? 'trending-down' : 'arrow-right'), 18));
  }
}

function loadExpensesSummary() {
  var farmerId = getFarmerId();
  if (!farmerId) {
    renderEmpty();
    return;
  }
  // Try stats endpoint first
  if (typeof getExpenseStatsApi === 'function') {
    getExpenseStatsApi(farmerId).then(function (stats) {
      if (stats) {
        applyStats(stats);
      } else {
        fallbackStats(farmerId);
      }
    }).catch(function () { fallbackStats(farmerId); });
  } else {
    fallbackStats(farmerId);
  }
}

function fallbackStats(farmerId) {
  getExpenses(farmerId).then(function (expenses) {
    if (!expenses || expenses.length === 0) { renderEmpty(); return; }
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
  }).catch(function () { renderEmpty(); });
}

function renderEmpty() {
  setMoney(document.getElementById('statThisMonth'), 0);
  setMoney(document.getElementById('statLastMonth'), 0);
  var topEl = document.getElementById('statTopCategory');
  if (topEl) topEl.textContent = '—';
  var changeEl = document.getElementById('statMonthChange');
  if (changeEl) changeEl.textContent = '0%';
}

function loadLatestTip() {
  var el = document.getElementById('tipContent');
  if (!el) return;
  try {
    var cached = JSON.parse(localStorage.getItem('kilimowise_insights_cache'));
    if (cached && cached.payload && cached.payload.tips && cached.payload.tips.length > 0) {
      el.textContent = cached.payload.tips[0].content;
      return;
    }
  } catch (e) { /* ignore */ }
  el.textContent = 'Rotate crops every season to maintain soil fertility and reduce pest buildup.';
}

function loadLatestDiagnosis() {
  var section = document.getElementById('diagnosisSection');
  var titleEl = document.getElementById('diagnosisTitle');
  var previewEl = document.getElementById('diagnosisPreview');
  var badge = document.getElementById('diagnosisBadge');
  if (!section) return;

  var last = null;
  try { last = JSON.parse(localStorage.getItem('kilimowise_advice_history') || '[]')[0] || null; } catch (e) { /* ignore */ }
  if (!last) {
    section.classList.add('hidden');
    return;
  }

  section.classList.remove('hidden');
  titleEl.textContent = last.diagnosis || __('advisor.diagnosis');
  previewEl.textContent = last.input || '';
  var conf = normalizeConfidence(last.confidence);
  badge.innerHTML = '';
  badge.appendChild(window.svg('leaf', 12));
  badge.appendChild(document.createTextNode(' ' + conf + '%'));
}

document.addEventListener('DOMContentLoaded', function () {
  redirectIfNotLoggedIn();
  loadFarmerName();
  loadExpensesSummary();
  loadLatestTip();
  loadLatestDiagnosis();
});
