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
  var uploadZone = document.getElementById('uploadZone');
  var uploadTitle = document.getElementById('uploadTitle');

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
      previewImg.src = 'data:image/jpeg;base64,' + base64;
      previewWrap.classList.remove('hidden');
      if (uploadTitle) {
        uploadTitle.textContent = '✓ ' + __('advisor.imageAttached');
        uploadTitle.style.color = 'var(--success)';
      }
      showToast(__('advisor.attachmentAdded'), 'success');
    }).catch(function () {
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
      if (uploadTitle) {
        uploadTitle.textContent = __('advisor.upload');
        uploadTitle.style.color = '';
      }
      showToast(__('advisor.imageRemoved'), 'info');
    });
  }

  if (uploadZone) {
    ['dragenter', 'dragover'].forEach(function (ev) {
      uploadZone.addEventListener(ev, function (e) { e.preventDefault(); uploadZone.classList.add('dragover'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      uploadZone.addEventListener(ev, function (e) { e.preventDefault(); uploadZone.classList.remove('dragover'); });
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
  var inputEl = document.getElementById('problemInput');
  var input = inputEl ? inputEl.value.trim() : '';
  var type = document.getElementById('typeSelect').value;
  var farmerId = getFarmerId();
  var resultsEl = document.getElementById('results');
  var errorEl = document.getElementById('error');
  var errorMsg = document.getElementById('errorMsg');
  var btn = document.getElementById('askBtn');
  var emptyEl = document.getElementById('emptyState');
  var loadingEl = document.getElementById('loadingState');

  errorEl.classList.add('hidden');
  resultsEl.classList.add('hidden');
  emptyEl.classList.add('hidden');

  if (!input) {
    errorMsg.textContent = __('advisor.describe') + ' ' + __('common.required');
    errorEl.classList.remove('hidden');
    return;
  }
  if (!farmerId) {
    errorMsg.textContent = __('auth.invalidCredentials');
    errorEl.classList.remove('hidden');
    return;
  }

  loadingEl.classList.remove('hidden');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner sm"></span> ' + __('common.loading');

  analyzeProblem(farmerId, type, input, selectedImageBase64).then(function (result) {
    loadingEl.classList.add('hidden');
    btn.disabled = false;
    btn.innerHTML = '<span id="askIconRestore"></span> ' + __('advisor.ask');
    var ir = document.getElementById('askIconRestore');
    if (ir) ir.appendChild(window.svg('sparkles', 18));
    displayResults(result);
    saveAdviceToHistory(result, input, type);
    renderHistory();
  }).catch(function (err) {
    loadingEl.classList.add('hidden');
    btn.disabled = false;
    btn.innerHTML = '<span id="askIconRestore"></span> ' + __('advisor.ask');
    var ir = document.getElementById('askIconRestore');
    if (ir) ir.appendChild(window.svg('sparkles', 18));
    var msg = err && err.message === 'unauthorized' ? __('auth.invalidCredentials') : (err && err.message ? err.message : __('advisor.error'));
    errorMsg.textContent = msg;
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

  var conf = normalizeConfidence(result.confidence);
  confidenceEl.textContent = conf + '%';
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
        '<td class="num">' + escapeHtml(r.estimatedPrice || '—') + '</td>' +
        '<td>' + escapeHtml(r.amountNeeded || '—') + '</td>' +
        '<td>' + escapeHtml(r.availabilityLocation || '—') + '</td>';
      remediesBody.appendChild(tr);
    });
  } else {
    remediesSection.classList.add('hidden');
  }

  resultsEl.classList.remove('hidden');
  resultsEl.style.display = 'flex';
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

  if (!history || history.length === 0) {
    if (section) section.classList.add('hidden');
    return;
  }
  if (section) section.classList.remove('hidden');
  if (!el) return;
  el.innerHTML = '';

  history.forEach(function (item) {
    var card = document.createElement('button');
    card.type = 'button';
    card.className = 'insight-card fade-up';
    card.style.cssText = 'text-align: left; width: 100%; border: 1px solid var(--border-soft); background: var(--surface); padding: var(--s-4); border-radius: var(--r-lg); cursor: pointer; font-family: inherit; color: inherit; position: relative;';
    var conf = normalizeConfidence(item.confidence);
    var iconName = item.type === 'ANIMAL' ? 'tractor' : 'sprout';
    var cardClass = item.type === 'ANIMAL' ? 'alt' : '';
    card.className = 'insight-card ' + cardClass + ' fade-up';
    card.innerHTML =
      '<div class="flex justify-between items-center mb-2">' +
        '<div class="flex items-center gap-2">' +
          '<span class="icon-wrap" style="display:inline-flex;color:var(--text-muted);"></span>' +
          '<strong style="font-family: var(--font-display); font-size: var(--text-md); font-weight: 500;">' + escapeHtml(item.diagnosis || __('advisor.diagnosis')) + '</strong>' +
        '</div>' +
        '<span class="badge primary">' + conf + '%</span>' +
      '</div>' +
      '<p class="text-secondary" style="font-size: var(--text-sm); margin-bottom: var(--s-2);">' + escapeHtml(item.input || '') + '</p>' +
      '<small class="text-muted num" style="font-size: var(--text-xs);">' + formatDate(item.generatedAt) + '</small>';
    card.querySelector('.icon-wrap').appendChild(window.svg(iconName, 16));
    card.addEventListener('click', function () {
      var inputEl = document.getElementById('problemInput');
      if (inputEl) inputEl.value = item.input || '';
      displayResults(item);
    });
    el.appendChild(card);
  });
}
