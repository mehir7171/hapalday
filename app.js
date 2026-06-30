// FILE: app.js
// PURPOSE: ניהול ניווט ראשי, טוסטים, כלי עזר גלובליים — הפלדאי
// EXPORTS: App (global object)

const App = (() => {

  // ── State ──────────────────────────────────────────────────
  let currentView = 'search';
  let sidebarCollapsed = false;
  let catalog = [];

  // ── Init ───────────────────────────────────────────────────
  function init() {
    loadCatalog();
    navigate('search');
  }

  // ── Load Catalog ───────────────────────────────────────────
  function loadCatalog() {
    if (typeof CATALOG_DATA === 'undefined' || !CATALOG_DATA.profiles) {
      showToast('שגיאה בטעינת קטלוג הפרופילים', 'error');
      return;
    }
    catalog = CATALOG_DATA.profiles.filter(p =>
      p.Ix_cm4 !== null && p.ix_cm !== null
    );
  }

  // ── Navigate ────────────────────────────────────────────────
  function navigate(view) {
    currentView = view;

    // עדכון active בסיידבר
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });

    // עדכון כותרת
    const titles = {
      search:      'חיפוש פרופיל פלדה',
      history:     'היסטוריית חיפושים',
      catalog:     'קטלוג פרופילים',
      settings:    'הגדרות ושימוש',
      about:       'אודות הפלדאי',
    };
    document.getElementById('header-title').textContent = titles[view] || '';

    // טעינת מודול
    const content = document.getElementById('content');
    content.innerHTML = '';

    const modules = {
      search:   () => typeof SearchModule       !== 'undefined' && SearchModule.render(content),
      history:  () => typeof HistoryModule      !== 'undefined' && HistoryModule.render(content),
      catalog:  () => typeof CatalogViewModule  !== 'undefined' && CatalogViewModule.render(content),
      settings: () => typeof SettingsModule     !== 'undefined' && SettingsModule.render(content),
      about:    () => typeof AboutModule        !== 'undefined' && AboutModule.render(content),
    };

    if (modules[view]) {
      modules[view]();
    } else {
      content.innerHTML = `<div class="empty-state">
        <div class="empty-icon">🚧</div>
        <div class="empty-title">מסך זה בפיתוח</div>
      </div>`;
    }
  }

  // ── Sidebar Toggle ──────────────────────────────────────────
  function toggleSidebar() {
    sidebarCollapsed = !sidebarCollapsed;
    document.getElementById('sidebar').classList.toggle('collapsed', sidebarCollapsed);
    document.getElementById('main').classList.toggle('collapsed', sidebarCollapsed);
    document.getElementById('sidebar-toggle').textContent = sidebarCollapsed ? '▶' : '◀';
  }

  // ── Toast ────────────────────────────────────────────────────
  function showToast(msg, type = '') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // ── Catalog Access ───────────────────────────────────────────
  function getCatalog() { return catalog; }

  // ── Search History ───────────────────────────────────────────
  function saveToHistory(entry) {
    try {
      const history = getHistory();
      history.unshift({ ...entry, timestamp: new Date().toISOString() });
      // שמור מקסימום 50 חיפושים
      localStorage.setItem('hapalday_history', JSON.stringify(history.slice(0, 50)));
    } catch (err) {
      console.error('שגיאה בשמירת היסטוריה:', err);
    }
  }

  function getHistory() {
    try {
      return JSON.parse(localStorage.getItem('hapalday_history') || '[]');
    } catch {
      return [];
    }
  }

  // ── API Key ──────────────────────────────────────────────────
  function getApiKey() {
    return localStorage.getItem('hapalday_api_key') || '';
  }

  function setApiKey(key) {
    localStorage.setItem('hapalday_api_key', key.trim());
  }

  // ── Usage Log ────────────────────────────────────────────────
  function logUsage(entry) {
    try {
      const log = getUsageLog();
      log.unshift({ ...entry, timestamp: new Date().toISOString() });
      localStorage.setItem('hapalday_usage_log', JSON.stringify(log.slice(0, 200)));
    } catch (err) {
      console.error('שגיאה בשמירת לוג שימוש:', err);
    }
  }

  function getUsageLog() {
    try {
      return JSON.parse(localStorage.getItem('hapalday_usage_log') || '[]');
    } catch {
      return [];
    }
  }

  function clearUsageLog() {
    localStorage.removeItem('hapalday_usage_log');
  }

  // ── Format Helpers ───────────────────────────────────────────
  function fmt(val, decimals = 1) {
    if (val === null || val === undefined) return '—';
    return Number(val).toLocaleString('he-IL', { maximumFractionDigits: decimals });
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('he-IL') + ' ' + d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  }

  // ── Public API ────────────────────────────────────────────────
  return {
    init, navigate, toggleSidebar, showToast,
    getCatalog, saveToHistory, getHistory,
    getApiKey, setApiKey,
    logUsage, getUsageLog, clearUsageLog,
    fmt, fmtDate
  };

})();

// הפעלה בטעינת הדף
document.addEventListener('DOMContentLoaded', App.init);
