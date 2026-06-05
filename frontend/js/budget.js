var EXPENSES_KEY = 'kilimowise_expenses';
var isOfflineMode = false;

document.addEventListener('DOMContentLoaded', function () {
  redirectIfNotLoggedIn();
  loadExpenses();
});

function getCategoryLabel(cat) {
  var labels = {
    seeds: __('budget.seeds'),
    fertilizer: __('budget.fertilizer'),
    pesticides: __('budget.pesticides'),
    veterinary: __('budget.veterinary'),
    labor: __('budget.labor'),
    transport: __('budget.transport'),
    other: __('budget.other')
  };
  return labels[cat] || cat;
}

function handleAddExpense() {
  var category = document.getElementById('expenseCategory').value;
  var amount = parseFloat(document.getElementById('expenseAmount').value);
  var description = document.getElementById('expenseDescription').value.trim();
  var errorEl = document.getElementById('budgetError');

  errorEl.classList.add('hidden');

  if (!category || isNaN(amount) || amount <= 0) {
    errorEl.textContent = __('common.error') + ': ' + __('budget.category') + ' & ' + __('budget.amount') + ' required';
    errorEl.classList.remove('hidden');
    return;
  }

  var farmer = getFarmer();
  var btn = document.getElementById('addBtn');
  btn.disabled = true;
  btn.textContent = __('common.loading');

  if (!isOfflineMode && farmer && farmer.id) {
    addExpense(farmer.id, category, amount, description).then(function () {
      btn.disabled = false;
      btn.textContent = __('budget.add');
      document.getElementById('expenseAmount').value = '';
      document.getElementById('expenseDescription').value = '';
      loadExpenses();
      showToast('Expense added!', 'success');
    }).catch(function () {
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
    createdAt: new Date().toISOString()
  });
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  isOfflineMode = true;
  document.getElementById('offlineBanner').classList.remove('hidden');
  document.getElementById('expenseAmount').value = '';
  document.getElementById('expenseDescription').value = '';
  loadExpenses();
  showToast('Expense saved (offline)', 'info');
}

function loadExpenses() {
  var farmer = getFarmer();
  var listEl = document.getElementById('expenseList');
  var totalEl = document.getElementById('totalExpenses');
  var emptyEl = document.getElementById('emptyState');
  var loadingEl = document.getElementById('loadingExpenses');

  loadingEl.classList.remove('hidden');
  listEl.innerHTML = '';
  totalEl.textContent = 'KES 0.00';

  if (!isOfflineMode && farmer && farmer.id) {
    getExpenses(farmer.id).then(function (expenses) {
      loadingEl.classList.add('hidden');
      if (!expenses || expenses.length === 0) {
        emptyEl.classList.remove('hidden');
        return;
      }
      emptyEl.classList.add('hidden');
      renderExpenses(expenses);
    }).catch(function () {
      fallbackLoadExpenses(loadingEl, emptyEl, listEl, totalEl);
    });
  } else {
    fallbackLoadExpenses(loadingEl, emptyEl, listEl, totalEl);
  }
}

function fallbackLoadExpenses(loadingEl, emptyEl, listEl, totalEl) {
  var expenses = JSON.parse(localStorage.getItem(EXPENSES_KEY) || '[]');
  loadingEl.classList.add('hidden');
  if (expenses.length === 0) {
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');
  isOfflineMode = true;
  document.getElementById('offlineBanner').classList.remove('hidden');
  renderExpenses(expenses);
}

function renderExpenses(expenses) {
  var listEl = document.getElementById('expenseList');
  var totalEl = document.getElementById('totalExpenses');
  var total = 0;

  listEl.innerHTML = '';
  expenses.forEach(function (exp) {
    total += parseFloat(exp.amount) || 0;
    var div = document.createElement('div');
    div.className = 'expense-item';
    div.innerHTML =
      '<div class="expense-left">' +
        '<div><span class="badge badge-category">' + escapeHtml(getCategoryLabel(exp.category)) + '</span></div>' +
        '<div class="expense-desc">' + escapeHtml(exp.description || '') + '</div>' +
        '<div class="expense-date">' + formatDate(exp.createdAt) + '</div>' +
      '</div>' +
      '<div class="expense-amount">' + formatCurrency(exp.amount) + '</div>';
    listEl.appendChild(div);
  });

  totalEl.textContent = formatCurrency(total);
}
