// FILE: modules/settings.js
// PURPOSE: הגדרות מפתח API + טבלת לוג שימוש בטוקנים
// EXPORTS: SettingsModule

const SettingsModule = (() => {

  // ── Render ────────────────────────────────────────────────────
  function render(container) {
    container.innerHTML = `
      <!-- מפתח API -->
      <div class="card">
        <div class="card-title">🔑 מפתח Anthropic API</div>

        <div class="field">
          <label>מפתח API (נשמר רק בדפדפן שלך)</label>
          <div style="display:flex;gap:8px;align-items:center;">
            <input
              type="password"
              id="api-key-input"
              placeholder="sk-ant-..."
              value="${App.getApiKey()}"
              style="flex:1;font-family:monospace;font-size:13px;"
            />
            <button class="btn btn-ghost" onclick="SettingsModule.toggleKeyVisibility()" id="btn-show-key" style="white-space:nowrap;font-size:13px;">
              👁 הצג
            </button>
          </div>
          <div class="hint">המפתח נשמר ב-localStorage בדפדפן בלבד — לא נשלח לשום שרת חיצוני.</div>
        </div>

        <div style="display:flex;gap:10px;margin-top:4px;">
          <button class="btn btn-primary" onclick="SettingsModule.saveKey()" style="font-size:13px;">
            💾 שמור מפתח
          </button>
          <button class="btn btn-ghost" onclick="SettingsModule.clearKey()" style="font-size:13px;color:var(--red);">
            🗑 מחק מפתח
          </button>
        </div>

        <div id="key-status" style="margin-top:12px;">${renderKeyStatus()}</div>
      </div>

      <!-- סיכום שימוש -->
      <div class="card">
        <div class="card-title" style="justify-content:space-between;">
          <span>📊 לוג שימוש ב-API</span>
          <button class="btn btn-ghost" onclick="SettingsModule.clearLog()" style="font-size:12px;padding:5px 12px;">
            🗑 נקה לוג
          </button>
        </div>

        ${renderSummary()}
        ${renderLog()}
      </div>
    `;
  }

  // ── Key Status ────────────────────────────────────────────────
  function renderKeyStatus() {
    const key = App.getApiKey();
    if (!key) {
      return `<div style="color:var(--red);font-size:13px;">⚠️ מפתח API לא מוגדר — הפעולות AI לא יעבדו</div>`;
    }
    const masked = key.slice(0, 10) + '••••••••' + key.slice(-4);
    return `<div style="color:var(--green);font-size:13px;">✅ מפתח מוגדר: <code style="font-size:12px;background:var(--bg);padding:2px 6px;border-radius:4px;">${masked}</code></div>`;
  }

  // ── Usage Summary ─────────────────────────────────────────────
  function renderSummary() {
    const log = App.getUsageLog();
    if (log.length === 0) return '';

    const total   = log.reduce((s, r) => s + (r.input_tokens + r.output_tokens), 0);
    const input   = log.reduce((s, r) => s + r.input_tokens,  0);
    const output  = log.reduce((s, r) => s + r.output_tokens, 0);
    const searches  = log.filter(r => r.type === 'חיפוש פרופיל').length;
    const extracts  = log.filter(r => r.type === 'חילוץ מסמך').length;

    return `
      <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:20px;">
        <div class="usage-stat-chip">
          <div class="usage-stat-val">${log.length}</div>
          <div class="usage-stat-label">סה"כ בקשות</div>
        </div>
        <div class="usage-stat-chip">
          <div class="usage-stat-val">${searches}</div>
          <div class="usage-stat-label">חיפושי פרופיל</div>
        </div>
        <div class="usage-stat-chip">
          <div class="usage-stat-val">${extracts}</div>
          <div class="usage-stat-label">חילוצי מסמך</div>
        </div>
        <div class="usage-stat-chip accent">
          <div class="usage-stat-val">${total.toLocaleString('he-IL')}</div>
          <div class="usage-stat-label">סה"כ טוקנים</div>
        </div>
        <div class="usage-stat-chip">
          <div class="usage-stat-val">${input.toLocaleString('he-IL')}</div>
          <div class="usage-stat-label">טוקנים נשלחו</div>
        </div>
        <div class="usage-stat-chip">
          <div class="usage-stat-val">${output.toLocaleString('he-IL')}</div>
          <div class="usage-stat-label">טוקנים התקבלו</div>
        </div>
      </div>`;
  }

  // ── Usage Table ───────────────────────────────────────────────
  function renderLog() {
    const log = App.getUsageLog();
    if (log.length === 0) {
      return `<div class="empty-state" style="padding:32px 0;">
        <div class="empty-icon">📭</div>
        <div class="empty-title">אין שימוש עדיין</div>
        <div class="empty-sub">כל בקשת AI תירשם כאן</div>
      </div>`;
    }

    const rows = log.map((r, i) => `
      <tr style="border-bottom:1px solid var(--border);background:${i % 2 === 0 ? 'var(--card)' : 'var(--bg)'};">
        <td style="padding:8px 12px;font-size:12px;color:var(--text-muted);white-space:nowrap;">${App.fmtDate(r.timestamp)}</td>
        <td style="padding:8px 12px;font-size:13px;">${r.type}</td>
        <td style="padding:8px 12px;font-size:12px;color:var(--text-muted);font-family:monospace;">${r.model?.replace('claude-','')}</td>
        <td style="padding:8px 12px;text-align:left;font-size:13px;">${(r.input_tokens||0).toLocaleString('he-IL')}</td>
        <td style="padding:8px 12px;text-align:left;font-size:13px;">${(r.output_tokens||0).toLocaleString('he-IL')}</td>
        <td style="padding:8px 12px;text-align:left;font-size:13px;font-weight:700;">${((r.input_tokens||0)+(r.output_tokens||0)).toLocaleString('he-IL')}</td>
      </tr>`).join('');

    return `
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="background:var(--bg);border-bottom:2px solid var(--border);">
              <th style="padding:10px 12px;text-align:right;font-weight:700;">תאריך ושעה</th>
              <th style="padding:10px 12px;text-align:right;font-weight:700;">סוג</th>
              <th style="padding:10px 12px;text-align:right;font-weight:700;">מודל</th>
              <th style="padding:10px 12px;text-align:left;font-weight:700;">קלט</th>
              <th style="padding:10px 12px;text-align:left;font-weight:700;">פלט</th>
              <th style="padding:10px 12px;text-align:left;font-weight:700;">סה"כ</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  // ── Actions ───────────────────────────────────────────────────
  function saveKey() {
    const val = document.getElementById('api-key-input')?.value?.trim();
    if (!val) {
      App.showToast('הזן מפתח API תחילה', 'error');
      return;
    }
    if (!val.startsWith('sk-')) {
      App.showToast('מפתח API לא תקין — חייב להתחיל ב-sk-', 'error');
      return;
    }
    App.setApiKey(val);
    document.getElementById('key-status').innerHTML = renderKeyStatus();
    App.showToast('מפתח API נשמר בהצלחה', 'success');
  }

  function clearKey() {
    App.setApiKey('');
    document.getElementById('api-key-input').value = '';
    document.getElementById('key-status').innerHTML = renderKeyStatus();
    App.showToast('מפתח API נמחק', '');
  }

  function toggleKeyVisibility() {
    const input = document.getElementById('api-key-input');
    const btn   = document.getElementById('btn-show-key');
    if (input.type === 'password') {
      input.type = 'text';
      btn.textContent = '🙈 הסתר';
    } else {
      input.type = 'password';
      btn.textContent = '👁 הצג';
    }
  }

  function clearLog() {
    App.clearUsageLog();
    App.showToast('לוג השימוש נוקה', '');
    // רנדר מחדש
    const container = document.getElementById('content');
    if (container) render(container);
  }

  return { render, saveKey, clearKey, toggleKeyVisibility, clearLog };

})();
