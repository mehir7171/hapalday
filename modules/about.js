// FILE: modules/about.js
// PURPOSE: מסך אודות הפלדאי

const AboutModule = (() => {

  function render(container) {
    container.innerHTML = `
      <div class="card" dir="rtl">
        <div class="card-title">ℹ️ אודות הפלדאי</div>
        <p style="margin:0 0 12px;">
          <strong>הפלדאי</strong> היא אפליקציה לבחירת פרופיל פלדה מתאים לתכן הנדסי.
        </p>
        <p style="margin:0 0 12px;">
          המהנדס מזין את ערכי התכן (I גדול ו-i קטן), והמערכת מסננת את הקטלוג ומציגה
          3 חלופות מומלצות באמצעות AI.
        </p>
        <p style="margin:0 0 12px; color:var(--text-muted); font-size:13px;">
          כל האחריות ההנדסית נשארת על המהנדס בלבד. האפליקציה אינה מחשבת עומסים
          ואינה מתכננת תכן הנדסי.
        </p>
        <div style="margin-top:16px; padding-top:16px; border-top:1px solid var(--border); font-size:13px; color:var(--text-muted);">
          גרסה 1.0 · קטלוג: 117 פרופילים
        </div>
      </div>`;
  }

  return { render };

})();
