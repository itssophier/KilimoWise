var EXPENSES_KEY = 'kilimowise_expenses';
var isOfflineMode = false;
var categoryChart = null;
var trendChart = null;

document.addEventListener('DOMContentLoaded', function () {
  redirectIfNotLoggedIn();
  loadExpenses();
});

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
  var icons = { SEEDS: '🌱', FERTILIZER: '🧪', PESTICIDES: '🧴', VETERINARY: '🐄', LABOR: '👷', TRANSPORT: '🚚', OTHER: '📦' };
  return icons[cat] || '📦';
}

function getCategoryColor(cat) {
  var colors = {
    SEEDS: '#16a34a',
    FERTILIZER: '#0ea5e9',
    PESTICIDES: '#f59e0b',
    VETERINARY: '#a855f7',
    LABOR: '#ef4444',
    TRANSPORT: '#64748b',
    OTHER: '#94a3b8'
  };
  return colors[cat] || '#94a3b8';
}

function handleAddExpense() {
  var category = document.getElementById('expenseCategory').value;
  var amount = parseFloat(document.getElementById('expenseAmount').value);
  var description = document.getElementById('expenseDescription').value.trim();
  var errorEl = document.getElementById('budgetError');

  errorEl.classList.add('hidden');

  if (!category || isNaN(amount) || amount <= 0) {
    errorEl.textContent = __('budget.category') + ' & ' + __('budget.amount') + ' ' + __('common.required');
    errorEl.classList.remove('hidden');
    return;
  }

  var farmerId = getFarmerId();
  var btn = document.getElementById('addBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> ' + __('common.loading');

  if (!isOfflineMode && farmerId) {
    addExpense(farmerId, category, amount, description).then(function () {
      btn.disabled = false;
      btn.textContent = __('budget.add');
      document.getElementById('expenseAmount').value = '';
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
      btn.textContent = __('budget.add');
    });
  } else {
    fallbackAddExpense(category, amount, description);
    btn.disabled = false;
    btn.textContent = __('budget.add');
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

  loadingEl.classList.remove('hidden');
  containerEl.classList.add('hidden');
  listEl.innerHTML = '';
  totalEl.textContent = 'KES 0.00';

  if (!isOfflineMode && farmerId) {
    getExpenses(farmerId).then(function (expenses) {
      loadingEl.classList.add('hidden');
      if (!expenses || expenses.length === 0) {
        emptyEl.classList.remove('hidden');
        containerEl.classList.add('hidden');
        renderEmptyStats();
        return;
      }
      emptyEl.classList.add('hidden');
      containerEl.classList.remove('hidden');
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
  loadingEl.classList.add('hidden');
  isOfflineMode = true;
  var banner = document.getElementById('offlineBanner');
  if (banner) banner.classList.remove('hidden');
  if (expenses.length === 0) {
    emptyEl.classList.remove('hidden');
    containerEl.classList.add('hidden');
    renderEmptyStats();
    return;
  }
  emptyEl.classList.add('hidden');
  containerEl.classList.remove('hidden');
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
    var div = document.createElement('div');
    div.className = 'expense-item';
    div.innerHTML =
      '<div class="expense-left">' +
        '<div class="expense-category"><span class="badge badge-category">' + getCategoryIcon(exp.category) + ' ' + escapeHtml(getCategoryLabel(exp.category)) + '</span></div>' +
        '<div class="expense-desc">' + escapeHtml(exp.description || '—') + '</div>' +
        '<div class="expense-date">' + formatDate(exp.expenseDate) + '</div>' +
      '</div>' +
      '<div class="expense-amount">' + formatCurrency(amt) + '</div>';
    listEl.appendChild(div);
  });

  totalEl.textContent = formatCurrency(total);
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
  document.getElementById('statThisMonth').textContent = formatCurrency(stats.totalThisMonth || 0);
  document.getElementById('statLastMonth').textContent = formatCurrency(stats.totalLastMonth || 0);
  document.getElementById('statTopCategory').textContent = stats.topCategory
    ? getCategoryIcon(stats.topCategory) + ' ' + getCategoryLabel(stats.topCategory)
    : '—';

  var change = Number(stats.monthChangePercent) || 0;
  var changeEl = document.getElementById('statMonthChange');
  changeEl.textContent = (change > 0 ? '+' : '') + change.toFixed(0) + '%';
  changeEl.classList.remove('stat-value-up', 'stat-value-down');
  if (change > 0) changeEl.classList.add('stat-value-up');
  else if (change < 0) changeEl.classList.add('stat-value-down');

  renderCategoryChart(stats.byCategory || {});
  renderTrendChart(stats.monthlyTrend || []);
}

function renderEmptyStats() {
  document.getElementById('statThisMonth').textContent = 'KES 0';
  document.getElementById('statLastMonth').textContent = 'KES 0';
  document.getElementById('statTopCategory').textContent = '—';
  document.getElementById('statMonthChange').textContent = '0%';
  destroyChart('category');
  destroyChart('trend');
  document.getElementById('categoryChartEmpty').classList.remove('hidden');
  document.getElementById('trendChartEmpty').classList.remove('hidden');
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
    if (d) {
      monthly[d] = (monthly[d] || 0) + amt;
    }
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
  var keys = Object.keys(byCategory).filter(function (k) { return (byCategory[k] || 0) > 0; });
  if (keys.length === 0) {
    emptyEl.classList.remove('hidden');
    destroyChart('category');
    return;
  }
  emptyEl.classList.add('hidden');
  if (typeof Chart === 'undefined') return;

  var labels = keys.map(function (k) { return getCategoryIcon(k) + ' ' + getCategoryLabel(k); });
  var values = keys.map(function (k) { return Number(byCategory[k]) || 0; });
  var colors = keys.map(getCategoryColor);

  destroyChart('category');
  categoryChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderWidth: 0,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { family: 'Inter', size: 12 }, boxWidth: 12, padding: 12 }
        },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              return ctx.label + ': ' + formatCurrency(ctx.parsed);
            }
          }
        }
      }
    }
  });
}

function renderTrendChart(trend) {
  var canvas = document.getElementById('trendChart');
  var emptyEl = document.getElementById('trendChartEmpty');
  var total = trend.reduce(function (s, t) { return s + (Number(t.total) || 0); }, 0);
  if (total === 0 || trend.length === 0) {
    emptyEl.classList.remove('hidden');
    destroyChart('trend');
    return;
  }
  emptyEl.classList.add('hidden');
  if (typeof Chart === 'undefined') return;

  var labels = trend.map(function (t) { return t.month; });
  var values = trend.map(function (t) { return Number(t.total) || 0; });

  destroyChart('trend');
  trendChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: __('budget.total'),
        data: values,
        backgroundColor: 'rgba(22,163,74,0.18)',
        borderColor: '#16a34a',
        borderWidth: 2,
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
          callbacks: {
            label: function (ctx) { return formatCurrency(ctx.parsed.y); }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (v) { return 'KES ' + v; },
            font: { family: 'Inter', size: 11 }
          },
          grid: { color: 'rgba(148,163,184,0.15)' }
        },
        x: {
          ticks: { font: { family: 'Inter', size: 11 } },
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
