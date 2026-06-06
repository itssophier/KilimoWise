var ADVISOR_HISTORY_KEY = 'kilimowise_advice_history';
var ADVISOR_MAX_HISTORY = 5;

document.addEventListener('DOMContentLoaded', function () {
  redirectIfNotLoggedIn();
  renderHistory();
});

function handleAnalyze() {
  var input = document.getElementById('problemInput').value.trim();
  var type = document.getElementById('typeSelect').value;
  var farmerId = getFarmerId();
  var resultsEl = document.getElementById('results');
  var errorEl = document.getElementById('error');
  var btn = document.getElementById('askBtn');
  var emptyEl = document.getElementById('emptyState');
  var loadingEl = document.getElementById('loadingState');

  errorEl.classList.add('hidden');
  resultsEl.classList.add('hidden');
  emptyEl.classList.add('hidden');

  if (!input) {
    errorEl.textContent = __('advisor.describe');
    errorEl.classList.remove('hidden');
    return;
  }

  if (!farmerId) {
    errorEl.textContent = __('advisor.error');
    errorEl.classList.remove('hidden');
    return;
  }

  loadingEl.classList.remove('hidden');
  btn.disabled = true;
  btn.textContent = __('common.loading');

  analyzeProblem(farmerId, type, input).then(function (result) {
    loadingEl.classList.add('hidden');
    btn.disabled = false;
    btn.textContent = __('advisor.ask');
    displayResults(result);
    saveAdviceToHistory(result, input, type);
    renderHistory();
  }).catch(function (err) {
    loadingEl.classList.add('hidden');
    btn.disabled = false;
    btn.textContent = __('advisor.ask');
    errorEl.textContent = __('advisor.error');
    errorEl.classList.remove('hidden');
  });
}

function displayResults(result) {
  var resultsEl = document.getElementById('results');
  var diagnosisEl = document.getElementById('diagnosisContent');
  var solutionEl = document.getElementById('solutionContent');
  var confidenceEl = document.getElementById('confidenceValue');
  var confidenceFill = document.getElementById('confidenceFill');
  var remediesBody = document.getElementById('remediesBody');
  var remediesSection = document.getElementById('remediesSection');

  diagnosisEl.textContent = result.diagnosis || '—';
  solutionEl.textContent = result.solution || '—';

  var conf = parseFloat(result.confidence) || 0;
  confidenceEl.textContent = (conf * 100).toFixed(0) + '%';
  confidenceFill.style.width = (conf * 100) + '%';

  if (result.remedies && result.remedies.length > 0) {
    remediesSection.classList.remove('hidden');
    remediesBody.innerHTML = '';
    result.remedies.forEach(function (r) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + escapeHtml(r.name || '—') + '</td>' +
        '<td>' + formatCurrency(r.estimatedPrice) + '</td>' +
        '<td>' + escapeHtml(r.amountNeeded || '—') + '</td>' +
        '<td>' + escapeHtml(r.availabilityLocation || '—') + '</td>';
      remediesBody.appendChild(tr);
    });
  } else {
    remediesSection.classList.add('hidden');
  }

  resultsEl.classList.remove('hidden');
  resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function saveAdviceToHistory(result, input, type) {
  var entry = {
    input: input,
    type: type,
    diagnosis: result.diagnosis,
    solution: result.solution,
    confidence: result.confidence,
    remedies: result.remedies,
    generatedAt: result.generatedAt || new Date().toISOString()
  };
  saveToHistory(ADVISOR_HISTORY_KEY, entry, ADVISOR_MAX_HISTORY);
}

function renderHistory() {
  var history = getFromHistory(ADVISOR_HISTORY_KEY);
  var el = document.getElementById('historyList');
  var section = document.getElementById('historySection');

  if (history.length === 0) {
    section.classList.add('hidden');
    return;
  }

  section.classList.remove('hidden');
  el.innerHTML = '';
  history.forEach(function (item, index) {
    var card = document.createElement('div');
    card.className = 'insight-card';
    card.style.cursor = 'pointer';
    card.innerHTML =
      '<div class="flex-between"><h3>' + escapeHtml(item.diagnosis || __('advisor.diagnosis')) + '</h3>' +
      '<span class="badge badge-confidence">' + ((parseFloat(item.confidence) || 0) * 100).toFixed(0) + '%</span></div>' +
      '<p class="text-secondary mb-8">' + escapeHtml(item.input || '') + '</p>' +
      '<small class="text-secondary">' + formatDate(item.generatedAt) + '</small>';
    card.addEventListener('click', function () {
      displayResults(item);
    });
    el.appendChild(card);
  });
}


