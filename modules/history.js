// FILE: modules/history.js
// PURPOSE: הצגת היסטוריית חיפושים שמורה ב-localStorage
// EXPORTS: HistoryModule

const HistoryModule = (() => {

  function render(container) {
    const history = App.getHistory();

    if (history.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <div class="empty-title">אין היסטוריה עדיין</div>
          <div class="empty-sub">חיפושים יישמרו כאן אוטומטית</div>
        </div>`;
      return;
    }

    container.innerHTML = `
      <div class="card">
        <div class="card-title">📋 היסטוריית חיפושים (${history.length})</div>
        <button class="btn btn-ghost" onclick="HistoryModule.clearHistory()" style="font-size:12px;margin-bottom:16px;">
          🗑️ נקה הכל
        </button>
        ${history.map((entry, i) => `
          <div class="result-card" style="margin-bottom:12px;">
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">
              ${new Date(entry.timestamp).toLocaleString('he-IL')}
            </div>
            <div style="font-size:14px;font-weight:600;margin-bottom:6px;">
              I = ${App.fmt(entry.Ix, 0)} cm⁴ &nbsp;|&nbsp; i = ${App.fmt(entry.ix)} cm
              ${entry.type ? `&nbsp;|&nbsp; סוג: ${entry.type}` : ''}
            </div>
            ${entry.results ? `
              <div style="font-size:13px;color:var(--text-muted);">
                תוצאות: ${entry.results.map(r => r.name || r.profile_name).join(' / ')}
              </div>` : ''}
          </div>
        `).join('')}
      </div>`;
  }

  function clearHistory() {
    localStorage.removeItem('hapalday_history');
    App.navigate('history');
    App.showToast('ההיסטוריה נמחקה', 'success');
  }

  return { render, clearHistory };
})();
