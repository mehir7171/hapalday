// FILE: modules/catalog-view.js
// PURPOSE: הצגת קטלוג הפרופילים לעיון
// EXPORTS: CatalogViewModule

const CatalogViewModule = (() => {

  function render(container) {
    const catalog = App.getCatalog();
    const types = [...new Set(catalog.map(p => p.type))];

    container.innerHTML = `
      <div class="card">
        <div class="card-title">📚 קטלוג פרופילים (${catalog.length} פרופילים)</div>

        <div class="field" style="margin-bottom:16px;">
          <select id="catalog-filter" onchange="CatalogViewModule.filterTable()">
            <option value="">כל הסוגים</option>
            ${types.map(t => `<option value="${t}">${t}</option>`).join('')}
          </select>
        </div>

        <div style="overflow-x:auto;">
          <table id="catalog-table" style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead>
              <tr style="background:var(--bg);border-bottom:2px solid var(--border);">
                <th style="padding:10px 12px;text-align:right;font-weight:700;">שם</th>
                <th style="padding:10px 12px;text-align:right;font-weight:700;">סוג</th>
                <th style="padding:10px 12px;text-align:right;font-weight:700;">משקל (kg/m)</th>
                <th style="padding:10px 12px;text-align:right;font-weight:700;">גובה (mm)</th>
                <th style="padding:10px 12px;text-align:right;font-weight:700;">Ix (cm⁴)</th>
                <th style="padding:10px 12px;text-align:right;font-weight:700;">ix (cm)</th>
              </tr>
            </thead>
            <tbody id="catalog-tbody">
              ${renderRows(catalog)}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  function renderRows(profiles) {
    return profiles.map((p, i) => `
      <tr style="border-bottom:1px solid var(--border);background:${i % 2 === 0 ? 'var(--card)' : 'var(--bg)'};">
        <td style="padding:8px 12px;font-weight:600;">${p.name}</td>
        <td style="padding:8px 12px;color:var(--text-muted);">${p.type}</td>
        <td style="padding:8px 12px;">${App.fmt(p.weight_kg_m)}</td>
        <td style="padding:8px 12px;">${p.height_mm || '—'}</td>
        <td style="padding:8px 12px;">${App.fmt(p.Ix_cm4, 0)}</td>
        <td style="padding:8px 12px;">${App.fmt(p.ix_cm)}</td>
      </tr>`).join('');
  }

  function filterTable() {
    const type = document.getElementById('catalog-filter')?.value;
    const catalog = App.getCatalog();
    const filtered = type ? catalog.filter(p => p.type === type) : catalog;
    document.getElementById('catalog-tbody').innerHTML = renderRows(filtered);
  }

  return { render, filterTable };
})();


// FILE: modules/about.js
// PURPOSE: מסך אודות והגבלת אחריות
// EXPORTS: AboutModule

const AboutModule = (() => {

  function render(container) {
    container.innerHTML = `
      <div class="card">
        <div class="card-title">⚙️ הפלדאי — בחירת פרופיל פלדה</div>
        <p style="color:var(--text-muted);font-size:14px;line-height:1.7;margin-bottom:16px;">
          הפלדאי הוא כלי עזר דיגיטלי לקונסטרוקטורים ומהנדסי פלדה, המסייע בבחירת פרופיל פלדה
          מתאים מתוך קטלוג מוכן, על בסיס נתוני תכן שמוכנסים על ידי המהנדס.
        </p>

        <div class="disclaimer-banner" style="margin-bottom:20px;">
          <strong>⚠️ הגבלת אחריות חשובה:</strong><br><br>
          הפלדאי <strong>אינו</strong> מחשב עומסים, אינו מבצע תכן הנדסי ואינו מחליף מהנדס מוסמך.
          כל הערכים ההנדסיים (I גדול, i קטן ואחרים) מוכנסים על ידי המשתמש ועל אחריותו המלאה בלבד.
          התוצאות המוצגות הן הצעות לבחירת פרופיל מתוך קטלוג בלבד — ואינן מהוות פסיקה הנדסית.
          <br><br>
          <strong>האחריות המקצועית, המשפטית והחוקית לכל תכן היא על המהנדס המוסמך בלבד.</strong>
        </div>

        <div style="font-size:13px;color:var(--text-muted);">
          <div style="margin-bottom:8px;">📚 <strong>קטלוגים:</strong> HAL-DOR, PAD</div>
          <div style="margin-bottom:8px;">🔧 <strong>גרסה:</strong> 1.0</div>
          <div>🔗 <strong>משולב עם:</strong> הפרויקטור (ייצוא JSON)</div>
        </div>
      </div>`;
  }

  return { render };
})();
