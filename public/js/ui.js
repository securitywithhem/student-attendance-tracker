// Small DOM helpers shared by the views.
(function () {
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ESC[c]);

  let toastTimer;
  function toast(message, kind = '') {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.className = `toast ${kind}`;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.hidden = true), 4000);
  }

  const today = () => new Date().toLocaleDateString('en-CA');

  function formatDate(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  function render(html) {
    const app = document.getElementById('app');
    app.innerHTML = html;
    return app;
  }

  function loading(label = 'Loading…') {
    render(`<div class="empty">${esc(label)}</div>`);
  }

  window.UI = { esc, toast, today, formatDate, render, loading };
})();
