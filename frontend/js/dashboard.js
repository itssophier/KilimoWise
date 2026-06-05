document.addEventListener('DOMContentLoaded', function () {
  redirectIfNotLoggedIn();
  loadFarmerName();
  loadExpensesSummary();
  loadLatestTip();
  loadLatestDiagnosis();
});

function loadFarmerName() {
  var farmer = getFarmer();
  var el = document.getElementById('welcomeName');
  if (farmer && farmer.name) {
    el.textContent = farmer.name;
  } else {
    el.textContent = __('auth.welcome');
  }
}

function loadExpensesSummary() {
  var farmer = getFarmer();
  var el = document.getElementById('expenseSummary');
  var skeleton = document.getElementById('expenseSkeleton');

  if (!farmer || !farmer.id) {
    skeleton.classList.add('hidden');
    el.textContent = '—';
    return;
  }

  getExpenses(farmer.id).then(function (expenses) {
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

  getInsights().then(function (data) {
    skeleton.classList.add('hidden');
    if (data.tips && data.tips.length > 0) {
      el.textContent = data.tips[0].content;
    } else {
      el.textContent = __('insights.empty');
    }
  }).catch(function () {
    skeleton.classList.add('hidden');
    el.textContent = __('insights.empty');
  });
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
