# Fitness Tracker

基於 NotebookLM Report《科學實證的高效增肌減脂訓練藍圖》設計的個人化健身追蹤系統。

> **目標族群**：男性 / 90 kg / 中階 / Body Recomp
> **訓練架構**：方案 B（每週 4 訓 + 1 主動恢復）
> **強度區間**：70-80% 1RM｜RPE 7-9｜PPL 分割

---

## 內容

| 檔案 | 用途 |
|---|---|
| `index.html` + `style.css` + `app.js` | 手機友善的每日填寫頁面（深色 + 橙漸層） |
| `apps-script.gs` | Google Sheet 同步腳本 |
| `docs/健身課表_實作版.xlsx` | 完整 Excel 課表（12 分頁） |
| `docs/workout_program_for_gsheets.xlsx` | 上述的 ASCII 檔名複本，方便 Drive 上傳 |
| `docs/健身課表_科學增肌減脂藍圖.md` | 4 週訓練計畫書 |

---

## 線上版

部署完成後可在以下網址使用：

👉 **https://joshlin55688-debug.github.io/fitness-tracker/**

支援桌面與手機；手機加入主畫面後可當 PWA-like 使用。

---

## 主要功能

### 每日輸入頁
- **訓練類型一鍵選擇**：Day 1 / Day 2 / Day 4 / Day 5 / 方案 A / 主動恢復 / 休息
- **Stepper 巨型按鈕**：蛋白 / 脂肪 / 碳水 ±鈕，避免在手機上打字
- **Readiness 4 項滑桿**：睡眠 / 痠痛 / 心情 / 食慾，1–10 分
- **即時計算**：點數、熱量、ΔKcal、ΔP、狀態（✓ / ⚠ / ✗）
- **狀態指示燈**：依 Report 原則自動判定當日達標
- **連續達標天數**：自動算 streak

### 資料保存
- **LocalStorage 自動存檔**：每次輸入即時寫入瀏覽器
- **匯出 CSV**：4 週資料一鍵下載，含 BOM 支援 Excel/Sheets 直接開啟
- **同步到 Google Sheet**（選用）：填好今日 → 一鍵寫入試算表，公式自動算 ACWR / 週彙總

---

## 設置 Google Sheet 同步

### 步驟 1：上傳 Excel 到 Google Drive

1. 開啟 [Google Drive](https://drive.google.com)
2. 把 `docs/workout_program_for_gsheets.xlsx` 拖進 Drive
3. 雙擊該檔 → 點上方「**以 Google 試算表開啟**」
4. 開啟後 → 檔案 → **另存為 Google 試算表**

### 步驟 2：部署 Apps Script

1. 在 Google Sheet 中：**擴充功能** → **Apps Script**
2. 把 [`apps-script.gs`](apps-script.gs) 整段內容貼上，覆蓋預設的 `Code.gs`
3. 點選工具列「**部署**」 → **新增部署作業**
4. 齒輪圖示選擇「**網頁應用程式**」
5. 設定：
   - **執行身分**：我（Me）
   - **存取權**：任何人（Anyone）
6. 點「部署」→ 授權（第一次會跳警告，按「進階」→「前往未經驗證的應用程式」）
7. 複製產生的 **Web app URL**（形如 `https://script.google.com/macros/s/.../exec`）

### 步驟 3：連結網頁

1. 開啟 Fitness Tracker 網頁
2. 點右上 **⚙ 設定**
3. 把 Web app URL 貼進「Google Apps Script URL」
4. 儲存

之後每天填完按「**同步 Sheet**」即可寫入儀表板。同日重複按會覆蓋當日列（不會重複）。

---

## 個人化參數

預設值（90 kg 中階男 / Body Recomp）：

| 參數 | 預設 | 計算依據 |
|---|---|---|
| 體重 | 90 kg | — |
| 蛋白質目標 | 180 g | 2.0 g/kg |
| 脂肪目標 | 81 g | 0.9 g/kg |
| 訓練日熱量 | 2866 kcal | Mifflin-St Jeor × 1.55 |
| 休息日熱量 | 2666 kcal | 訓練日 -200 kcal |

若需調整：⚙ 設定 → 改數字 → 儲存。所有衍生計算（ΔKcal / ΔP）會即時跟著更新。

---

## 達標判定邏輯

| 狀態 | 條件 |
|---|---|
| ✓ 達標 | 熱量 ±200 kcal + 蛋白 ≥-20 g + Readiness ≥14 |
| ⚠ 警示 | 有 1 項偏離但未越紅線 |
| ✗ 未達標 | 熱量差 >400 kcal 或 蛋白差 <-40 g 或 Readiness <10 |

連續 3 日 ✗ → 強制隔日改主動恢復或睡眠補足。

---

## 技術設計

- **純靜態頁面**：Vanilla HTML / CSS / JS，無框架、無 build 步驟
- **零後端**：所有計算瀏覽器端完成；同步用 Apps Script 當無伺服器端點
- **LocalStorage**：以 `ft_day_YYYY-MM-DD` 為 key 儲存每日，`ft_settings` 儲存設定
- **CORS**：同步以 `no-cors` 模式發送，回應不可讀但寫入成功
- **離線可用**：所有資料先存本機，網路恢復後再同步

---

## 開發與本機測試

純靜態檔案，直接打開 `index.html` 即可。或：

```bash
# Python 簡易伺服器
python -m http.server 8080
# 訪問 http://localhost:8080
```

---

## 來源

- 訓練設計依據：NotebookLM 整合之 ACSM 2026 立場聲明、GAS / SAID 原則、ACWR 工作負荷管理
- 1RM 估算：對中階男 90 kg 採保守值（臥推 95kg / 背蹲 115kg / 硬舉 140kg）
- 營養目標：Mifflin-St Jeor BMR + 活動係數 1.55 / Body Recomp -200 kcal 休息日

⚠ 本工具僅供個人運動紀錄，非醫療建議。傷痛或慢性病請諮詢專業教練 / 醫師。

---

## License

MIT
