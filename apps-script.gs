/**
 * Fitness Tracker — Google Apps Script Web App
 *
 * 功能：
 *   1. action=sync     : 寫入今日紀錄到 Google Sheet「每日儀表板」分頁
 *   2. action=analyze  : 透過 Gemini Vision API 分析食物照片，回傳 P/F/C/kcal
 *
 * ============================================================
 * 安裝步驟（首次設定）：
 * ============================================================
 *
 * 1. 取得 Gemini API Key:
 *    https://aistudio.google.com/app/apikey → Create API key → 複製
 *
 * 2. 把這段程式碼整段貼入 Apps Script 編輯器（蓋掉預設 Code.gs）
 *
 * 3. 設定 API Key 到 Script Properties（重要：不要寫死在程式碼裡）:
 *    Apps Script 編輯器 → 左側「⚙ 專案設定」→ 滑到下面「指令碼屬性」
 *    → 新增屬性：
 *       名稱: GEMINI_API_KEY
 *       值:   貼上你剛剛複製的 API Key
 *    → 儲存
 *
 * 4. 部署 (Deploy) → 新增部署作業 → 類型：網頁應用程式
 *    執行身分: 我 (Me)
 *    存取權:   任何人 (Anyone)
 *
 * 5. 複製產生的 Web app URL，貼到 Fitness Tracker 網頁的 ⚙ 設定中
 *
 * ============================================================
 * 更新部署（修改程式後）：
 * ============================================================
 * 部署 → 管理部署作業 → 編輯（鉛筆圖示）→ 版本選「新增版本」→ 部署
 * 注意：Web App URL 不會變，網頁端不用改設定。
 * ============================================================
 */

const SHEET_NAME = "每日儀表板";
const GEMINI_MODEL = "gemini-2.0-flash-exp";  // 支援 vision，免費額度高

// Sheet 欄位對應
const COL = {
  date: 1, weekday: 2, trainingType: 3, duration: 4, srpe: 5,
  ready: 7, protein: 8, fat: 9, carbs: 10,
  weight: 16, notes: 17,
};
const FIRST_ROW = 6;
const LAST_ROW = 33;

// ============================================================
// 路由
// ============================================================
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || "{}");
    const action = data.action || "sync";  // 預設舊版相容

    if (action === "analyze") return handleAnalyze(data);
    if (action === "sync")    return handleSync(data);
    return jsonResponse({ status: "error", message: `未知 action: ${action}` });
  } catch (err) {
    return jsonResponse({ status: "error", message: String(err) });
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput("Fitness Tracker Web App is live. Use POST with JSON.")
    .setMimeType(ContentService.MimeType.TEXT);
}

// ============================================================
// 1. action=sync — 寫入 Google Sheet
// ============================================================
function handleSync(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    return jsonResponse({ status: "error", message: `找不到分頁「${SHEET_NAME}」` });
  }
  if (!data.date) return jsonResponse({ status: "error", message: "缺少日期" });

  const targetDate = new Date(data.date);
  const dateValues = sheet.getRange(FIRST_ROW, COL.date, LAST_ROW - FIRST_ROW + 1).getValues();

  let row = -1;
  for (let i = 0; i < dateValues.length; i++) {
    const v = dateValues[i][0];
    if (v && new Date(v).toDateString() === targetDate.toDateString()) {
      row = FIRST_ROW + i;
      break;
    }
  }
  if (row === -1) {
    for (let i = 0; i < dateValues.length; i++) {
      if (!dateValues[i][0]) { row = FIRST_ROW + i; break; }
    }
  }
  if (row === -1) return jsonResponse({ status: "error", message: "儀表板已滿" });

  sheet.getRange(row, COL.date).setValue(targetDate);
  setIfPresent(sheet, row, COL.trainingType, data.training_type);
  setIfPresent(sheet, row, COL.duration, data.duration);
  setIfPresent(sheet, row, COL.srpe, data.srpe);
  setIfPresent(sheet, row, COL.ready, data.ready);
  setIfPresent(sheet, row, COL.protein, data.protein);
  setIfPresent(sheet, row, COL.fat, data.fat);
  setIfPresent(sheet, row, COL.carbs, data.carbs);
  setIfPresent(sheet, row, COL.weight, data.weight);
  setIfPresent(sheet, row, COL.notes, data.notes);

  return jsonResponse({ status: "ok", row: row });
}

// ============================================================
// 2. action=analyze — Gemini Vision 食物分析
// ============================================================
function handleAnalyze(data) {
  const apiKey = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
  if (!apiKey) {
    return jsonResponse({
      status: "error",
      message: "Apps Script 缺 GEMINI_API_KEY。請到專案設定→指令碼屬性新增。",
    });
  }
  if (!data.image_base64) {
    return jsonResponse({ status: "error", message: "缺少 image_base64" });
  }

  const prompt = `你是一位專業的營養師。請仔細分析這張食物照片，估算每個食物項目的：
- 名稱
- 重量（公克，需估算）
- 蛋白質（公克）
- 脂肪（公克）
- 碳水化合物（公克）
- 熱量（kcal）

回傳格式必須是 valid JSON（不要包在 markdown code block 裡），結構如下：
{
  "items": [
    {"name": "雞胸肉", "grams": 150, "protein_g": 34.5, "fat_g": 2.7, "carb_g": 0, "kcal": 165}
  ],
  "totals": {"protein_g": 34.5, "fat_g": 2.7, "carb_g": 0, "kcal": 165},
  "confidence": "high",
  "notes": "依據台灣常見食物份量估算。可能誤差約 ±15%"
}

confidence 為 "high" / "medium" / "low"。totals 必須是 items 的加總。
若照片中沒有可辨識的食物，回傳 {"items": [], "totals": {...}, "confidence": "low", "notes": "未辨識出食物"}。`;

  const payload = {
    contents: [{
      parts: [
        { text: prompt },
        { inline_data: { mime_type: data.mime_type || "image/jpeg", data: data.image_base64 } },
      ],
    }],
    generationConfig: {
      response_mime_type: "application/json",
      temperature: 0.2,
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  const code = response.getResponseCode();
  const body = response.getContentText();

  if (code !== 200) {
    return jsonResponse({
      status: "error",
      message: `Gemini API 錯誤 ${code}`,
      detail: body.slice(0, 500),
    });
  }

  let result;
  try {
    const json = JSON.parse(body);
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
    result = JSON.parse(text);
  } catch (e) {
    return jsonResponse({ status: "error", message: "Gemini 回傳格式錯誤", detail: String(e) });
  }

  return jsonResponse({ status: "ok", result: result });
}

// ============================================================
// Helpers
// ============================================================
function setIfPresent(sheet, row, col, value) {
  if (value === undefined || value === null || value === "") return;
  sheet.getRange(row, col).setValue(value);
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// 測試函數（手動執行用）
// ============================================================
function testSync() {
  const result = handleSync({
    date: new Date().toISOString().slice(0, 10),
    training_type: "模組 A 全身",
    duration: 60,
    srpe: 8,
    ready: 30,
    protein: 175,
    fat: 70,
    carbs: 240,
    weight: 80,
    notes: "測試",
  });
  Logger.log(result.getContent());
}

function testGeminiKey() {
  const key = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
  Logger.log(key ? `Key 已設定 (長度 ${key.length})` : "GEMINI_API_KEY 尚未設定！");
}
