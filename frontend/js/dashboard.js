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
  var farmerId = getFarmerId();
  var el = document.getElementById('expenseSummary');
  var skeleton = document.getElementById('expenseSkeleton');

  if (!farmerId) {
    skeleton.classList.add('hidden');
    el.textContent = '—';
    return;
  }

  getExpenses(farmerId).then(function (expenses) {
    skeleton.classList.add('hidden');
    if (!expenses || expenses.length === 0) {
      el.textContent = 'KES 0.00';
      return;
    }
    var total = expenses.reduce(function (sum, e) { return sum + (parseFloat(e.amount) || 0); }, 0);
    el.textContent = formatCurrency(total);
  }).catch(function () {
    skeleton.classList.add('hidden');
    el.textContent = '—';
  });
}

function loadLatestTip() {
  var el = document.getElementById('tipContent');
  var skeleton = document.getElementById('tipSkeleton');

  var cached = (function () { try { return JSON.parse(localStorage.getItem('kilimowise_insights_cache')); } catch (e) { return null; } })();
  if (cached && cached.tips && cached.tips.length > 0) {
    skeleton.classList.add('hidden');
    el.textContent = cached.tips[0].content;
    return;
  }

  skeleton.classList.add('hidden');
  el.textContent = 'Rotate crops every season to maintain soil fertility.';
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
