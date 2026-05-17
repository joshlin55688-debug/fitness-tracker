/**
 * Fitness Tracker — Google Apps Script Web App
 *
 * 安裝步驟：
 * 1. 把 docs/workout_program_for_gsheets.xlsx 上傳到 Google Drive
 * 2. 以 Google 試算表開啟 → 另存為 Google Sheet
 * 3. 在試算表中：擴充功能 (Extensions) → Apps Script
 * 4. 把這段程式碼整段貼上，覆蓋預設的 Code.gs
 * 5. 部署 (Deploy) → 新增部署作業 → 類型：網頁應用程式
 *      - 執行身分 (Execute as): 我 (Me)
 *      - 存取權 (Who has access): 任何人 (Anyone)
 * 6. 複製產生的 Web app URL
 * 7. 回到 Fitness Tracker 網頁 → ⚙ 設定 → 貼上 URL → 儲存
 *
 * 之後在網頁按「同步 Sheet」即可寫入今天那一列。
 * 同一日期重複同步會「覆蓋」原列（非附加新列）。
 */

const SHEET_NAME = "每日儀表板";

// 欄位對應（與 Excel 模板一致）
const COL = {
  date: 1,           // A
  weekday: 2,        // B (公式自動)
  trainingType: 3,   // C
  duration: 4,       // D
  srpe: 5,           // E
  // points: 6 (公式自動)
  ready: 7,          // G
  protein: 8,        // H
  fat: 9,            // I
  carbs: 10,         // J
  // kcal: 11 (公式自動)
  // targetKcal: 12 (公式自動)
  // deltaKcal: 13 (公式自動)
  // deltaP: 14 (公式自動)
  // status: 15 (公式自動)
  weight: 16,        // P
  notes: 17,         // Q
};

const FIRST_ROW = 6;
const LAST_ROW = 33;  // 28 天容量

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return jsonResponse({
        status: "error",
        message: `找不到分頁「${SHEET_NAME}」，請確認試算表結構正確`,
      });
    }

    const data = JSON.parse(e.postData.contents);
    if (!data.date) {
      return jsonResponse({ status: "error", message: "缺少日期" });
    }

    const targetDate = new Date(data.date);
    const dateValues = sheet.getRange(FIRST_ROW, COL.date, LAST_ROW - FIRST_ROW + 1).getValues();

    // 1. 嘗試找出同日期的列（覆蓋）
    let row = -1;
    for (let i = 0; i < dateValues.length; i++) {
      const v = dateValues[i][0];
      if (v && new Date(v).toDateString() === targetDate.toDateString()) {
        row = FIRST_ROW + i;
        break;
      }
    }
    // 2. 沒有就找第一個空列
    if (row === -1) {
      for (let i = 0; i < dateValues.length; i++) {
        if (!dateValues[i][0]) {
          row = FIRST_ROW + i;
          break;
        }
      }
    }
    if (row === -1) {
      return jsonResponse({
        status: "error",
        message: "儀表板已滿，請清除舊資料或擴充列數",
      });
    }

    // 寫入欄位（空值跳過，保留試算表原值）
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

    return jsonResponse({ status: "ok", row: row, date: data.date });
  } catch (err) {
    return jsonResponse({ status: "error", message: String(err) });
  }
}

function setIfPresent(sheet, row, col, value) {
  if (value === undefined || value === null || value === "") return;
  sheet.getRange(row, col).setValue(value);
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService
    .createTextOutput("Fitness Tracker Web App is live. Use POST with JSON payload.")
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * 測試用：在 Apps Script 編輯器內手動執行一次，確認權限通過。
 * 第一次執行會跳出授權對話框，授權後才能 doPost 寫入。
 */
function testWrite() {
  const fakeEvent = {
    postData: {
      contents: JSON.stringify({
        date: new Date().toISOString().slice(0, 10),
        training_type: "Day 1 推",
        duration: 60,
        srpe: 8,
        ready: 30,
        protein: 180,
        fat: 80,
        carbs: 340,
        weight: 90,
        notes: "測試寫入",
      }),
    },
  };
  const result = doPost(fakeEvent);
  Logger.log(result.getContent());
}
