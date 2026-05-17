/* Fitness Tracker — Daily entry, LocalStorage, optional Google Sheet sync */

const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

const TODAY = new Date();
const DATE_STR = toDateStr(TODAY);

function toDateStr(d) {
  // YYYY-MM-DD in local time
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DEFAULT_SETTINGS = {
  appsScriptUrl: "",
  bodyweight: 90,
  proteinTarget: 180,
  fatTarget: 81,
  kcalTrainTarget: 2866,
  kcalRestTarget: 2666,
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

// ---------- State ----------
let settings = loadSettings();
let today = loadToday();

function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem("ft_settings") || "{}") };
  } catch {
    return { ...DEFAULT_SETTINGS };
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
  const { kcal, deltaKcal, deltaP, ready } = compute(day);
  const hasIntake = (day.protein || 0) + (day.fat || 0) + (day.carbs || 0) > 0;
  if (!hasIntake) return "empty";
  if (Math.abs(deltaKcal) <= 200 && deltaP >= -20 && ready >= 14) return "ok";
  if (Math.abs(deltaKcal) > 400 || deltaP < -40 || ready < 10) return "bad";
  return "warn";
}

const STATUS_GLYPH = { ok: "✓", warn: "⚠", bad: "✗", empty: "—" };

// ---------- Render ----------
function render() {
  $("todayDate").textContent = TODAY.toLocaleDateString("zh-TW", {
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  });

  // Training chips
  $$(".chip").forEach(c => c.classList.toggle("active", c.dataset.value === today.trainingType));

  // Training numbers
  $("duration").value = today.duration || "";
  $("srpe").value = today.srpe || "";

  // Macros
  $("protein").value = today.protein || "";
  $("fat").value = today.fat || "";
  $("carbs").value = today.carbs || "";

  $("proteinNow").textContent = today.protein || 0;
  $("fatNow").textContent = today.fat || 0;
  $("carbsNow").textContent = today.carbs || 0;
  $("proteinTargetLabel").textContent = settings.proteinTarget;

  const pPct = Math.min(120, ((today.protein || 0) / settings.proteinTarget) * 100);
  $("proteinFill").style.width = pPct + "%";

  // Ready sliders
  READY_KEYS.forEach((k, i) => {
    const idx = i + 1;
    $(`r${idx}`).value = today.ready[k];
    $(`r${idx}v`).textContent = today.ready[k];
  });

  // Body & notes
  $("weight").value = today.weight || "";
  $("notes").value = today.notes || "";

  // Derived
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

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[m]));
}

// ---------- Events ----------
function setupEvents() {
  // Training chips
  $$(".chip").forEach(c => {
    c.addEventListener("click", () => {
      today.trainingType = today.trainingType === c.dataset.value ? "" : c.dataset.value;
      persistToday();
      render();
    });
  });

  // Number inputs (duration, srpe, protein, fat, carbs)
  ["duration", "srpe", "protein", "fat", "carbs"].forEach(id => {
    $(id).addEventListener("input", e => {
      today[id] = parseFloat(e.target.value) || 0;
      persistToday();
      render();
    });
  });

  // Weight (allow empty string)
  $("weight").addEventListener("input", e => {
    today.weight = e.target.value === "" ? "" : parseFloat(e.target.value) || "";
    persistToday();
    render();
  });

  // Notes
  $("notes").addEventListener("input", e => {
    today.notes = e.target.value;
    persistToday();
  });

  // Steppers
  $$(".stepper button").forEach(b => {
    b.addEventListener("click", () => {
      const t = b.dataset.target;
      const delta = parseFloat(b.dataset.delta);
      const cur = today[t] || 0;
      today[t] = Math.max(0, Math.round((cur + delta) * 10) / 10);
      persistToday();
      render();
    });
  });

  // Ready sliders
  READY_KEYS.forEach((k, i) => {
    $(`r${i + 1}`).addEventListener("input", e => {
      today.ready[k] = parseInt(e.target.value, 10);
      persistToday();
      render();
    });
  });

  // Buttons
  $("saveBtn").addEventListener("click", () => {
    persistToday();
    render();
    toast("已儲存到本機 ✓", "success");
  });
  $("exportBtn").addEventListener("click", exportCSV);
  $("syncBtn").addEventListener("click", syncToSheet);
  $("settingsBtn").addEventListener("click", openSettings);
  $("closeSettings").addEventListener("click", closeSettings);
  $("saveSettings").addEventListener("click", saveSettings);
  $("clearAllBtn").addEventListener("click", clearAll);

  // Close modal on backdrop click
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
    // Apps Script Web App responds to POST with text/plain;
    // use no-cors to avoid CORS preflight issues.
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
  persistSettings();
  closeSettings();
  render();
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
  render();
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
render();
