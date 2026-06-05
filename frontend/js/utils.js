function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return 'KES ' + num.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function showToast(message, type) {
  var existing = document.querySelector('.toast-container');
  if (!existing) {
    existing = document.createElement('div');
    existing.className = 'toast-container';
    document.body.appendChild(existing);
  }
  var toast = document.createElement('div');
  toast.className = 'toast toast-' + (type || 'info');
  toast.textContent = message;
  existing.appendChild(toast);
  setTimeout(function () {
    toast.classList.add('toast-hide');
    setTimeout(function () { toast.remove(); }, 300);
  }, 3000);
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
  if (!str) return '';
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
