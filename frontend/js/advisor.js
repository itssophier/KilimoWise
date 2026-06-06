var ADVISOR_HISTORY_KEY = 'kilimowise_advice_history';
var ADVISOR_MAX_HISTORY = 5;
var selectedImageBase64 = null;

document.addEventListener('DOMContentLoaded', function () {
  redirectIfNotLoggedIn();
  renderHistory();
  bindImageUpload();
});

function bindImageUpload() {
  var imageInput = document.getElementById('imageInput');
  var previewWrap = document.getElementById('imagePreview');
  var previewImg = document.getElementById('previewImg');
  var removeBtn = document.getElementById('removeImageBtn');

  if (!imageInput) return;

  imageInput.addEventListener('change', function (e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      showToast('Image too large (max 6MB)', 'error');
      imageInput.value = '';
      return;
    }
    compressImage(file, 1024, 0.78).then(function (base64) {
      selectedImageBase64 = base64;
      previewImg.src = base64;
      previewWrap.classList.remove('hidden');
    }).catch(function (err) {
      showToast('Could not read image', 'error');
    });
  });

  if (removeBtn) {
    removeBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      selectedImageBase64 = null;
      imageInput.value = '';
      previewWrap.classList.add('hidden');
      previewImg.src = '';
    });
  }
}

function compressImage(file, maxDim, quality) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
        var w = Math.round(img.width * ratio);
        var h = Math.round(img.height * ratio);
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        var mime = file.type && file.type.indexOf('png') >= 0 ? 'image/png' : 'image/jpeg';
        var q = mime === 'image/png' ? undefined : quality;
        resolve(canvas.toDataURL(mime, q).split(',')[1]);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

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
    errorEl.textContent = __('auth.invalidCredentials');
    errorEl.classList.remove('hidden');
    return;
  }

  loadingEl.classList.remove('hidden');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> ' + __('common.loading');

  analyzeProblem(farmerId, type, input, selectedImageBase64).then(function (result) {
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
    var msg = err && err.message === 'unauthorized' ? __('auth.invalidCredentials') : __('advisor.error');
    errorEl.textContent = msg;
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
  if (conf > 0 && conf <= 1) conf = conf * 100;
  confidenceEl.textContent = conf.toFixed(0) + '%';
  requestAnimationFrame(function () {
    confidenceFill.style.width = conf + '%';
  });

  if (result.remedies && result.remedies.length > 0) {
    remediesSection.classList.remove('hidden');
    remediesBody.innerHTML = '';
    result.remedies.forEach(function (r) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + escapeHtml(r.name || '—') + '</td>' +
        '<td>' + escapeHtml(r.estimatedPrice || '—') + '</td>' +
        '<td>' + escapeHtml(r.amountNeeded || '—') + '</td>' +
        '<td>' + escapeHtml(r.availabilityLocation || '—') + '</td>';
      remediesBody.appendChild(tr);
    });
  } else {
    remediesSection.classList.add('hidden');
  }

  resultsEl.classList.remove('hidden');
  setTimeout(function () {
    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
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
  history.forEach(function (item) {
    var card = document.createElement('div');
    card.className = 'insight-card fade-up';
    var conf = parseFloat(item.confidence) || 0;
    if (conf > 0 && conf <= 1) conf = conf * 100;
    var badge = item.type === 'ANIMAL' ? '🐄' : '🌱';
    card.innerHTML =
      '<div class="flex-between mb-8"><h3>' + escapeHtml(item.diagnosis || __('advisor.diagnosis')) + '</h3>' +
      '<span class="badge badge-confidence">' + badge + ' ' + conf.toFixed(0) + '%</span></div>' +
      '<p class="text-secondary mb-8">' + escapeHtml(item.input || '') + '</p>' +
      '<small class="text-secondary">' + formatDate(item.generatedAt) + '</small>';
    card.addEventListener('click', function () {
      displayResults(item);
    });
    el.appendChild(card);
  });
}
