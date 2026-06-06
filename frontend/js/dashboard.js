document.addEventListener('DOMContentLoaded', function () {
  redirectIfNotLoggedIn();
  loadFarmerName();
  loadExpensesSummary();
  loadLatestTip();
  loadLatestDiagnosis();
});

function loadFarmerName() {
  var name = getFarmerName();
  var el = document.getElementById('welcomeName');
  el.textContent = name || __('auth.welcome');
}

function loadExpensesSummary() {
  var el = document.getElementById('expenseSummary');
  var farmerId = getFarmerId();

  if (!farmerId) {
    el.classList.remove('skeleton-line');
    el.textContent = '—';
    return;
  }

  getExpenses(farmerId).then(function (expenses) {
    el.classList.remove('skeleton-line');
    if (!expenses || expenses.length === 0) {
      el.textContent = 'KES 0.00';
      return;
    }
    var total = expenses.reduce(function (sum, e) { return sum + (parseFloat(e.amount) || 0); }, 0);
    el.textContent = formatCurrency(total);
  }).catch(function () {
    el.classList.remove('skeleton-line');
    el.textContent = '—';
  });
}

function loadLatestTip() {
  var el = document.getElementById('tipContent');

  try {
    var cached = JSON.parse(localStorage.getItem('kilimowise_insights_cache'));
    if (cached && cached.tips && cached.tips.length > 0) {
      el.textContent = cached.tips[0].content;
      return;
    }
  } catch (e) { /* ignore */ }

  el.textContent = 'Rotate crops every season to maintain soil fertility and reduce pest buildup.';
}

function loadLatestDiagnosis() {
  var el = document.getElementById('diagnosisPreview');
  var section = document.getElementById('diagnosisSection');

  var last = getLatestFromHistory('kilimowise_advice_history');
  if (last) {
    section.classList.remove('hidden');
    el.textContent = last.diagnosis || __('dashboard.noDiagnosis');
  } else {
    section.classList.add('hidden');
  }
}
