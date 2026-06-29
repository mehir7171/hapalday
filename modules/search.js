// FILE: modules/search.js
// PURPOSE: מסך החיפוש הראשי — קלט פרמטרים + קריאת AI + הצגת תוצאות
// EXPORTS: SearchModule

const SearchModule = (() => {

  // ── Render ────────────────────────────────────────────────────
  function render(container) {
    container.innerHTML = `
      <div class="disclaimer-banner">
        <strong>⚠️ הצהרת אחריות:</strong>
        הפלדאי הוא כלי עזר לבחירת פרופיל בלבד. הוא אינו מחשב עומסים ואינו מחליף תכן הנדסי.
        כל הערכים ההנדסיים מוכנסים על ידי המהנדס ועל אחריותו המלאה בלבד.
      </div>

      <!-- כרטיס העלאת מסמך -->
      <div class="card">
        <div class="card-title">📎 חילוץ נתונים ממסמך (אופציונלי)</div>
        <div
          id="upload-zone"
          class="upload-zone"
          onclick="document.getElementById('file-input').click()"
          ondragover="event.preventDefault(); this.classList.add('drag-over')"
          ondragleave="this.classList.remove('drag-over')"
          ondrop="SearchModule.handleDrop(event)"
        >
          <div class="upload-icon">🗂️</div>
          <div class="upload-text">גרור תוכנית לכאן או לחץ לבחירה</div>
          <div class="upload-sub">PDF, PNG, JPEG, WEBP</div>
        </div>
        <input
          type="file"
          id="file-input"
          accept=".pdf,image/jpeg,image/png,image/webp,image/gif"
          style="display:none"
          onchange="SearchModule.handleFileSelect(event)"
        />
        <div id="extract-status" style="display:none;margin-top:12px;"></div>
      </div>

      <!-- כרטיס קלט ראשי -->
      <div class="card">
        <div class="card-title">📐 נתוני תכן (מוכנסים על ידי המהנדס)</div>

        <div class="fields-row">
          <div class="field">
            <label>I גדול — מומנט אינרציה נדרש (cm⁴)</label>
            <input type="number" id="inp-Ix" placeholder="לדוגמה: 8360" min="0" step="any"/>
            <div class="hint">ערך מינימלי שהפרופיל חייב לעמוד בו</div>
          </div>
          <div class="field">
            <label>i קטן — רדיוס גירציה נדרש (cm)</label>
            <input type="number" id="inp-ix" placeholder="לדוגמה: 12.5" min="0" step="any"/>
            <div class="hint">ערך מינימלי שהפרופיל חייב לעמוד בו</div>
          </div>
        </div>
      </div>

      <!-- פרמטרים אופציונליים -->
      <div class="card">
        <div class="card-title">⚙️ פרמטרים אופציונליים</div>

        <div class="fields-row">
          <div class="field">
            <label>סוג פרופיל מועדף</label>
            <select id="inp-type">
              <option value="">כל הסוגים</option>
              <option value="IPE">IPE — קורת I</option>
              <option value="HEA">HEA — פרופיל H קל</option>
              <option value="HEB">HEB — פרופיל H בינוני</option>
              <option value="UPN">UPN — פרופיל תעלה</option>
              <option value="RHS_SQ">RHS — מרובע חלול</option>
              <option value="CHS">צינור עגול</option>
            </select>
          </div>
          <div class="field">
            <label>גובה מקסימלי (mm)</label>
            <input type="number" id="inp-maxh" placeholder="ללא הגבלה" min="0" step="1"/>
          </div>
        </div>

        <div class="field">
          <label>משקל מקסימלי (kg/m)</label>
          <input type="number" id="inp-maxw" placeholder="ללא הגבלה" min="0" step="any"/>
        </div>

        <div class="field">
          <label>הנחיה חופשית למערכת (אופציונלי)</label>
          <textarea id="inp-prompt" rows="3"
            placeholder="לדוגמה: העדף פרופיל רחב יותר לאחיזת ברגים, הימנע מפרופילים מעל 500mm גובה..."></textarea>
        </div>
      </div>

      <!-- כפתור חיפוש -->
      <button class="btn btn-primary" id="btn-search" onclick="SearchModule.runSearch()" style="width:100%;justify-content:center;padding:14px;font-size:15px;">
        🔍 מצא פרופיל מתאים
      </button>

      <!-- Loading -->
      <div class="loading-overlay" id="search-loading">
        <div class="loading-spinner"></div>
        <div>מחפש פרופיל מתאים בקטלוג...</div>
      </div>

      <!-- תוצאות -->
      <div id="search-results" style="margin-top:24px;"></div>
    `;
  }

  // ── Run Search ────────────────────────────────────────────────
  async function runSearch() {
    const Ix   = parseFloat(document.getElementById('inp-Ix')?.value);
    const ix   = parseFloat(document.getElementById('inp-ix')?.value);
    const type = document.getElementById('inp-type')?.value;
    const maxH = parseFloat(document.getElementById('inp-maxh')?.value) || null;
    const maxW = parseFloat(document.getElementById('inp-maxw')?.value) || null;
    const prompt = document.getElementById('inp-prompt')?.value?.trim() || '';

    // ── ולידציה ───────────────────────────────────────────────
    if (isNaN(Ix) || Ix <= 0) {
      App.showToast('יש להזין ערך חיובי עבור I גדול', 'error');
      return;
    }
    if (isNaN(ix) || ix <= 0) {
      App.showToast('יש להזין ערך חיובי עבור i קטן', 'error');
      return;
    }

    // ── סינון קטלוג לפני שליחה ל-AI ──────────────────────────
    const catalog = App.getCatalog();
    let candidates = catalog.filter(p => {
      if (p.Ix_cm4 < Ix) return false;
      if (p.ix_cm  < ix) return false;
      if (type && p.type !== type) return false;
      if (maxH && p.height_mm > maxH) return false;
      if (maxW && p.weight_kg_m > maxW) return false;
      return true;
    });

    // מיון לפי משקל (קל קודם)
    candidates.sort((a, b) => a.weight_kg_m - b.weight_kg_m);

    if (candidates.length === 0) {
      showNoResults();
      return;
    }

    // הגבל ל-20 פרופילים קלים ביותר לשליחה ל-AI
    const topCandidates = candidates.slice(0, 20);

    // ── הצג loading ───────────────────────────────────────────
    document.getElementById('search-loading').style.display = 'block';
    document.getElementById('search-results').innerHTML = '';
    document.getElementById('btn-search').disabled = true;

    try {
      const results = await callAI({ Ix, ix, type, maxH, maxW, prompt, topCandidates });
      renderResults(results, { Ix, ix, prompt });
      App.saveToHistory({ Ix, ix, type, maxH, maxW, prompt, results });
    } catch (err) {
      console.error(err);
      const msg = err.message?.includes('מפתח API')
        ? err.message + ' ← לחץ על "הגדרות"'
        : 'שגיאה בחיפוש. נסה שנית.';
      App.showToast(msg, 'error');
    } finally {
      document.getElementById('search-loading').style.display = 'none';
      document.getElementById('btn-search').disabled = false;
    }
  }

  // ── Call AI ───────────────────────────────────────────────────
  async function callAI({ Ix, ix, type, maxH, maxW, prompt, topCandidates }) {
    const catalogText = topCandidates.map(p =>
      `${p.name} | משקל: ${p.weight_kg_m} kg/m | Ix: ${p.Ix_cm4} cm⁴ | ix: ${p.ix_cm} cm | גובה: ${p.height_mm || '—'} mm`
    ).join('\n');

    const systemPrompt = `אתה מומחה לבחירת פרופילי פלדה. תפקידך לבחור 3 חלופות מתאימות מרשימת פרופילים שסופקה.
חשוב: אתה לא מחשב עומסים ולא מחליף מהנדס. אתה רק בוחר מתוך הרשימה שסופקה.
החזר JSON בלבד, ללא טקסט נוסף, בפורמט הזה:
{
  "results": [
    {
      "rank": 1,
      "profile_name": "IPE 300",
      "reason": "הסבר קצר בעברית — מדוע פרופיל זה מתאים"
    }
  ]
}`;

    const userMessage = `בחר 3 פרופילים מתאימים מהרשימה הבאה:

דרישות המהנדס:
- I גדול מינימלי: ${Ix} cm⁴
- i קטן מינימלי: ${ix} cm
${maxH ? `- גובה מקסימלי: ${maxH} mm` : ''}
${maxW ? `- משקל מקסימלי: ${maxW} kg/m` : ''}
${prompt ? `- הנחיית המהנדס: ${prompt}` : ''}

פרופילים מתאימים (ממוינים לפי משקל, קל קודם):
${catalogText}

בחר 3 חלופות:
1. הכי קל במשקל (חסכוני בחומר)
2. הכי מאוזן (איזון בין גודל, משקל ונוחות עבודה)
3. לפי שיקולך — פרופיל שיכול להתאים לשיקולים נוספים

לכל חלופה: שם מדויק מהרשימה + סיבה קצרה בעברית (1-2 משפטים).`;

    const apiKey = App.getApiKey();
    if (!apiKey) throw new Error('חסר מפתח API — הגדר בהגדרות');

    const model = 'claude-sonnet-4-6';
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-calls': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `שגיאת API: ${response.status}`);
    }

    const data = await response.json();

    // תיעוד שימוש
    App.logUsage({
      type: 'חיפוש פרופיל',
      model,
      input_tokens:  data.usage?.input_tokens  || 0,
      output_tokens: data.usage?.output_tokens || 0,
    });

    const text = data.content?.map(b => b.text || '').join('') || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    // העשר תוצאות עם נתוני הקטלוג
    const catalog = App.getCatalog();
    return parsed.results.map(r => {
      const profile = catalog.find(p => p.name === r.profile_name) || {};
      return { ...r, ...profile };
    });
  }

  // ── Render Results ────────────────────────────────────────────
  function renderResults(results, query) {
    const container = document.getElementById('search-results');
    if (!results || results.length === 0) { showNoResults(); return; }

    window._lastResults = { results, query };

    const rankLabels = ['', 'הכי קל', 'מאוזן', 'חלופה שלישית'];
    const rankColors = ['', 'gold', 'silver', 'bronze'];
    const rankEmojis = ['', '🥇', '🥈', '🥉'];

    container.innerHTML = `
      <div style="margin-bottom:16px;font-size:15px;font-weight:700;color:var(--text)">
        ✅ נמצאו ${results.length} חלופות מומלצות — בחר את הפרופיל המועדף
      </div>

      ${results.map(r => `
        <div class="result-card" id="result-card-${r.rank}">
          <div class="result-rank ${rankColors[r.rank]}">
            ${rankEmojis[r.rank]} ${rankLabels[r.rank]}
          </div>
          <div class="result-name">${r.name || r.profile_name}</div>
          <div class="result-reason">${r.reason}</div>
          <div class="result-specs">
            <div class="spec-chip">⚖️ משקל: <strong>${App.fmt(r.weight_kg_m)} kg/m</strong></div>
            <div class="spec-chip">📐 I גדול: <strong>${App.fmt(r.Ix_cm4, 0)} cm⁴</strong></div>
            <div class="spec-chip">📏 i קטן: <strong>${App.fmt(r.ix_cm)} cm</strong></div>
            ${r.height_mm ? `<div class="spec-chip">↕️ גובה: <strong>${r.height_mm} mm</strong></div>` : ''}
            ${r.width_mm  ? `<div class="spec-chip">↔️ רוחב: <strong>${r.width_mm} mm</strong></div>` : ''}
            ${r.Wx_cm3    ? `<div class="spec-chip">Wx: <strong>${App.fmt(r.Wx_cm3)} cm³</strong></div>` : ''}
          </div>
          <div style="margin-top:14px;">
            <button class="btn btn-primary" onclick="SearchModule.selectProfile(${r.rank})" style="font-size:13px;padding:8px 18px;">
              ✅ בחר פרופיל זה
            </button>
          </div>
        </div>
      `).join('')}

      <!-- פאנל בחירה — מופיע אחרי לחיצה -->
      <div id="selection-panel" style="display:none;"></div>

      <div style="margin-top:16px;">
        <button class="btn btn-ghost" onclick="SearchModule.clearResults()" style="font-size:13px;">
          🔄 חיפוש חדש
        </button>
      </div>
    `;
  }

  // ── Select Profile ────────────────────────────────────────────
  function selectProfile(rank) {
    const { results, query } = window._lastResults;
    const r = results.find(x => x.rank === rank);
    if (!r) return;

    // הדגש כרטיס נבחר
    results.forEach(x => {
      const card = document.getElementById(`result-card-${x.rank}`);
      if (card) card.style.opacity = x.rank === rank ? '1' : '0.45';
    });
    document.getElementById(`result-card-${rank}`).style.border = '2px solid var(--accent)';

    window._selectedProfile = r;

    const panel = document.getElementById('selection-panel');
    panel.style.display = 'block';
    panel.innerHTML = `
      <div class="card" style="border:2px solid var(--accent);margin-top:8px;">
        <div class="card-title">📦 ${r.name || r.profile_name} — פרטי ייצוא להפרויקטור</div>

        <div style="background:var(--accent-light);border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:13px;color:var(--text-muted);">
          <strong style="color:var(--text);">⚖️ ${App.fmt(r.weight_kg_m)} kg/m</strong> ·
          <strong style="color:var(--text);">I = ${App.fmt(r.Ix_cm4, 0)} cm⁴</strong> ·
          <strong style="color:var(--text);">i = ${App.fmt(r.ix_cm)} cm</strong>
          ${r.height_mm ? ` · גובה ${r.height_mm} mm` : ''}
        </div>

        <div class="fields-row">
          <div class="field">
            <label>כמות (מ"א — מטר אורכי) *</label>
            <input type="number" id="sel-qty" placeholder="לדוגמה: 12.5" min="0" step="0.01"/>
            <div class="hint">סה"כ מטרים אורכיים של הפרופיל שנדרשים</div>
          </div>
          <div class="field">
            <label>מחיר יחידה ₪/מ"א (אופציונלי)</label>
            <input type="number" id="sel-price" placeholder="השאר ריק אם לא ידוע" min="0" step="0.01"/>
            <div class="hint">ניתן להשלים בהפרויקטור לאחר מכן</div>
          </div>
        </div>

        <div class="field">
          <label>קטגוריה בכתב הכמויות</label>
          <input type="text" id="sel-category" value="פלדה קונסטרוקטיבית" />
        </div>

        <div class="field">
          <label>הערות (יופיעו בכתב הכמויות)</label>
          <textarea id="sel-note" rows="2"
            placeholder="לדוגמה: כולל חיזוקים, לריתוך, פתוח לשתי קצוות...">${r.reason}</textarea>
        </div>

        <div style="display:flex;gap:10px;margin-top:4px;flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="SearchModule.exportToBOQ()" style="font-size:13px;padding:10px 20px;">
            📤 ייצא JSON — כתב כמויות
          </button>
          <button class="btn btn-ghost" onclick="SearchModule.exportToCSV()" style="font-size:13px;">
            📊 ייצא CSV
          </button>
          <button class="btn btn-ghost" onclick="SearchModule.exportRawJson()" style="font-size:13px;">
            📋 JSON גולמי (כל החלופות)
          </button>
        </div>
      </div>
    `;

    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── Export BOQ (פורמט הפרויקטור) ────────────────────────────
  function exportToBOQ() {
    const r = window._selectedProfile;
    if (!r) { App.showToast('בחר פרופיל תחילה', 'error'); return; }

    const qty       = parseFloat(document.getElementById('sel-qty')?.value)   || 0;
    const unitPrice = parseFloat(document.getElementById('sel-price')?.value)  || 0;
    const category  = document.getElementById('sel-category')?.value?.trim()   || 'פלדה קונסטרוקטיבית';
    const note      = document.getElementById('sel-note')?.value?.trim()       || '';
    const { query } = window._lastResults;

    // פורמט תואם לייבוא כתב כמויות בהפרויקטור
    const exportData = {
      source:      'hapalday',
      version:     '1.0',
      type:        'boq',
      timestamp:   new Date().toISOString(),
      projectName: '',   // ימולא בהפרויקטור
      query: {
        Ix_required: query.Ix,
        ix_required: query.ix,
        notes:       query.prompt || ''
      },
      selected_profile: {
        name:         r.name || r.profile_name,
        weight_kg_m:  r.weight_kg_m,
        Ix_cm4:       r.Ix_cm4,
        ix_cm:        r.ix_cm,
        height_mm:    r.height_mm || null,
        width_mm:     r.width_mm  || null,
        reason:       r.reason
      },
      rows: [{
        id:          `hap_${Date.now()}`,
        scope:       'project',
        tenantId:    null,
        category,
        description: `קורת ${r.name || r.profile_name}`,
        unit:        'מ"א',
        qty,
        unitPrice,
        note:        `I=${App.fmt(r.Ix_cm4,0)} cm⁴ · i=${App.fmt(r.ix_cm)} cm · ${r.weight_kg_m} kg/m${note ? ' | ' + note : ''}`,
        sourceType:  'hapalday',
        createdAt:   new Date().toISOString()
      }]
    };

    downloadJson(exportData, `הפלדאי_${r.name || r.profile_name}_${Date.now()}.json`);
    App.showToast('קובץ ייוצא — ייבא אותו בהפרויקטור ← כתב כמויות ← ייבוא קובץ', 'success');
  }

  // ── Export Raw JSON (כל החלופות) ─────────────────────────────
  function exportRawJson() {
    if (!window._lastResults) return;
    const { results, query } = window._lastResults;
    const exportData = {
      source:    'hapalday',
      version:   '1.0',
      timestamp: new Date().toISOString(),
      query:     { Ix_required: query.Ix, ix_required: query.ix, notes: query.prompt || '' },
      results:   results.map(r => ({
        rank: r.rank, profile: r.name || r.profile_name,
        weight_kg_m: r.weight_kg_m, Ix_cm4: r.Ix_cm4, ix_cm: r.ix_cm, reason: r.reason
      }))
    };
    downloadJson(exportData, `הפלדאי_חלופות_${Date.now()}.json`);
    App.showToast('קובץ JSON הורד', 'success');
  }

  // ── Export CSV (פורמט כמויות ידניות בהפרויקטור) ──────────────
  function exportToCSV() {
    const r = window._selectedProfile;
    if (!r) { App.showToast('בחר פרופיל תחילה', 'error'); return; }

    const qty       = parseFloat(document.getElementById('sel-qty')?.value)   || 0;
    const unitPrice = parseFloat(document.getElementById('sel-price')?.value)  || 0;
    const category  = document.getElementById('sel-category')?.value?.trim()   || 'פלדה קונסטרוקטיבית';
    const note      = document.getElementById('sel-note')?.value?.trim()       || '';
    const total     = qty * unitPrice;

    const profileName = r.name || r.profile_name;
    const techNote = `I=${App.fmt(r.Ix_cm4,0)} cm⁴ · i=${App.fmt(r.ix_cm)} cm · ${r.weight_kg_m} kg/m${note ? ' | ' + note : ''}`;

    // כותרות בעברית — תואמות לכמויות ידניות בהפרויקטור
    const headers = ['קטגוריה', 'תיאור פריט', 'יחידה', 'כמות', 'מחיר יחידה', 'סה"כ', 'הערות'];
    const row     = [category, `קורת ${profileName}`, 'מ"א', qty, unitPrice, total, techNote];

    const csvLine = (cells) => cells.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',');
    // BOM לתמיכה בעברית ב-Excel
    const csv = '\uFEFF' + csvLine(headers) + '\n' + csvLine(row);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `הפלדאי_${profileName}_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    App.showToast('קובץ CSV הורד — ניתן לפתוח ב-Excel או לייבא להפרויקטור', 'success');
  }

  // ── Download Helper ───────────────────────────────────────────
  function downloadJson(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  // ── No Results ────────────────────────────────────────────────
  function showNoResults() {
    document.getElementById('search-results').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔎</div>
        <div class="empty-title">לא נמצאו פרופילים מתאימים</div>
        <div class="empty-sub">נסה להרחיב את הדרישות — הפחת I גדול, i קטן, או הסר מגבלות נוספות</div>
      </div>
    `;
  }

  // ── File Upload Handlers ──────────────────────────────────────
  function handleDrop(event) {
    event.preventDefault();
    document.getElementById('upload-zone').classList.remove('drag-over');
    const file = event.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) processFile(file);
  }

  async function processFile(file) {
    const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!ALLOWED.includes(file.type)) {
      App.showToast('סוג קובץ לא נתמך. יש להעלות PDF או תמונה.', 'error');
      return;
    }

    const statusEl = document.getElementById('extract-status');
    const zone = document.getElementById('upload-zone');
    statusEl.style.display = 'block';
    statusEl.innerHTML = `<div style="display:flex;align-items:center;gap:10px;color:var(--text-muted);font-size:13px;">
      <div class="loading-spinner" style="width:20px;height:20px;border-width:2px;margin:0;"></div>
      מנתח את המסמך...
    </div>`;
    zone.classList.add('loading');

    try {
      const base64 = await fileToBase64(file);
      const extracted = await extractFromDocument(base64, file.type, file.name);
      fillExtractedValues(extracted, file.name, statusEl);
    } catch (err) {
      console.error('שגיאה בחילוץ:', err);
      statusEl.innerHTML = `<div style="color:var(--red);font-size:13px;">⚠️ לא הצלחתי לחלץ ערכים מהמסמך. נסה קובץ אחר או הזן ידנית.</div>`;
    } finally {
      zone.classList.remove('loading');
    }
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function extractFromDocument(base64, mimeType, fileName) {
    const contentBlock = mimeType === 'application/pdf'
      ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
      : { type: 'image',    source: { type: 'base64', media_type: mimeType,           data: base64 } };

    const systemPrompt = `אתה עוזר לחילוץ נתוני תכן הנדסי ממסמכי פלדה.
חלץ את הערכים הבאים בלבד, אם הם מופיעים במסמך:
- Ix_cm4: מומנט אינרציה גדול (I גדול) — ביחידות cm⁴
- ix_cm: רדיוס גירציה קטן (i קטן) — ביחידות cm
החזר JSON בלבד, ללא טקסט נוסף:
{"Ix_cm4": number_or_null, "ix_cm": number_or_null, "notes": "הסבר קצר מה מצאת"}`;

    const apiKey = App.getApiKey();
    if (!apiKey) throw new Error('חסר מפתח API — הגדר בהגדרות');

    const model = 'claude-opus-4-6';
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-calls': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: 'user', content: [
          contentBlock,
          { type: 'text', text: `חלץ מהמסמך "${fileName}" את ערכי Ix (מומנט אינרציה) ו-ix (רדיוס גירציה).` }
        ]}]
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `שגיאת API: ${response.status}`);
    }

    const data = await response.json();

    // תיעוד שימוש
    App.logUsage({
      type: 'חילוץ מסמך',
      model,
      input_tokens:  data.usage?.input_tokens  || 0,
      output_tokens: data.usage?.output_tokens || 0,
    });

    const text = data.content?.map(b => b.text || '').join('') || '';
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  }

  function fillExtractedValues(extracted, fileName, statusEl) {
    const { Ix_cm4, ix_cm, notes } = extracted;
    let filled = 0;

    if (Ix_cm4 !== null && Ix_cm4 > 0) {
      document.getElementById('inp-Ix').value = Ix_cm4;
      filled++;
    }
    if (ix_cm !== null && ix_cm > 0) {
      document.getElementById('inp-ix').value = ix_cm;
      filled++;
    }

    if (filled === 0) {
      statusEl.innerHTML = `<div style="color:var(--amber);font-size:13px;">⚠️ לא נמצאו ערכי I ו-i במסמך. בדוק את הקובץ או הזן ידנית.<br><small>${notes || ''}</small></div>`;
      return;
    }

    const parts = [];
    if (Ix_cm4 !== null && Ix_cm4 > 0) parts.push(`I גדול: <strong>${Ix_cm4} cm⁴</strong>`);
    if (ix_cm  !== null && ix_cm  > 0) parts.push(`i קטן: <strong>${ix_cm} cm</strong>`);

    statusEl.innerHTML = `
      <div style="background:var(--green-light);border:1px solid #bbf7d0;border-radius:8px;padding:10px 14px;font-size:13px;color:#14532d;">
        ✅ חולצו מ-"${fileName}": ${parts.join(' · ')}
        ${notes ? `<br><small style="color:#166534;opacity:.8;">${notes}</small>` : ''}
      </div>`;
  }

  // ── Clear ──────────────────────────────────────────────────────
  function clearResults() {
    document.getElementById('search-results').innerHTML = '';
    document.getElementById('inp-Ix').value = '';
    document.getElementById('inp-ix').value = '';
    document.getElementById('inp-type').value = '';
    document.getElementById('inp-maxh').value = '';
    document.getElementById('inp-maxw').value = '';
    document.getElementById('inp-prompt').value = '';
    window._lastResults     = null;
    window._selectedProfile = null;
    const statusEl = document.getElementById('extract-status');
    if (statusEl) statusEl.style.display = 'none';
    const fileInput = document.getElementById('file-input');
    if (fileInput) fileInput.value = '';
  }

  return {
    render, runSearch, clearResults,
    selectProfile, exportToBOQ, exportToCSV, exportRawJson,
    handleDrop, handleFileSelect
  };

})();
