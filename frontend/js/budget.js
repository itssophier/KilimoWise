var EXPENSES_KEY = 'kilimowise_expenses';
var isOfflineMode = false;
var categoryChart = null;
var trendChart = null;

function getCategoryLabel(cat) {
  var labels = {
    SEEDS: __('budget.seeds'),
    FERTILIZER: __('budget.fertilizer'),
    PESTICIDES: __('budget.pesticides'),
    VETERINARY: __('budget.veterinary'),
    LABOR: __('budget.labor'),
    TRANSPORT: __('budget.transport'),
    OTHER: __('budget.other')
  };
  return labels[cat] || cat;
}

function getCategoryIcon(cat) {
  var icons = {
    SEEDS: 'sprout',
    FERTILIZER: 'flask',
    PESTICIDES: 'syringe',
    VETERINARY: 'tractor',
    LABOR: 'user',
    TRANSPORT: 'arrow-right',
    OTHER: 'tag'
  };
  return icons[cat] || 'tag';
}

function getCategoryColor(cat) {
  var colors = {
    SEEDS:       '#2a8a4f',
    FERTILIZER:  '#3a7ca5',
    PESTICIDES:  '#d99c2c',
    VETERINARY:  '#8a5fb8',
    LABOR:       '#b85a2e',
    TRANSPORT:   '#5b6b61',
    OTHER:       '#8a7a55'
  };
  return colors[cat] || '#8a7a55';
}

function getCategoryColorSoft(cat) {
  var colors = {
    SEEDS:       'rgba(42, 138, 79, 0.85)',
    FERTILIZER:  'rgba(58, 124, 165, 0.85)',
    PESTICIDES:  'rgba(217, 156, 44, 0.85)',
    VETERINARY:  'rgba(138, 95, 184, 0.85)',
    LABOR:       'rgba(184, 90, 46, 0.85)',
    TRANSPORT:   'rgba(91, 107, 97, 0.85)',
    OTHER:       'rgba(138, 122, 85, 0.85)'
  };
  return colors[cat] || 'rgba(138, 122, 85, 0.85)';
}

function getCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function showBudgetError(msg) {
  var errorEl = document.getElementById('budgetError');
  if (!errorEl) return;
  errorEl.querySelector('#budgetErrorMsg').textContent = msg;
  errorEl.classList.remove('hidden');
}

function hideBudgetError() {
  var errorEl = document.getElementById('budgetError');
  if (errorEl) errorEl.classList.add('hidden');
}

function handleAddExpense() {
  var category = document.getElementById('expenseCategory').value;
  var amountEl = document.getElementById('expenseAmount');
  var amount = parseFloat(amountEl.value);
  var description = document.getElementById('expenseDescription').value.trim();

  hideBudgetError();

  if (!category || isNaN(amount) || amount <= 0) {
    showBudgetError(__('budget.amount') + ' ' + __('common.required'));
    return;
  }

  var farmerId = getFarmerId();
  var btn = document.getElementById('addBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner sm"></span> ' + __('common.loading');

  if (!isOfflineMode && farmerId) {
    addExpense(farmerId, category, amount, description).then(function () {
      btn.disabled = false;
      btn.innerHTML = '<span id="addBtnIcon"></span> ' + __('budget.add');
      var i = document.getElementById('addBtnIcon');
      if (i) i.appendChild(window.svg('plus', 18));
      amountEl.value = '';
      document.getElementById('expenseDescription').value = '';
      loadExpenses();
      showToast(__('budget.addedSuccess'), 'success');
    }).catch(function (err) {
      if (err && err.message === 'unauthorized') {
        showToast(__('auth.invalidCredentials'), 'error');
        logout();
        return;
      }
      showToast(__('budget.fallback'), 'info');
      fallbackAddExpense(category, amount, description);
      btn.disabled = false;
      btn.innerHTML = '<span id="addBtnIcon"></span> ' + __('budget.add');
      var i = document.getElementById('addBtnIcon');
      if (i) i.appendChild(window.svg('plus', 18));
    });
  } else {
    fallbackAddExpense(category, amount, description);
    btn.disabled = false;
    btn.innerHTML = '<span id="addBtnIcon"></span> ' + __('budget.add');
    var i = document.getElementById('addBtnIcon');
    if (i) i.appendChild(window.svg('plus', 18));
  }
}

function fallbackAddExpense(category, amount, description) {
  var expenses = JSON.parse(localStorage.getItem(EXPENSES_KEY) || '[]');
  expenses.unshift({
    id: 'local_' + Date.now(),
    category: category,
    amount: amount,
    description: description,
    expenseDate: new Date().toISOString().split('T')[0]
  });
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  isOfflineMode = true;
  var banner = document.getElementById('offlineBanner');
  if (banner) banner.classList.remove('hidden');
  document.getElementById('expenseAmount').value = '';
  document.getElementById('expenseDescription').value = '';
  loadExpenses();
  showToast(__('budget.savedOffline'), 'info');
}

function loadExpenses() {
  var farmerId = getFarmerId();
  var listEl = document.getElementById('expenseList');
  var totalEl = document.getElementById('totalExpenses');
  var emptyEl = document.getElementById('emptyState');
  var loadingEl = document.getElementById('loadingExpenses');
  var containerEl = document.getElementById('expenseListContainer');

  if (loadingEl) loadingEl.classList.remove('hidden');
  if (containerEl) containerEl.classList.add('hidden');
  if (listEl) listEl.innerHTML = '';
  if (totalEl) totalEl.textContent = 'KES 0.00';

  if (!isOfflineMode && farmerId) {
    getExpenses(farmerId).then(function (expenses) {
      if (loadingEl) loadingEl.classList.add('hidden');
      if (!expenses || expenses.length === 0) {
        if (emptyEl) emptyEl.classList.remove('hidden');
        if (containerEl) containerEl.classList.add('hidden');
        renderEmptyStats();
        return;
      }
      if (emptyEl) emptyEl.classList.add('hidden');
      if (containerEl) containerEl.classList.remove('hidden');
      renderExpenses(expenses);
      loadExpenseStats(farmerId, expenses);
    }).catch(function () {
      fallbackLoadExpenses(loadingEl, emptyEl, listEl, totalEl, containerEl);
    });
  } else {
    fallbackLoadExpenses(loadingEl, emptyEl, listEl, totalEl, containerEl);
  }
}

function fallbackLoadExpenses(loadingEl, emptyEl, listEl, totalEl, containerEl) {
  var expenses = JSON.parse(localStorage.getItem(EXPENSES_KEY) || '[]');
  if (loadingEl) loadingEl.classList.add('hidden');
  isOfflineMode = true;
  var banner = document.getElementById('offlineBanner');
  if (banner) banner.classList.remove('hidden');
  if (expenses.length === 0) {
    if (emptyEl) emptyEl.classList.remove('hidden');
    if (containerEl) containerEl.classList.add('hidden');
    renderEmptyStats();
    return;
  }
  if (emptyEl) emptyEl.classList.add('hidden');
  if (containerEl) containerEl.classList.remove('hidden');
  renderExpenses(expenses);
  renderLocalStats(expenses);
}

function renderExpenses(expenses) {
  var listEl = document.getElementById('expenseList');
  var totalEl = document.getElementById('totalExpenses');
  var total = 0;

  listEl.innerHTML = '';
  expenses.forEach(function (exp) {
    var amt = parseFloat(exp.amount) || 0;
    total += amt;
    var row = document.createElement('div');
    row.className = 'kv';
    row.style.cssText = 'display: flex; align-items: center; gap: var(--s-3); padding: var(--s-3) 0; border-bottom: 1px solid var(--border-soft);';
    row.innerHTML =
      '<span class="list-item-icon" style="width:36px;height:36px;border-radius:10px;background:' + getCategoryColorSoft(exp.category) + ';color:#fff;display:inline-flex;align-items:center;justify-content:center;"></span>' +
      '<div class="list-item-body">' +
        '<div class="list-item-title">' + escapeHtml(getCategoryLabel(exp.category)) + '</div>' +
        '<div class="list-item-meta">' + escapeHtml(exp.description || '—') + ' · ' + formatDate(exp.expenseDate) + '</div>' +
      '</div>' +
      '<div class="list-item-amount num">' + formatCurrency(amt) + '</div>';
    row.querySelector('.list-item-icon').appendChild(window.svg(getCategoryIcon(exp.category), 18));
    listEl.appendChild(row);
  });

  if (totalEl) totalEl.textContent = formatCurrency(total);
}

function loadExpenseStats(farmerId, expenses) {
  if (typeof getExpenseStatsApi !== 'function') {
    renderLocalStats(expenses);
    return;
  }
  getExpenseStatsApi(farmerId).then(function (stats) {
    if (!stats) { renderLocalStats(expenses); return; }
    applyStats(stats);
  }).catch(function () {
    renderLocalStats(expenses);
  });
}

function applyStats(stats) {
  var t = document.getElementById('statThisMonth');
  var l = document.getElementById('statLastMonth');
  var top = document.getElementById('statTopCategory');
  var chg = document.getElementById('statMonthChange');
  if (t) t.textContent = formatCurrency(stats.totalThisMonth || 0);
  if (l) l.textContent = formatCurrency(stats.totalLastMonth || 0);
  if (top) top.textContent = stats.topCategory ? getCategoryLabel(stats.topCategory) : '—';

  var change = Number(stats.monthChangePercent) || 0;
  if (chg) {
    chg.textContent = (change > 0 ? '+' : '') + change.toFixed(0) + '%';
    chg.classList.remove('stat-value-up', 'stat-value-down');
    if (change > 0) chg.classList.add('stat-value-up');
    else if (change < 0) chg.classList.add('stat-value-down');
  }

  var icon = document.getElementById('iconChange');
  if (icon) {
    icon.innerHTML = '';
    icon.appendChild(window.svg(change > 0 ? 'trending-up' : (change < 0 ? 'trending-down' : 'arrow-right'), 18));
  }

  renderCategoryChart(stats.byCategory || {});
  renderTrendChart(stats.monthlyTrend || []);
}

function renderEmptyStats() {
  var fields = [
    ['statThisMonth', 'KES 0'],
    ['statLastMonth', 'KES 0'],
    ['statTopCategory', '—']
  ];
  fields.forEach(function (f) {
    var e = document.getElementById(f[0]);
    if (e) e.textContent = f[1];
  });
  var chg = document.getElementById('statMonthChange');
  if (chg) chg.textContent = '0%';
  destroyChart('category');
  destroyChart('trend');
  var c = document.getElementById('categoryChartEmpty');
  if (c) c.classList.remove('hidden');
  var t = document.getElementById('trendChartEmpty');
  if (t) t.classList.remove('hidden');
}

function renderLocalStats(expenses) {
  var now = new Date();
  var ym = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  var last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  var lastYm = last.getFullYear() + '-' + String(last.getMonth() + 1).padStart(2, '0');

  var totalThis = 0, totalLast = 0, totalAll = 0;
  var byCat = {};
  var monthly = {};

  expenses.forEach(function (e) {
    var amt = parseFloat(e.amount) || 0;
    totalAll += amt;
    var cat = e.category || 'OTHER';
    byCat[cat] = (byCat[cat] || 0) + amt;
    var d = e.expenseDate ? e.expenseDate.substring(0, 7) : '';
    if (d === ym) totalThis += amt;
    if (d === lastYm) totalLast += amt;
    if (d) monthly[d] = (monthly[d] || 0) + amt;
  });

  var change = totalLast > 0 ? ((totalThis - totalLast) / totalLast) * 100 : (totalThis > 0 ? 100 : 0);
  var topCat = null, topAmt = 0;
  Object.keys(byCat).forEach(function (k) {
    if (byCat[k] > topAmt) { topAmt = byCat[k]; topCat = k; }
  });

  var trend = [];
  for (var i = 5; i >= 0; i--) {
    var dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    var key = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0');
    var label = dt.toLocaleDateString('en-KE', { month: 'short' });
    trend.push({ month: label, total: monthly[key] || 0 });
  }

  applyStats({
    totalAllTime: totalAll,
    totalThisMonth: totalThis,
    totalLastMonth: totalLast,
    monthChangePercent: change,
    topCategory: topCat,
    topCategoryAmount: topAmt,
    byCategory: byCat,
    monthlyTrend: trend
  });
}

function renderCategoryChart(byCategory) {
  var canvas = document.getElementById('categoryChart');
  var emptyEl = document.getElementById('categoryChartEmpty');
  if (!canvas) return;
  var keys = Object.keys(byCategory).filter(function (k) { return (byCategory[k] || 0) > 0; });
  if (keys.length === 0) {
    if (emptyEl) emptyEl.classList.remove('hidden');
    destroyChart('category');
    return;
  }
  if (emptyEl) emptyEl.classList.add('hidden');
  if (typeof Chart === 'undefined') return;

  var labels = keys.map(function (k) { return getCategoryLabel(k); });
  var values = keys.map(function (k) { return Number(byCategory[k]) || 0; });
  var colors = keys.map(getCategoryColor);

  destroyChart('category');

  var textColor = getCssVar('--text-secondary');
  var gridColor = getCssVar('--border-soft');

  categoryChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderWidth: 3,
        borderColor: getCssVar('--surface') || '#fff',
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '64%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { family: 'Inter', size: 12, weight: 500 }, color: textColor, boxWidth: 10, boxHeight: 10, padding: 14, usePointStyle: true }
        },
        tooltip: {
          backgroundColor: getCssVar('--ink-950') || '#0f1a14',
          titleFont: { family: 'Inter', size: 12, weight: 600 },
          bodyFont: { family: 'Inter', size: 12 },
          padding: 10,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            label: function (ctx) { return ' ' + ctx.label + ': ' + formatCurrency(ctx.parsed); }
          }
        }
      }
    }
  });
}

function renderTrendChart(trend) {
  var canvas = document.getElementById('trendChart');
  var emptyEl = document.getElementById('trendChartEmpty');
  if (!canvas) return;
  var total = trend.reduce(function (s, t) { return s + (Number(t.total) || 0); }, 0);
  if (total === 0 || trend.length === 0) {
    if (emptyEl) emptyEl.classList.remove('hidden');
    destroyChart('trend');
    return;
  }
  if (emptyEl) emptyEl.classList.add('hidden');
  if (typeof Chart === 'undefined') return;

  var labels = trend.map(function (t) { return t.month; });
  var values = trend.map(function (t) { return Number(t.total) || 0; });

  destroyChart('trend');

  var textColor = getCssVar('--text-secondary');
  var gridColor = getCssVar('--border-soft');
  var primary = getCssVar('--primary') || '#2a8a4f';

  trendChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: __('budget.total'),
        data: values,
        backgroundColor: primary + '22',
        borderColor: primary,
        borderWidth: 1.5,
        borderRadius: 8,
        maxBarThickness: 36
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: getCssVar('--ink-950') || '#0f1a14',
          titleFont: { family: 'Inter', size: 12, weight: 600 },
          bodyFont: { family: 'Inter', size: 12 },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: function (ctx) { return ' ' + formatCurrency(ctx.parsed.y); }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: function (v) { return 'KES ' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v); }, font: { family: 'Inter', size: 11 }, color: textColor },
          grid: { color: gridColor, drawBorder: false }
        },
        x: {
          ticks: { font: { family: 'Inter', size: 11 }, color: textColor },
          grid: { display: false }
        }
      }
    }
  });
}

function destroyChart(name) {
  if (name === 'category' && categoryChart) { categoryChart.destroy(); categoryChart = null; }
  if (name === 'trend' && trendChart) { trendChart.destroy(); trendChart = null; }
}

document.addEventListener('DOMContentLoaded', function () {
  redirectIfNotLoggedIn();
  loadExpenses();
});
