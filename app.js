/* Fitness Tracker — Daily entry, training program, LocalStorage, optional Sheet sync */

const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

const TODAY = new Date();
const DATE_STR = toDateStr(TODAY);

function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ---------- Defaults ----------
const DEFAULT_1RM = {
  bench: 95,
  squat: 115,
  deadlift: 140,
  ohp: 60,
  row: 90,
  frontSquat: 95,
  rdl: 115,
  hipThrust: 145,
};

const DEFAULT_SETTINGS = {
  appsScriptUrl: "",
  bodyweight: 90,
  proteinTarget: 180,
  fatTarget: 81,
  kcalTrainTarget: 2866,
  kcalRestTarget: 2666,
  rm: { ...DEFAULT_1RM },
};

const DEFAULT_TODAY = () => ({
  date: DATE_STR,
  trainingType: "",
  duration: 0,
  srpe: 0,
  ready: { sleep: 7, soreness: 7, mood: 7, appetite: 7 },
  protein: 0,
  fat: 0,
  carbs: 0,
  weight: "",
  notes: "",
});

const READY_KEYS = ["sleep", "soreness", "mood", "appetite"];
const TRAINING_PREFIXES = ["Day 1", "Day 2", "Day 4", "Day 5"];
const TRAINING_EXACT = ["方案A 全身"];

function isTraining(t) {
  if (!t) return false;
  if (TRAINING_EXACT.includes(t)) return true;
  return TRAINING_PREFIXES.some(p => t.startsWith(p));
}

// ---------- Program data ----------
// liftKey 對應 settings.rm 的 key；無則 fixed/RPE 控
const PROGRAM = {
  "Day 1 推": {
    title: "Day 1｜上肢推（水平 + 垂直）",
    meta: "強度 75% 1RM｜目標 RPE 8｜約 60 分",
    exercises: [
      { name: "槓鈴平板臥推", setsReps: "4 × 6-8",  liftKey: "bench", pct: 0.75, rpe: 8,   rest: "2-3 分", note: "Full ROM 觸胸" },
      { name: "坐姿槓鈴肩推",   setsReps: "4 × 8-10", liftKey: "ohp",   pct: 0.72, rpe: 8,   rest: "2 分",   note: "過頂鎖定" },
      { name: "上斜啞鈴臥推 30°", setsReps: "3 × 8-10", fixed: 32.5,            rpe: 8,   rest: "90 秒",   note: "單手啞鈴 kg" },
      { name: "雙槓撐體（加重）",  setsReps: "3 × 8-10", rpeOnly: true,           rpe: 8,   rest: "90 秒",   note: "剩 2 下保留量" },
      { name: "繩索三頭下壓",    setsReps: "3 × 10-12", rpeOnly: true,           rpe: 8,   rest: "60 秒",   note: "肘穩定夾體側" },
      { name: "啞鈴側平舉",     setsReps: "3 × 12-15", rpeOnly: true,           rpe: 9,   rest: "60 秒",   note: "單手 8-12 kg 起" },
    ],
  },
  "Day 2 腿A": {
    title: "Day 2｜下肢多關節（強攻第二型快縮肌）",
    meta: "強度 80% 1RM｜目標 RPE 8.5｜約 70 分",
    exercises: [
      { name: "槓鈴背蹲（高槓）", setsReps: "4 × 5-6",   liftKey: "squat", pct: 0.80, rpe: 8.5, rest: "3 分",   note: "蹲至大腿平行以下" },
      { name: "羅馬尼亞硬舉",    setsReps: "4 × 6-8",   liftKey: "rdl",   pct: 0.75, rpe: 8,   rest: "2-3 分", note: "膕繩拉伸感" },
      { name: "保加利亞分腿蹲", setsReps: "3 × 8-10/邊", fixed: 22.5,             rpe: 8,   rest: "90 秒",   note: "單手啞鈴 kg" },
      { name: "腿推 (Leg Press)",setsReps: "3 × 8-10",  rpeOnly: true,           rpe: 8,   rest: "2 分",   note: "大角度 ROM" },
      { name: "坐姿腿彎舉",     setsReps: "3 × 10-12", rpeOnly: true,           rpe: 8,   rest: "60 秒",   note: "頂端 2 秒收縮" },
      { name: "站姿提踵",      setsReps: "4 × 12-15", rpeOnly: true,           rpe: 9,   rest: "60 秒",   note: "完整下伸+頂端收縮" },
    ],
  },
  "Day 4 拉": {
    title: "Day 4｜上肢拉（厚度 + 寬度）",
    meta: "強度 75% 1RM｜目標 RPE 8｜約 60 分",
    exercises: [
      { name: "引體向上 / 滑輪下拉", setsReps: "4 × 6-8", liftKey: "bodyweight", rpe: 8, rest: "2-3 分", note: "起始全伸展；加重 = BW + X" },
      { name: "槓鈴俯身划船",     setsReps: "4 × 6-8", liftKey: "row", pct: 0.75, rpe: 8, rest: "2 分", note: "軀幹 45°，拉至下腹" },
      { name: "啞鈴單臂划船",     setsReps: "3 × 8-10/邊", fixed: 32.5,        rpe: 8, rest: "90 秒", note: "單手啞鈴 kg" },
      { name: "繩索面拉",      setsReps: "3 × 12-15", rpeOnly: true,         rpe: 8, rest: "60 秒", note: "後束 + 旋轉肌群" },
      { name: "槓鈴二頭彎舉",    setsReps: "3 × 8-10",  fixed: 30,              rpe: 8, rest: "90 秒", note: "EZ 桿或直槓" },
      { name: "啞鈴錘式彎舉",    setsReps: "3 × 10-12", fixed: 14,              rpe: 8, rest: "60 秒", note: "單手啞鈴 kg" },
    ],
  },
  "Day 5 腿B": {
    title: "Day 5｜下肢功能性強化",
    meta: "強度 80% 1RM｜目標 RPE 9｜約 70 分",
    exercises: [
      { name: "傳統硬舉",       setsReps: "4 × 4-6",   liftKey: "deadlift",   pct: 0.80, rpe: 9, rest: "3 分",   note: "槓貼小腿，背中立" },
      { name: "前蹲 (Front Squat)", setsReps: "3 × 6-8", liftKey: "frontSquat", pct: 0.75, rpe: 8, rest: "2-3 分", note: "軀幹直立，肘高抬" },
      { name: "槓鈴髖推",       setsReps: "4 × 8-10",  liftKey: "hipThrust",  pct: 0.80, rpe: 8, rest: "90 秒",   note: "頂端臀夾 1 秒" },
      { name: "行走式弓步（DB）",  setsReps: "3 × 10 步/邊", fixed: 20,              rpe: 8, rest: "90 秒",   note: "單手啞鈴 kg" },
      { name: "腿彎舉（機械）",   setsReps: "3 × 8-10",  rpeOnly: true,            rpe: 8, rest: "60 秒",   note: "離心 3-4 秒" },
      { name: "坐姿提踵",       setsReps: "4 × 10-12", rpeOnly: true,            rpe: 9, rest: "60 秒",   note: "比目魚肌聚焦" },
    ],
  },
  "方案A 全身": {
    title: "方案 A 備援｜全身效率型 — 每週 2-3 次",
    meta: "出差 / 減載 / 復健週使用｜≤ 60 分",
    exercises: [
      { name: "槓鈴背蹲 或 硬舉",  setsReps: "3-4 × 6-8", liftKey: "squat", pct: 0.75, rpe: 7.5, rest: "2-3 分", note: "二擇一輪替" },
      { name: "槓鈴臥推 或 雙槓撐體", setsReps: "3 × 6-8", liftKey: "bench", pct: 0.75, rpe: 7.5, rest: "2 分", note: "二擇一" },
      { name: "槓鈴划船 或 引體向上", setsReps: "3 × 6-8", liftKey: "row", pct: 0.75, rpe: 7.5, rest: "2 分", note: "二擇一" },
      { name: "肩推 或 滑輪下拉",   setsReps: "3 × 8-10", liftKey: "ohp", pct: 0.72, rpe: 7.5, rest: "90 秒", note: "二擇一" },
      { name: "臀橋 / 髖推",      setsReps: "3 × 10",   rpeOnly: true,          rpe: 7,   rest: "90 秒",   note: "頂端夾臀" },
      { name: "核心循環",       setsReps: "3 組 30-60 秒", rpeOnly: true,        rpe: 7,   rest: "30 秒",  note: "棒式 / 死蟲式 / 農夫走" },
    ],
  },
};

function mround(v, step) {
  return Math.round(v / step) * step;
}

function targetWeight(ex, rmMap) {
  if (ex.fixed != null) return { kg: ex.fixed, label: `${ex.fixed} kg`, sub: "" };
  if (ex.rpeOnly) return { kg: null, label: "RPE 控", sub: "" };
  if (ex.liftKey === "bodyweight") return { kg: null, label: "BW + 0", sub: "可加重" };
  if (ex.liftKey && rmMap[ex.liftKey] != null && ex.pct != null) {
    const raw = rmMap[ex.liftKey] * ex.pct;
    const rounded = mround(raw, 2.5);
    const pct = Math.round(ex.pct * 100);
    return { kg: rounded, label: `${rounded} kg`, sub: `${pct}% × ${rmMap[ex.liftKey]}` };
  }
  return { kg: null, label: "—", sub: "" };
}

// ---------- State ----------
let settings = loadSettings();
let today = loadToday();
let currentView = "entry";
let currentDay = "Day 1 推";

function loadSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem("ft_settings") || "{}");
    return {
      ...DEFAULT_SETTINGS,
      ...stored,
      rm: { ...DEFAULT_1RM, ...(stored.rm || {}) },
    };
  } catch {
    return { ...DEFAULT_SETTINGS, rm: { ...DEFAULT_1RM } };
  }
}

function loadToday() {
  try {
    const raw = localStorage.getItem(`ft_day_${DATE_STR}`);
    if (raw) return { ...DEFAULT_TODAY(), ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_TODAY();
}

function persistSettings() {
  localStorage.setItem("ft_settings", JSON.stringify(settings));
}

function persistToday() {
  localStorage.setItem(`ft_day_${DATE_STR}`, JSON.stringify(today));
}

// ---------- Derived calculations ----------
function compute(day = today) {
  const kcal = (day.protein || 0) * 4 + (day.fat || 0) * 9 + (day.carbs || 0) * 4;
  const target = isTraining(day.trainingType) ? settings.kcalTrainTarget : settings.kcalRestTarget;
  const deltaKcal = kcal - target;
  const deltaP = (day.protein || 0) - settings.proteinTarget;
  const points = (day.duration || 0) * (day.srpe || 0);
  const ready = READY_KEYS.reduce((s, k) => s + (day.ready?.[k] || 0), 0);
  return { kcal, target, deltaKcal, deltaP, points, ready };
}

function statusOf(day = today) {
  const { deltaKcal, deltaP, ready } = compute(day);
  const hasIntake = (day.protein || 0) + (day.fat || 0) + (day.carbs || 0) > 0;
  if (!hasIntake) return "empty";
  if (Math.abs(deltaKcal) <= 200 && deltaP >= -20 && ready >= 14) return "ok";
  if (Math.abs(deltaKcal) > 400 || deltaP < -40 || ready < 10) return "bad";
  return "warn";
}

const STATUS_GLYPH = { ok: "✓", warn: "⚠", bad: "✗", empty: "—" };

// ---------- Render: entry view ----------
function renderEntry() {
  $("todayDate").textContent = TODAY.toLocaleDateString("zh-TW", {
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  });

  $$(".chip").forEach(c => c.classList.toggle("active", c.dataset.value === today.trainingType));

  $("duration").value = today.duration || "";
  $("srpe").value = today.srpe || "";

  $("protein").value = today.protein || "";
  $("fat").value = today.fat || "";
  $("carbs").value = today.carbs || "";

  $("proteinNow").textContent = today.protein || 0;
  $("fatNow").textContent = today.fat || 0;
  $("carbsNow").textContent = today.carbs || 0;
  $("proteinTargetLabel").textContent = settings.proteinTarget;

  const pPct = Math.min(120, ((today.protein || 0) / settings.proteinTarget) * 100);
  $("proteinFill").style.width = pPct + "%";

  READY_KEYS.forEach((k, i) => {
    const idx = i + 1;
    $(`r${idx}`).value = today.ready[k];
    $(`r${idx}v`).textContent = today.ready[k];
  });

  $("weight").value = today.weight || "";
  $("notes").value = today.notes || "";

  const { kcal, target, deltaKcal, points, ready } = compute();
  const st = statusOf();

  $("kcalDisplay").textContent = kcal;
  $("kcalTargetLabel").textContent = "/ " + target;
  $("readyTotal").textContent = ready;

  $("statusIcon").textContent = STATUS_GLYPH[st];
  $("statusIcon").dataset.state = st;

  $("mKcal").textContent = kcal || "—";
  $("mDelta").textContent = kcal ? (deltaKcal > 0 ? "+" : "") + deltaKcal : "—";
  $("mPts").textContent = points || "—";
  $("mReady").textContent = ready;

  renderHistory();
}

function renderHistory() {
  const list = $("historyList");
  list.innerHTML = "";

  const records = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(TODAY);
    d.setDate(d.getDate() - i);
    const key = `ft_day_${toDateStr(d)}`;
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try { records.push({ d, data: { ...DEFAULT_TODAY(), ...JSON.parse(raw) } }); } catch {}
  }

  if (records.length === 0) {
    list.innerHTML = '<div class="empty">尚無紀錄</div>';
    $("streakLabel").textContent = "";
    return;
  }

  let streak = 0;
  for (const r of records) {
    if (statusOf(r.data) === "ok") streak++;
    else break;
  }
  $("streakLabel").textContent = streak > 0 ? `連續達標 ${streak} 天` : "";

  records.forEach(({ d, data }, i) => {
    const { kcal } = compute(data);
    const st = statusOf(data);
    const item = document.createElement("div");
    item.className = "history-item";
    const dateLabel = i === 0
      ? "今天"
      : d.toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" });
    item.innerHTML = `
      <span class="date-col">${escapeHtml(dateLabel)}</span>
      <span class="type-col">${escapeHtml(data.trainingType || "休息")}</span>
      <span class="kcal-col">${kcal || "—"} kcal</span>
      <span class="status-col ${st}">${STATUS_GLYPH[st]}</span>
    `;
    list.appendChild(item);
  });
}

// ---------- Render: program view ----------
function renderProgram() {
  const day = PROGRAM[currentDay];
  if (!day) return;

  $$(".day-tab").forEach(t => t.classList.toggle("active", t.dataset.day === currentDay));
  $("dayTitle").textContent = day.title;
  $("dayMeta").textContent = day.meta;

  const list = $("exerciseList");
  list.innerHTML = "";

  day.exercises.forEach((ex, i) => {
    const t = targetWeight(ex, settings.rm);
    const card = document.createElement("article");
    card.className = "exercise";
    card.innerHTML = `
      <div class="ex-head">
        <div class="ex-num">${String(i + 1).padStart(2, "0")}</div>
        <div class="ex-name">${escapeHtml(ex.name)}</div>
      </div>
      <div class="ex-meta">
        <div class="ex-target">
          <span class="ex-target-kg">${escapeHtml(t.label)}</span>
          ${t.sub ? `<span class="ex-target-pct">${escapeHtml(t.sub)}</span>` : ""}
        </div>
        <div class="ex-spec"><span class="ex-spec-icon">×</span><strong>${escapeHtml(ex.setsReps)}</strong></div>
        <div class="ex-spec"><span class="ex-spec-icon">⚡</span>RPE <strong>${ex.rpe}</strong></div>
        <div class="ex-spec"><span class="ex-spec-icon">⏱</span>休 <strong>${escapeHtml(ex.rest)}</strong></div>
      </div>
      ${ex.note ? `<div class="ex-note">${escapeHtml(ex.note)}</div>` : ""}
    `;
    list.appendChild(card);
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[m]));
}

// ---------- View switching ----------
function switchView(view) {
  currentView = view;
  $$(".view-tab").forEach(t => {
    const active = t.dataset.view === view;
    t.classList.toggle("active", active);
    t.setAttribute("aria-selected", active);
  });
  $$(".view").forEach(s => {
    s.hidden = s.dataset.view !== view;
  });
  if (view === "program") renderProgram();
  if (view === "entry") renderEntry();
  // Persist view in URL (shallow)
  const url = new URL(window.location.href);
  url.searchParams.set("view", view);
  history.replaceState({}, "", url.toString());
}

function switchDay(day) {
  currentDay = day;
  renderProgram();
}

// ---------- Events ----------
function setupEvents() {
  // View tabs
  $$(".view-tab").forEach(t => {
    t.addEventListener("click", () => switchView(t.dataset.view));
  });
  // Day tabs
  $$(".day-tab").forEach(t => {
    t.addEventListener("click", () => switchDay(t.dataset.day));
  });

  // Training chips
  $$(".chip").forEach(c => {
    c.addEventListener("click", () => {
      today.trainingType = today.trainingType === c.dataset.value ? "" : c.dataset.value;
      persistToday();
      renderEntry();
    });
  });

  // Number inputs
  ["duration", "srpe", "protein", "fat", "carbs"].forEach(id => {
    $(id).addEventListener("input", e => {
      today[id] = parseFloat(e.target.value) || 0;
      persistToday();
      renderEntry();
    });
  });

  $("weight").addEventListener("input", e => {
    today.weight = e.target.value === "" ? "" : parseFloat(e.target.value) || "";
    persistToday();
    renderEntry();
  });

  $("notes").addEventListener("input", e => {
    today.notes = e.target.value;
    persistToday();
  });

  // Steppers (entry view)
  $$("#entryView .stepper button").forEach(b => {
    b.addEventListener("click", () => {
      const t = b.dataset.target;
      const delta = parseFloat(b.dataset.delta);
      const cur = today[t] || 0;
      today[t] = Math.max(0, Math.round((cur + delta) * 10) / 10);
      persistToday();
      renderEntry();
    });
  });

  // Ready sliders
  READY_KEYS.forEach((k, i) => {
    $(`r${i + 1}`).addEventListener("input", e => {
      today.ready[k] = parseInt(e.target.value, 10);
      persistToday();
      renderEntry();
    });
  });

  // Action buttons
  $("saveBtn").addEventListener("click", () => {
    persistToday();
    renderEntry();
    toast("已儲存到本機 ✓", "success");
  });
  $("exportBtn").addEventListener("click", exportCSV);
  $("syncBtn").addEventListener("click", syncToSheet);
  $("settingsBtn").addEventListener("click", openSettings);
  $("closeSettings").addEventListener("click", closeSettings);
  $("saveSettings").addEventListener("click", saveSettings);
  $("clearAllBtn").addEventListener("click", clearAll);

  $("settingsModal").addEventListener("click", e => {
    if (e.target.id === "settingsModal") closeSettings();
  });
}

// ---------- CSV export ----------
function exportCSV() {
  const days = collectAllDays();
  if (days.length === 0) {
    toast("尚無資料可匯出", "error");
    return;
  }
  const headers = [
    "日期", "訓練類型", "時長(分)", "S-RPE", "點數",
    "睡眠", "痠痛", "心情", "食慾", "Ready",
    "蛋白質(g)", "脂肪(g)", "碳水(g)", "熱量",
    "體重(kg)", "備註",
  ];
  const rows = [headers];
  days.forEach(d => {
    const { kcal, points, ready } = compute(d);
    rows.push([
      d.date, d.trainingType, d.duration, d.srpe, points,
      d.ready.sleep, d.ready.soreness, d.ready.mood, d.ready.appetite, ready,
      d.protein, d.fat, d.carbs, kcal,
      d.weight, d.notes,
    ]);
  });

  const csv = "﻿" + rows.map(r =>
    r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")
  ).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `fitness-${DATE_STR}.csv`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }, 100);
  toast(`已匯出 ${days.length} 天資料`, "success");
}

function collectAllDays() {
  const days = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("ft_day_")) {
      try { days.push({ ...DEFAULT_TODAY(), ...JSON.parse(localStorage.getItem(k)) }); } catch {}
    }
  }
  days.sort((a, b) => a.date.localeCompare(b.date));
  return days;
}

// ---------- Google Sheet sync ----------
async function syncToSheet() {
  if (!settings.appsScriptUrl) {
    toast("請先在設定中填入 Apps Script URL", "error");
    openSettings();
    return;
  }
  toast("同步中…");
  const { kcal, points, ready } = compute();
  const payload = {
    date: today.date,
    training_type: today.trainingType,
    duration: today.duration,
    srpe: today.srpe,
    points,
    ready,
    ready_sleep: today.ready.sleep,
    ready_soreness: today.ready.soreness,
    ready_mood: today.ready.mood,
    ready_appetite: today.ready.appetite,
    protein: today.protein,
    fat: today.fat,
    carbs: today.carbs,
    kcal,
    weight: today.weight,
    notes: today.notes,
  };
  try {
    await fetch(settings.appsScriptUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    toast("已送出到 Google Sheet ✓", "success");
  } catch (e) {
    toast("同步失敗：" + e.message, "error");
  }
}

// ---------- Settings ----------
function openSettings() {
  $("appsScriptUrl").value = settings.appsScriptUrl;
  $("bodyweight").value = settings.bodyweight;
  $("proteinTarget").value = settings.proteinTarget;
  $("kcalTrainTarget").value = settings.kcalTrainTarget;
  $("kcalRestTarget").value = settings.kcalRestTarget;
  // 1RM fields
  Object.keys(DEFAULT_1RM).forEach(k => {
    const el = $(`rm_${k}`);
    if (el) el.value = settings.rm[k] ?? "";
  });
  $("settingsModal").hidden = false;
}

function closeSettings() {
  $("settingsModal").hidden = true;
}

function saveSettings() {
  settings.appsScriptUrl = $("appsScriptUrl").value.trim();
  settings.bodyweight = parseFloat($("bodyweight").value) || 90;
  settings.proteinTarget = parseFloat($("proteinTarget").value) || 180;
  settings.kcalTrainTarget = parseFloat($("kcalTrainTarget").value) || 2866;
  settings.kcalRestTarget = parseFloat($("kcalRestTarget").value) || 2666;
  Object.keys(DEFAULT_1RM).forEach(k => {
    const el = $(`rm_${k}`);
    if (el) {
      const v = parseFloat(el.value);
      settings.rm[k] = Number.isFinite(v) && v > 0 ? v : DEFAULT_1RM[k];
    }
  });
  persistSettings();
  closeSettings();
  renderEntry();
  if (currentView === "program") renderProgram();
  toast("設定已儲存 ✓", "success");
}

function clearAll() {
  if (!confirm("確定清除所有本地資料？（已匯出到 Sheet/CSV 的不受影響）")) return;
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && (k.startsWith("ft_day_") || k === "ft_settings")) keys.push(k);
  }
  keys.forEach(k => localStorage.removeItem(k));
  settings = loadSettings();
  today = loadToday();
  closeSettings();
  renderEntry();
  renderProgram();
  toast("已清除", "success");
}

// ---------- Toast ----------
let toastTimeout = null;
function toast(msg, type = "") {
  document.querySelectorAll(".toast").forEach(t => t.remove());
  clearTimeout(toastTimeout);
  const el = document.createElement("div");
  el.className = "toast" + (type ? " " + type : "");
  el.textContent = msg;
  document.body.appendChild(el);
  toastTimeout = setTimeout(() => el.remove(), 2800);
}

// ---------- Boot ----------
setupEvents();

// Initial view from ?view= (manifest shortcuts use this)
const urlParams = new URLSearchParams(window.location.search);
const initialView = urlParams.get("view");
switchView(initialView === "program" ? "program" : "entry");
