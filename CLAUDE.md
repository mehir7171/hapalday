# הפלדאי — CLAUDE.md
> קובץ הנחיות לעבודה עם Claude Code על הפרויקט

---

## מה האפליקציה הזו עושה

**הפלדאי** היא אפליקציה עצמאית לבחירת פרופיל פלדה מתאים לתכן הנדסי.
המשתמש הוא **קונסטרוקטור / מהנדס פלדה** — לא קבלן ולא מנהל עבודה.

### זרימת העבודה המלאה (נכון לעכשיו):
1. המהנדס מכניס ידנית את ערכי התכן: **I גדול (cm⁴)** ו-**i קטן (cm)**
   - **אופציה:** מעלה PDF או תמונה של דף חישוב — המערכת מחלצת את הערכים אוטומטית
2. אופציונלית: מגדיר פרמטרים (סוג פרופיל, גובה מקס, משקל מקס, הנחיה חופשית)
3. המערכת מסננת את הקטלוג בקוד JS ושולחת ל-AI רק פרופילים מתאימים
4. AI בוחר **3 חלופות מומלצות** עם הסבר קצר
5. המהנדס **בוחר חלופה אחת** ומזין כמות (מ"א) + מחיר יחידה + הערות
6. ייצוא כ-**JSON (BOQ)** לייבוא ישיר בהפרויקטור ← כתב כמויות, או כ-**CSV** ל-Excel

### מה האפליקציה לא עושה — אסור לשנות זאת:
- ❌ לא מחשבת עומסים
- ❌ לא מתכננת תכן הנדסי מכל סוג
- ❌ לא נותנת המלצות הנדסיות — רק מתאימה פרופיל לפי ערכים שהמהנדס סיפק
- כל האחריות ההנדסית נשארת על המהנדס בלבד

---

## סטאק טכנולוגי

| שכבה | טכנולוגיה |
|------|-----------|
| Frontend | Vanilla JS — ללא frameworks |
| עיצוב | CSS Variables (כמו הפרויקטור) + RTL מלא |
| נתוני קטלוג | JS מקומי (catalog.js) — 117 פרופילים, נטען כ-`CATALOG_DATA` גלובלי |
| AI | Claude API — קריאה ישירה מהדפדפן (שלב נוכחי) |
| מפתח API | נשמר ב-localStorage, מוזן ידנית במסך הגדרות |
| Auth | Supabase — בהמשך (לא מומש עדיין) |
| Deploy | Netlify |

> **שלב עתידי:** מפתח API יעבור לשרת FastAPI על Railway (כמו הפרויקטור), עם Supabase auth ומערכת קרדיטים.

---

## מבנה תיקיות

```
hapalday/
├── index.html              # Shell: sidebar + header + content area + כל ה-CSS
├── app.js                  # App object: ניווט, קטלוג, API key, לוג שימוש, עזרים
├── catalog.js              # 117 פרופילים — מקור האמת (const CATALOG_DATA = {...})
├── catalog.json            # גיבוי — לא בשימוש בזמן ריצה
├── CLAUDE.md               # הקובץ הזה
└── modules/
    ├── search.js           # חיפוש ראשי: קלט + חילוץ מסמך + AI + בחירה + ייצוא
    ├── history.js          # היסטוריית חיפושים (localStorage)
    ├── catalog-view.js     # תצוגת קטלוג
    ├── about.js            # מסך אודות
    └── settings.js         # מפתח API + לוג שימוש בטוקנים
```

> **שים לב:** `style.css` מוזכר ב-CLAUDE.md המקורי אך כל ה-CSS נמצא בתוך `index.html` בתג `<style>`.

---

## מבנה catalog.js

```json
{
  "_meta": { "name": "...", "version": "1.0", "sources": [...], "units": {...} },
  "profiles": [
    {
      "type": "IPE",
      "name": "IPE 200",
      "height_mm": 200,
      "width_mm": 100,
      "weight_kg_m": 22.4,
      "F_cm2": 28.5,
      "Ix_cm4": 1943,
      "Wx_cm3": 194,
      "ix_cm": 8.26,
      "Iy_cm4": 142,
      "Wy_cm3": 28.5,
      "iy_cm": 2.24
    }
  ]
}
```

**חשוב:** catalog.js הוא קובץ JS רגיל עם `const CATALOG_DATA = {...}`. הוא נטען לפני `app.js` ב-index.html כך שהמשתנה זמין סינכרונית — ללא fetch, עובד גם ב-`file://` מקומי וגם ב-GitHub Pages.

**סוגי פרופילים בקטלוג (117 סה"כ):**
- IPE, HEA, HEB, HEM, IPN
- UPN, RHS_SQ (מרובע חלול), CHS (צינורות עגולות)
- זוויתנים L, פרופיל T, מרישים Z/C
- ברזל שטוח, עגול, מרובע מלא, פלטות

---

## app.js — App Object (Public API)

```javascript
App.init()                    // טעינת קטלוג + ניווט ראשוני
App.navigate(view)            // מעבר בין מסכים: 'search'|'history'|'catalog'|'settings'|'about'
App.getCatalog()              // מערך הפרופילים המסוננים (עם Ix ו-ix בלבד)
App.saveToHistory(entry)      // שמירה להיסטוריה (max 50, localStorage: hapalday_history)
App.getHistory()              // קריאת היסטוריה
App.getApiKey()               // מפתח API מ-localStorage (hapalday_api_key)
App.setApiKey(key)            // שמירת מפתח API
App.logUsage(entry)           // תיעוד קריאת API (max 200, localStorage: hapalday_usage_log)
App.getUsageLog()             // קריאת לוג שימוש
App.clearUsageLog()           // ניקוי לוג
App.showToast(msg, type)      // הצגת toast ('error'|'success'|'')
App.toggleSidebar()           // קיפול/פתיחת sidebar
App.fmt(val, decimals)        // פורמט מספר לעברית
App.fmtDate(iso)              // פורמט תאריך+שעה לעברית
```

---

## modules/search.js — SearchModule

### מסך החיפוש כולל:

1. **כרטיס העלאת מסמך** (אופציונלי)
   - Drag & drop או לחיצה — PDF, JPG, PNG, WEBP
   - קריאה ל-`claude-opus-4-6` עם vision/document
   - חילוץ `Ix_cm4` ו-`ix_cm` ומילוי אוטומטי בשדות

2. **כרטיס נתוני תכן** (חובה)
   - I גדול (cm⁴), i קטן (cm)

3. **פרמטרים אופציונליים**
   - סוג פרופיל, גובה מקסימלי, משקל מקסימלי, הנחיה חופשית

4. **לוגיקת חיפוש**
   - סינון קטלוג ב-JS: `Ix_cm4 >= Ix && ix_cm >= ix` + פרמטרים נוספים
   - מיון לפי משקל (קל קודם), שליחת 20 הראשונים ל-AI
   - `claude-sonnet-4-6` בוחר 3 חלופות + הסבר

5. **תוצאות + בחירה**
   - 3 כרטיסים עם כפתור "בחר פרופיל זה"
   - לחיצה → מסגרת כחולה + כרטיסים אחרים מתעמעמים
   - פאנל בחירה: כמות (מ"א), מחיר יחידה, קטגוריה, הערות

6. **ייצוא (3 אפשרויות)**
   - `exportToBOQ()` — JSON בפורמט כתב כמויות הפרויקטור
   - `exportToCSV()` — CSV עם BOM לתמיכת Excel בעברית
   - `exportRawJson()` — JSON גולמי עם כל 3 החלופות

### קריאות API

```javascript
// קריאת חיפוש: claude-sonnet-4-6, max_tokens: 1000
// קריאת חילוץ: claude-opus-4-6, max_tokens: 500
// Headers חובה:
{
  'x-api-key': App.getApiKey(),
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-calls': 'true',
  'Content-Type': 'application/json'
}
// אחרי כל קריאה: App.logUsage({ type, model, input_tokens, output_tokens })
```

---

## modules/settings.js — SettingsModule

- **מפתח API:** שדה סיסמה עם הצג/הסתר, שמור/מחק, אינדיקטור סטטוס
- **לוג שימוש:** כרטיסי סיכום (בקשות, טוקנים), טבלה מפורטת (תאריך, סוג, מודל, קלט/פלט/סה"כ), כפתור ניקוי

---

## ייצוא להפרויקטור

### פורמט JSON — כתב כמויות (BOQ)
תואם לייבוא ישיר בהפרויקטור ← כתב כמויות ← "ייבא קובץ ↑"

```json
{
  "source": "hapalday",
  "version": "1.0",
  "type": "boq",
  "timestamp": "ISO8601",
  "projectName": "",
  "query": { "Ix_required": 8360, "ix_required": 12.5, "notes": "..." },
  "selected_profile": {
    "name": "IPE 300",
    "weight_kg_m": 42.2,
    "Ix_cm4": 8360,
    "ix_cm": 12.5,
    "height_mm": 300,
    "reason": "..."
  },
  "rows": [{
    "id": "hap_1234567890",
    "scope": "project",
    "tenantId": null,
    "category": "פלדה קונסטרוקטיבית",
    "description": "קורת IPE 300",
    "unit": "מ\"א",
    "qty": 12.5,
    "unitPrice": 0,
    "note": "I=8,360 cm⁴ · i=12.5 cm · 42.2 kg/m | הערת המהנדס",
    "sourceType": "hapalday",
    "createdAt": "ISO8601"
  }]
}
```

### פורמט CSV
עמודות: `קטגוריה, תיאור פריט, יחידה, כמות, מחיר יחידה, סה"כ, הערות`
כולל BOM (`\uFEFF`) לתמיכה בעברית ב-Excel.

---

## localStorage Keys

| מפתח | תוכן |
|------|------|
| `hapalday_api_key` | מפתח Anthropic API |
| `hapalday_history` | היסטוריית חיפושים (max 50) |
| `hapalday_usage_log` | לוג קריאות API עם טוקנים (max 200) |

---

## כללי כתיבת קוד

### כללים חובה:
- **Vanilla JS בלבד** — אין React, אין Vue, אין jQuery
- **RTL מלא** — `dir="rtl"` על כל מסך, כל טקסט ממשק בעברית
- **CSS Variables** — צבעים ומידות רק דרך `var(--name)`, לא ערכים קשיחים
- **מודול = קובץ אחד** ב-`/modules/` — כל מודול עושה דבר אחד
- **טיפול בשגיאות תמיד** — כל async מקבל try/catch עם הודעה בעברית למשתמש
- **מפתח API תמיד דרך `App.getApiKey()`** — לעולם לא hardcoded

### כללים מומלצים:
- שמות קבצים: `kebab-case`
- משתנים ופונקציות: `camelCase`
- קבועים: `UPPER_SNAKE_CASE`
- פונקציה = פועל + עצם: `searchProfiles()`, `renderResults()`, `exportToJson()`
- מקסימום 20 שורות לפונקציה — אם יותר, פצל

---

## כללי UI/UX

- **עיצוב זהה להפרויקטור** — אותם CSS variables, אותו סגנון כרטיסים
- שדות קלט: label בעברית + placeholder עם דוגמה מספרית
- אזור העלאת קובץ: Drag & drop עם איקון 🗂️, border מקווקו, hover כחול
- תוצאות: 3 כרטיסים — זהב/כסף/ארד — עם כפתור בחירה על כל כרטיס
- פאנל ייצוא מופיע רק אחרי בחירת פרופיל
- הודעות שגיאה: אדום, בעברית, ספציפיות — לא "שגיאה כללית"

---

## חיבור בין האפליקציות

```
הפלדאי  ──JSON (BOQ)──▶  הפרויקטור
(בחירת פרופיל פלדה)       כתב כמויות ← הצעת מחיר / פיצול דיירים
```

**זרימה מלאה:**
1. הפלדאי: בחירת פרופיל + הזנת כמות → ייצוא JSON/CSV
2. הפרויקטור ← כתב כמויות ← "ייבא קובץ ↑" → שורה נכנסת אוטומטית
3. הפרויקטור: שיוך לדייר / העברה להצעת מחיר

- הפלדאי: מיועד לקונסטרוקטורים בלבד
- הפרויקטור: מיועד לקבלנים, מנהלי עבודה, חשבי כמויות
- הקשר: JSON/CSV export/import — ללא תלות ישירה בין הקוד

---

## Deploy

### GitHub Pages (פרודקשן)
- **URL:** `https://mehir7171.github.io/hapalday`
- **Repository:** `https://github.com/mehir7171/hapalday`
- **Auto-deploy:** כל `git push` ל-`main` → GitHub Pages מתעדכן אוטומטית תוך ~2 דקות

### עדכון גרסה
```bash
cd d:/hapalday
git add .
git commit -m "תיאור השינוי"
git push
```

### הפצה למשתמשים
- שולחים את הכתובת בלבד: `https://mehir7171.github.io/hapalday`
- כל משתמש מזין את מפתח ה-API שלו במסך הגדרות
- נתונים (היסטוריה, לוג, מפתח) נשמרים ב-localStorage של הדפדפן האישי בלבד
- ייצוא JSON/CSV מוריד קובץ למחשב המשתמש — לא קשור ל-Git

---

## תקנון והגבלת אחריות

### שלב נוכחי:
- אין הרשמה, אין ניהול משתמשים — האפליקציה פתוחה לכולם
- מפתח API מוזן ידנית על ידי המשתמש

### שלב עתידי (לפני השקה רשמית):
- מסך תקנון חד-פעמי בכניסה הראשונה (אישור נשמר ב-localStorage)
- FastAPI proxy על Railway + Supabase auth + מערכת קרדיטים (כמו הפרויקטור)
- מפתח API עובר לשרת בלבד

---

## אבטחה

- **שלב נוכחי:** מפתח API ב-localStorage בדפדפן המשתמש — מקובל לשימוש אישי
- **שלב עתידי:** מפתח API בשרת FastAPI בלבד, לעולם לא בפרונטאנד
- `.env` לא עולה ל-Git
- קלט מהמשתמש — תמיד validate: ערכים חיוביים, מספרים בלבד, סוג קובץ מורשה

---

*עדכן קובץ זה בכל פעם שמתווסף מודול חדש או משתנה ארכיטקטורה.*
