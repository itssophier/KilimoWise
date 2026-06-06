function formatCurrency(amount) {
  var num = Number(amount) || 0;
  if (num >= 1000000) {
    return 'KES ' + (num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1) + 'M';
  }
  if (num >= 1000) {
    return 'KES ' + num.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
  return 'KES ' + num.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(isoString) {
  if (!isoString) return '';
  var d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(isoString) {
  if (!isoString) return '';
  var d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function showToast(message, type) {
  if (window.toast) return window.toast({ message: message, type: type || 'info' });
  // Fallback
  console.log('[' + (type || 'info') + ']', message);
}

function saveToHistory(key, item, max) {
  var history = JSON.parse(localStorage.getItem(key) || '[]');
  history.unshift(item);
  if (history.length > (max || 5)) history = history.slice(0, max || 5);
  localStorage.setItem(key, JSON.stringify(history));
}

function getFromHistory(key) {
  return JSON.parse(localStorage.getItem(key) || '[]');
}

function getLatestFromHistory(key) {
  var h = getFromHistory(key);
  return h.length > 0 ? h[0] : null;
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeConfidence(value) {
  if (value === null || value === undefined) return 0;
  var s = String(value).trim();
  if (!s) return 0;
  var hasPercent = s.indexOf('%') >= 0;
  var n = parseFloat(s);
  if (isNaN(n)) return 0;
  if (!hasPercent && n > 0 && n <= 1) n = n * 100;
  if (n < 0) n = 0;
  if (n > 100) n = 100;
  return Math.round(n);
}

function debounce(fn, ms) {
  var t;
  return function () {
    var args = arguments, ctx = this;
    clearTimeout(t);
    t = setTimeout(function () { fn.apply(ctx, args); }, ms);
  };
}

var CATEGORY_META = {
  SEEDS:      { icon: 'sprout',     color: '#2a8a4f', soft: 'rgba(42, 138, 79, 0.85)' },
  FERTILIZER: { icon: 'flask',      color: '#3a7ca5', soft: 'rgba(58, 124, 165, 0.85)' },
  PESTICIDES: { icon: 'syringe',    color: '#d99c2c', soft: 'rgba(217, 156, 44, 0.85)' },
  VETERINARY: { icon: 'tractor',    color: '#8a5fb8', soft: 'rgba(138, 95, 184, 0.85)' },
  LABOR:      { icon: 'user',       color: '#b85a2e', soft: 'rgba(184, 90, 46, 0.85)' },
  TRANSPORT:  { icon: 'arrow-right', color: '#5b6b61', soft: 'rgba(91, 107, 97, 0.85)' },
  OTHER:      { icon: 'tag',        color: '#8a7a55', soft: 'rgba(138, 122, 85, 0.85)' }
};

function getCategoryLabel(cat) {
  if (!cat) return '—';
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
  return (CATEGORY_META[cat] && CATEGORY_META[cat].icon) || 'tag';
}

function getCategoryColor(cat) {
  return (CATEGORY_META[cat] && CATEGORY_META[cat].color) || '#8a7a55';
}

function getCategoryColorSoft(cat) {
  return (CATEGORY_META[cat] && CATEGORY_META[cat].soft) || 'rgba(138, 122, 85, 0.85)';
}
