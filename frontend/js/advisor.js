/* =====================================================================
   KiliMoWise — AI Advisor
   ===================================================================== */

var ADVISOR_HISTORY_KEY = 'kilimowise_advice_history';
var ADVISOR_MAX_HISTORY = 8;
var selectedImageBase64 = null;

function $(id) {
  return document.getElementById(id);
}

function hideEl(el) { if (el) el.classList.add('hidden'); }
function showEl(el) { if (el) el.classList.remove('hidden'); }

document.addEventListener('DOMContentLoaded', function () {
  redirectIfNotLoggedIn();
  renderHistory();
  bindImageUpload();
});

function bindImageUpload() {
  var imageInput = $('imageInput');
  if (!imageInput) return;

  var previewWrap = $('imagePreview');
  var previewImg = $('previewImg');
  var removeBtn = $('removeImageBtn');
  var uploadZone = $('uploadZone');
  var uploadTitle = $('uploadTitle');

  imageInput.addEventListener('change', function (e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      showToast(__('advisor.imageTooLarge') || 'Image too large (max 6MB)', 'error');
      imageInput.value = '';
      return;
    }
    compressImage(file, 1024, 0.78).then(function (base64) {
      selectedImageBase64 = base64;
      if (previewImg) previewImg.src = 'data:image/jpeg;base64,' + base64;
      showEl(previewWrap);
      if (uploadTitle) {
        uploadTitle.textContent = '✓ ' + __('advisor.imageAttached');
        uploadTitle.style.color = 'var(--success)';
      }
      showToast(__('advisor.attachmentAdded'), 'success');
    }).catch(function () {
      showToast(__('advisor.imageReadError') || 'Could not read image', 'error');
    });
  });

  if (removeBtn) {
    removeBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      selectedImageBase64 = null;
      imageInput.value = '';
      hideEl(previewWrap);
      if (previewImg) previewImg.src = '';
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
    uploadZone.addEventListener('drop', function (e) {
      var files = e.dataTransfer && e.dataTransfer.files;
      if (!files || files.length === 0) return;
      imageInput.files = files;
      imageInput.dispatchEvent(new Event('change'));
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

function setAskBtnLoading(btn, loading) {
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner sm"></span> ' + __('common.loading');
  } else {
    btn.disabled = false;
    btn.innerHTML = '<span id="askIconRestore"></span> ' + __('advisor.ask');
    var ir = $('askIconRestore');
    if (ir && window.svg) ir.appendChild(window.svg('sparkles', 18));
  }
}

function handleAnalyze() {
  var inputEl = $('problemInput');
  var input = inputEl ? inputEl.value.trim() : '';
  var typeEl = $('typeSelect');
  var type = typeEl ? typeEl.value : 'CROP';
  var farmerId = getFarmerId();
  var resultsEl = $('results');
  var errorEl = $('error');
  var errorMsg = $('errorMsg');
  var btn = $('askBtn');
  var emptyEl = $('emptyState');
  var loadingEl = $('loadingState');

  hideEl(errorEl);
  hideEl(resultsEl);
  hideEl(emptyEl);

  if (!input) {
    if (errorMsg) errorMsg.textContent = __('advisor.describe') + ' ' + __('common.required');
    showEl(errorEl);
    return;
  }
  if (!farmerId) {
    if (errorMsg) errorMsg.textContent = __('auth.invalidCredentials');
    showEl(errorEl);
    return;
  }

  showEl(loadingEl);
  setAskBtnLoading(btn, true);

  analyzeProblem(farmerId, type, input, selectedImageBase64).then(function (result) {
    hideEl(loadingEl);
    setAskBtnLoading(btn, false);
    if (result) {
      displayResults(result);
      saveAdviceToHistory(result, input, type);
      renderHistory();
    } else {
      if (errorMsg) errorMsg.textContent = __('advisor.error');
      showEl(errorEl);
    }
  }).catch(function (err) {
    hideEl(loadingEl);
    setAskBtnLoading(btn, false);
    var msg = err && err.message === 'unauthorized'
      ? __('auth.invalidCredentials')
      : (err && err.message ? err.message : __('advisor.error'));
    if (errorMsg) errorMsg.textContent = msg;
    showEl(errorEl);
  });
}

function extractPriceAmount(priceStr) {
  if (!priceStr) return { amount: null, unit: '' };
  var s = String(priceStr);
  var rangeMatch = s.match(/KES\s*([\d,]+(?:\.\d+)?)\s*[-–]\s*([\d,]+(?:\.\d+)?)/i);
  if (rangeMatch) {
    var lo = parseFloat(rangeMatch[1].replace(/,/g, ''));
    var hi = parseFloat(rangeMatch[2].replace(/,/g, ''));
    return { amount: (lo + hi) / 2, unit: 'KES', range: { lo: lo, hi: hi }, full: s };
  }
  var singleMatch = s.match(/KES\s*([\d,]+(?:\.\d+)?)/i);
  if (singleMatch) {
    return { amount: parseFloat(singleMatch[1].replace(/,/g, '')), unit: 'KES', full: s };
  }
  return { amount: null, unit: '', full: s };
}

function displayResults(result) {
  if (!result) return;
  var resultsEl = $('results');
  var diagnosisEl = $('diagnosisContent');
  var solutionEl = $('solutionContent');
  var confidenceEl = $('confidenceValue');
  var confidenceFill = $('confidenceFill');
  var remediesList = $('remediesList');
  var remediesEmpty = $('remediesEmpty');

  if (diagnosisEl) diagnosisEl.textContent = result.diagnosis || '—';
  if (solutionEl) solutionEl.textContent = result.solution || '—';

  var conf = normalizeConfidence(result.confidence);
  if (confidenceEl) confidenceEl.textContent = conf + '%';
  if (confidenceFill) {
    requestAnimationFrame(function () {
      confidenceFill.style.width = conf + '%';
      confidenceFill.classList.remove('confidence-low', 'confidence-mid', 'confidence-high');
      if (conf < 50) confidenceFill.classList.add('confidence-low');
      else if (conf < 75) confidenceFill.classList.add('confidence-mid');
      else confidenceFill.classList.add('confidence-high');
    });
  }

  if (remediesList) {
    remediesList.innerHTML = '';
    if (result.remedies && result.remedies.length > 0) {
      hideEl(remediesEmpty);
      result.remedies.forEach(function (r, i) {
        remediesList.appendChild(renderRemedyCard(r, i));
      });
    } else {
      showEl(remediesEmpty);
    }
  }

  showEl(resultsEl);
  if (resultsEl) resultsEl.style.display = 'flex';
  setTimeout(function () {
    if (resultsEl && resultsEl.scrollIntoView) {
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
}

function renderRemedyCard(r, index) {
  var card = document.createElement('div');
  card.className = 'remedy-card fade-up';
  card.style.animationDelay = (index * 80) + 'ms';

  var name = r.name || '—';
  var priceText = r.estimatedPrice || __('advisor.priceNA');
  var amount = r.amountNeeded || '—';
  var location = r.availabilityLocation || '—';

  var priceInfo = extractPriceAmount(priceText);
  var priceDisplay = '';
  if (priceInfo.range) {
    priceDisplay = '<div class="remedy-price-amount num">KES ' + priceInfo.range.lo.toLocaleString('en-KE') + ' &ndash; ' + priceInfo.range.hi.toLocaleString('en-KE') + '</div>';
  } else if (priceInfo.amount) {
    priceDisplay = '<div class="remedy-price-amount num">KES ' + priceInfo.amount.toLocaleString('en-KE') + '</div>';
  } else {
    priceDisplay = '<div class="remedy-price-amount num">—</div>';
  }

  card.innerHTML =
    '<div class="remedy-head">' +
      '<div class="remedy-icon" style="background: var(--harvest-100); color: var(--harvest-700);"></div>' +
      '<div class="remedy-title-block">' +
        '<div class="remedy-name">' + escapeHtml(name) + '</div>' +
        '<div class="remedy-price-row">' + priceDisplay +
          (priceText && !priceInfo.amount && !priceInfo.range ? '<div class="remedy-price-full">' + escapeHtml(priceText) + '</div>' : '') +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="remedy-meta">' +
      '<div class="remedy-meta-item">' +
        '<span class="remedy-meta-icon" data-meta="amount"></span>' +
        '<div><div class="remedy-meta-label">' + __('advisor.amount') + '</div>' +
        '<div class="remedy-meta-value">' + escapeHtml(amount) + '</div></div>' +
      '</div>' +
      '<div class="remedy-meta-item">' +
        '<span class="remedy-meta-icon" data-meta="loc"></span>' +
        '<div><div class="remedy-meta-label">' + __('advisor.location') + '</div>' +
        '<div class="remedy-meta-value">' + escapeHtml(location) + '</div></div>' +
      '</div>' +
    '</div>';

  var iconEl = card.querySelector('.remedy-icon');
  if (iconEl && window.svg) iconEl.appendChild(window.svg('shopping', 18));

  var amountIcon = card.querySelector('[data-meta="amount"]');
  if (amountIcon && window.svg) amountIcon.appendChild(window.svg('flask', 14));
  var locIcon = card.querySelector('[data-meta="loc"]');
  if (locIcon && window.svg) locIcon.appendChild(window.svg('pin', 14));

  return card;
}

function saveAdviceToHistory(result, input, type) {
  var entry = {
    input: input,
    type: type,
    diagnosis: result.diagnosis,
    solution: result.solution,
    confidence: result.confidence,
    remedies: result.remedies || [],
    createdAt: new Date().toISOString()
  };
  saveToHistory(ADVISOR_HISTORY_KEY, entry, ADVISOR_MAX_HISTORY);
}

function renderHistory() {
  var section = $('historySection');
  var list = $('historyList');
  if (!list) return;
  var history = getFromHistory(ADVISOR_HISTORY_KEY);
  if (history.length === 0) {
    hideEl(section);
    return;
  }
  showEl(section);
  list.innerHTML = '';
  history.forEach(function (h) {
    var card = document.createElement('div');
    card.className = 'card fade-up';
    card.style.cursor = 'pointer';
    var conf = normalizeConfidence(h.confidence);
    card.innerHTML =
      '<div class="card-header">' +
        '<div style="min-width: 0; flex: 1;">' +
          '<div class="card-title" style="font-size: var(--text-base);">' + escapeHtml(h.diagnosis || '—') + '</div>' +
          '<div class="card-subtitle">' + formatDate(h.createdAt) + ' · ' + (h.type === 'ANIMAL' ? __('advisor.animal') : __('advisor.crop')) + '</div>' +
        '</div>' +
        '<span class="badge">' + conf + '%</span>' +
      '</div>' +
      '<p class="text-secondary" style="font-size: var(--text-sm); margin: 0;">' + escapeHtml((h.input || '').substring(0, 140)) + ((h.input || '').length > 140 ? '…' : '') + '</p>';
    card.addEventListener('click', function () {
      var input = $('problemInput');
      if (input) input.value = h.input || '';
      displayResults({
        diagnosis: h.diagnosis,
        solution: h.solution,
        confidence: h.confidence,
        remedies: h.remedies || []
      });
    });
    list.appendChild(card);
  });
}
