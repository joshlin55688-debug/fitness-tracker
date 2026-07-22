/**
 * anatomy.js — 內嵌 SVG 肌肉使用圖 + 動作示意圖
 * 全部純 SVG，無外部圖檔，離線可用。
 * 對外：window.muscleSVG / window.movementSVG / window.muscleChips / window.MUSCLE_LABELS
 *
 * 肌群代碼：
 *   正面：chest 胸 / delts 肩 / biceps 二頭 / forearms 前臂 / abs 腹 / obliques 腹斜 / quads 股四頭
 *   背面：traps 斜方 / lats 闊背 / lowerback 下背 / triceps 三頭 / glutes 臀 / hamstrings 腿後 / calves 小腿
 *   （delts 與 forearms 前後圖都會亮）
 */
(function () {
  "use strict";

  const MUSCLE_LABELS = {
    chest: "胸大肌", delts: "三角肌", biceps: "二頭肌", triceps: "三頭肌",
    forearms: "前臂", abs: "腹肌", obliques: "腹斜肌", quads: "股四頭",
    hamstrings: "腿後肌", glutes: "臀大肌", calves: "小腿", traps: "斜方肌",
    lats: "闊背肌", lowerback: "豎脊肌",
  };

  // 依主要 / 輔助決定填色
  function colorFor(mg, P, S) {
    if (P.has(mg)) return "var(--mg-primary)";
    if (S.has(mg)) return "var(--mg-secondary)";
    return "var(--mg-idle)";
  }

  // ---------- 肌肉使用圖（正面 + 背面）----------
  // 解剖風：每塊肌肉為器官式路徑，主要=橘、輔助=半透明橘、其餘=暗色。
  function muscleSVG(primary, secondary) {
    const P = new Set(primary || []);
    const S = new Set(secondary || []);
    const c = (mg) => colorFor(mg, P, S);
    const BODY = "var(--mg-body)";
    const OUT = "var(--mg-outline)";
    const so = `stroke="${OUT}" stroke-width="0.7"`;
    // 肌肉內部紋理線（六塊肌分隔、肌腹分界）
    const dl = `stroke="rgba(0,0,0,0.28)" stroke-width="0.6" fill="none" stroke-linecap="round"`;

    // 正面（中心 x=50）
    const front = `
      <g>
        <ellipse cx="50" cy="13" rx="7" ry="8.5" fill="${BODY}" ${so}/>
        <path d="M45,20 L55,20 L54,27 L46,27 Z" fill="${BODY}" ${so}/>
        <path d="M23,32 C22,25 28,22 33,24 C38,26 40,33 37,40 C32,44 24,40 23,32 Z" fill="${c('delts')}" ${so}/>
        <path d="M77,32 C78,25 72,22 67,24 C62,26 60,33 63,40 C68,44 76,40 77,32 Z" fill="${c('delts')}" ${so}/>
        <path d="M49,30 C42,29 34,31 32,38 C31,44 37,49 45,47 C49,45 50,38 49,30 Z" fill="${c('chest')}" ${so}/>
        <path d="M51,30 C58,29 66,31 68,38 C69,44 63,49 55,47 C51,45 50,38 51,30 Z" fill="${c('chest')}" ${so}/>
        <path d="M28,41 C23,43 22,52 25,60 C28,64 32,63 33,57 C34,50 32,43 28,41 Z" fill="${c('biceps')}" ${so}/>
        <path d="M72,41 C77,43 78,52 75,60 C72,64 68,63 67,57 C66,50 68,43 72,41 Z" fill="${c('biceps')}" ${so}/>
        <path d="M25,61 C21,64 20,75 23,84 C25,88 30,87 30,80 C31,71 29,63 25,61 Z" fill="${c('forearms')}" ${so}/>
        <path d="M75,61 C79,64 80,75 77,84 C75,88 70,87 70,80 C69,71 71,63 75,61 Z" fill="${c('forearms')}" ${so}/>
        <circle cx="23" cy="88" r="3.5" fill="${BODY}" ${so}/>
        <circle cx="77" cy="88" r="3.5" fill="${BODY}" ${so}/>
        <path d="M43,49 C39,51 37,58 38,65 C39,69 43,70 44,65 C45,58 45,52 43,49 Z" fill="${c('obliques')}" ${so}/>
        <path d="M57,49 C61,51 63,58 62,65 C61,69 57,70 56,65 C55,58 55,52 57,49 Z" fill="${c('obliques')}" ${so}/>
        <path d="M44,48 C43,55 43,63 45,69 C47,72 53,72 55,69 C57,63 57,55 56,48 C52,47 48,47 44,48 Z" fill="${c('abs')}" ${so}/>
        <path d="M50,49 L50,70 M45,55 L55,55 M45,61 L55,61 M46,67 L54,67" ${dl}/>
        <path d="M40,70 C41,77 59,77 60,70 C61,79 57,85 50,85 C43,85 39,79 40,70 Z" fill="${BODY}" ${so}/>
        <path d="M43,84 C36,86 34,98 37,110 C39,117 43,119 45,114 C47,104 47,92 45,86 C44,84 43,84 43,84 Z" fill="${c('quads')}" ${so}/>
        <path d="M57,84 C64,86 66,98 63,110 C61,117 57,119 55,114 C53,104 53,92 55,86 C56,84 57,84 57,84 Z" fill="${c('quads')}" ${so}/>
        <path d="M42,92 C41,100 42,108 44,113 M58,92 C59,100 58,108 56,113" ${dl}/>
        <circle cx="43" cy="120" r="4" fill="${BODY}" ${so}/>
        <circle cx="57" cy="120" r="4" fill="${BODY}" ${so}/>
        <path d="M40,122 C38,126 38,136 40,142 C42,144 44,143 44,138 C45,131 43,125 40,122 Z" fill="${BODY}" ${so}/>
        <path d="M60,122 C62,126 62,136 60,142 C58,144 56,143 56,138 C55,131 57,125 60,122 Z" fill="${BODY}" ${so}/>
        <text x="50" y="159" text-anchor="middle" class="mm-cap">正面</text>
      </g>`;

    // 背面（中心 x=150）
    const back = `
      <g transform="translate(100,0)">
        <ellipse cx="50" cy="13" rx="7" ry="8.5" fill="${BODY}" ${so}/>
        <path d="M45,20 L55,20 L54,27 L46,27 Z" fill="${BODY}" ${so}/>
        <path d="M50,19 L40,25 C37,31 39,43 47,49 L50,47 L53,49 C61,43 63,31 60,25 Z" fill="${c('traps')}" ${so}/>
        <path d="M50,21 L50,47 M42,27 L49,33 M58,27 L51,33" ${dl}/>
        <path d="M23,32 C22,25 28,22 33,24 C38,26 40,33 37,40 C32,44 24,40 23,32 Z" fill="${c('delts')}" ${so}/>
        <path d="M77,32 C78,25 72,22 67,24 C62,26 60,33 63,40 C68,44 76,40 77,32 Z" fill="${c('delts')}" ${so}/>
        <path d="M40,43 C33,45 30,54 33,63 C36,69 44,69 47,63 C48,56 46,48 43,44 C42,43 41,43 40,43 Z" fill="${c('lats')}" ${so}/>
        <path d="M60,43 C67,45 70,54 67,63 C64,69 56,69 53,63 C52,56 54,48 57,44 C58,43 59,43 60,43 Z" fill="${c('lats')}" ${so}/>
        <path d="M28,41 C23,43 22,52 25,61 C28,64 32,63 33,57 C34,50 32,43 28,41 Z" fill="${c('triceps')}" ${so}/>
        <path d="M72,41 C77,43 78,52 75,61 C72,64 68,63 67,57 C66,50 68,43 72,41 Z" fill="${c('triceps')}" ${so}/>
        <path d="M25,61 C21,64 20,75 23,84 C25,88 30,87 30,80 C31,71 29,63 25,61 Z" fill="${c('forearms')}" ${so}/>
        <path d="M75,61 C79,64 80,75 77,84 C75,88 70,87 70,80 C69,71 71,63 75,61 Z" fill="${c('forearms')}" ${so}/>
        <circle cx="23" cy="88" r="3.5" fill="${BODY}" ${so}/>
        <circle cx="77" cy="88" r="3.5" fill="${BODY}" ${so}/>
        <path d="M45,56 C44,62 44,68 46,72 C48,74 52,74 54,72 C56,68 56,62 55,56 C52,55 48,55 45,56 Z" fill="${c('lowerback')}" ${so}/>
        <path d="M50,57 L50,72" ${dl}/>
        <path d="M42,72 C36,72 34,80 37,86 C40,90 46,90 48,85 C49,79 47,73 42,72 Z" fill="${c('glutes')}" ${so}/>
        <path d="M58,72 C64,72 66,80 63,86 C60,90 54,90 52,85 C51,79 53,73 58,72 Z" fill="${c('glutes')}" ${so}/>
        <path d="M43,88 C37,90 35,100 38,112 C40,118 44,119 46,114 C47,104 47,93 45,88 Z" fill="${c('hamstrings')}" ${so}/>
        <path d="M57,88 C63,90 65,100 62,112 C60,118 56,119 54,114 C53,104 53,93 55,88 Z" fill="${c('hamstrings')}" ${so}/>
        <circle cx="43" cy="120" r="4" fill="${BODY}" ${so}/>
        <circle cx="57" cy="120" r="4" fill="${BODY}" ${so}/>
        <path d="M40,122 C36,125 35,133 38,139 C41,142 44,141 44,135 C45,128 43,123 40,122 Z" fill="${c('calves')}" ${so}/>
        <path d="M60,122 C64,125 65,133 62,139 C59,142 56,141 56,135 C55,128 57,123 60,122 Z" fill="${c('calves')}" ${so}/>
        <text x="50" y="159" text-anchor="middle" class="mm-cap">背面</text>
      </g>`;

    return `<svg viewBox="0 0 200 166" class="muscle-map-svg" role="img" aria-label="使用肌群示意圖" preserveAspectRatio="xMidYMid meet">${front}${back}</svg>`;
  }

  // ---------- 肌群標籤 chips ----------
  function muscleChips(primary, secondary) {
    const chip = (mg, cls) =>
      `<span class="mg-chip ${cls}">${MUSCLE_LABELS[mg] || mg}</span>`;
    const p = (primary || []).map((mg) => chip(mg, "mg-chip-primary")).join("");
    const s = (secondary || []).map((mg) => chip(mg, "mg-chip-secondary")).join("");
    return p + s;
  }

  // ---------- 動作示意圖（側視火柴人）----------
  // 每個 pattern：a=起始姿勢, b=結束姿勢；關節 head/sh/el/ha/hip/kn/an
  // arrow：可選的方向箭頭 [x1,y1,x2,y2]
  const MOVE = {
    squat: {
      a: { head:[50,15], sh:[50,30], el:[46,44], ha:[45,56], hip:[50,52], kn:[49,72], an:[49,92] },
      b: { head:[42,26], sh:[44,40], el:[41,53], ha:[52,55], hip:[46,58], kn:[59,71], an:[50,92] },
      arrow: [70,42,70,66],
    },
    hinge: {
      a: { head:[40,30], sh:[43,40], el:[43,52], ha:[43,64], hip:[55,50], kn:[53,70], an:[50,92] },
      b: { head:[50,15], sh:[50,30], el:[48,44], ha:[47,56], hip:[50,52], kn:[49,72], an:[49,92] },
      arrow: [72,60,72,36],
    },
    horizontalPush: {
      a: { head:[50,15], sh:[50,31], el:[41,35], ha:[35,38], hip:[50,54], kn:[49,74], an:[49,92] },
      b: { head:[50,15], sh:[50,31], el:[42,31], ha:[28,31], hip:[50,54], kn:[49,74], an:[49,92] },
      arrow: [40,20,22,20],
    },
    verticalPush: {
      a: { head:[50,17], sh:[50,31], el:[43,37], ha:[41,29], hip:[50,54], kn:[49,74], an:[49,92] },
      b: { head:[50,19], sh:[50,31], el:[50,20], ha:[50,7],  hip:[50,54], kn:[49,74], an:[49,92] },
      arrow: [66,30,66,12],
    },
    horizontalPull: {
      a: { head:[38,32], sh:[43,41], el:[41,53], ha:[40,63], hip:[55,52], kn:[53,71], an:[50,92] },
      b: { head:[38,32], sh:[43,41], el:[52,45], ha:[58,48], hip:[55,52], kn:[53,71], an:[50,92] },
      arrow: [44,64,60,52],
    },
    verticalPull: {
      a: { head:[50,20], sh:[50,32], el:[46,22], ha:[44,10], hip:[50,54], kn:[49,74], an:[49,92] },
      b: { head:[50,18], sh:[50,32], el:[43,40], ha:[46,32], hip:[50,54], kn:[49,74], an:[49,92] },
      arrow: [66,14,66,34],
    },
    lunge: {
      a: { head:[50,15], sh:[50,30], el:[48,43], ha:[47,54], hip:[50,52], kn:[49,72], an:[49,92] },
      b: { head:[48,20], sh:[48,34], el:[46,47], ha:[45,57], hip:[48,56], kn:[64,74], an:[64,90] },
      arrow: [72,48,72,66],
    },
    hipThrust: {
      a: { head:[30,50], sh:[36,52], el:[34,60], ha:[33,66], hip:[58,66], kn:[72,64], an:[80,80] },
      b: { head:[30,48], sh:[36,50], el:[34,58], ha:[33,64], hip:[58,50], kn:[72,52], an:[80,74] },
      arrow: [58,66,58,50],
    },
    legCurl: {
      a: { head:[22,50], sh:[30,52], el:[30,60], ha:[30,66], hip:[50,54], kn:[64,56], an:[82,56] },
      b: { head:[22,50], sh:[30,52], el:[30,60], ha:[30,66], hip:[50,54], kn:[64,56], an:[60,42] },
      arrow: [80,50,64,42],
    },
    core: {
      a: { head:[28,52], sh:[36,54], el:[34,64], ha:[42,64], hip:[60,54], kn:[74,58], an:[84,60] },
      b: { head:[28,50], sh:[36,52], el:[34,64], ha:[42,64], hip:[60,52], kn:[74,56], an:[84,58] },
      arrow: null,
    },
    armIso: {
      a: { head:[50,15], sh:[50,31], el:[48,45], ha:[47,58], hip:[50,54], kn:[49,74], an:[49,92] },
      b: { head:[50,15], sh:[50,31], el:[48,45], ha:[42,34], hip:[50,54], kn:[49,74], an:[49,92] },
      arrow: [62,52,60,36],
    },
    cardio: {
      a: { head:[46,16], sh:[47,30], el:[40,36], ha:[35,32], hip:[49,50], kn:[40,68], an:[34,86] },
      b: { head:[52,16], sh:[51,30], el:[58,36], ha:[63,40], hip:[51,50], kn:[62,66], an:[70,84] },
      arrow: null,
    },
  };

  const MOVE_LABELS = {
    squat: "蹲", hinge: "髖鉸鏈", horizontalPush: "水平推", verticalPush: "垂直推",
    horizontalPull: "水平拉", verticalPull: "垂直拉", lunge: "弓步", hipThrust: "髖推",
    legCurl: "腿彎舉", core: "核心抗動", armIso: "屈伸", cardio: "心肺",
  };

  function stick(J, stroke, w, headFill) {
    const L = (a, b) => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`;
    return `<g stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none">
      ${L(J.sh, J.hip)}${L(J.sh, J.el)}${L(J.el, J.ha)}${L(J.hip, J.kn)}${L(J.kn, J.an)}
      <circle cx="${J.head[0]}" cy="${J.head[1]}" r="6.5" fill="${headFill}" stroke="${stroke}" stroke-width="${w}"/>
    </g>`;
  }

  function movementSVG(pattern) {
    const p = MOVE[pattern];
    if (!p) return "";
    let arrow = "";
    if (p.arrow) {
      const [x1, y1, x2, y2] = p.arrow;
      arrow = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--accent-2)" stroke-width="2" stroke-linecap="round" marker-end="url(#mvArrow)" opacity="0.9"/>`;
    }
    const label = MOVE_LABELS[pattern] || "";
    return `<svg viewBox="0 0 100 100" class="movement-svg" role="img" aria-label="動作示意圖：${label}" preserveAspectRatio="xMidYMid meet">
      <defs>
        <marker id="mvArrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--accent-2)"/>
        </marker>
      </defs>
      ${stick(p.a, "var(--mg-ghost)", 3, "none")}
      ${arrow}
      ${stick(p.b, "var(--accent)", 4.5, "var(--accent)")}
      <text x="50" y="98" text-anchor="middle" class="mm-cap">${label}</text>
    </svg>`;
  }

  window.MUSCLE_LABELS = MUSCLE_LABELS;
  window.muscleSVG = muscleSVG;
  window.muscleChips = muscleChips;
  window.movementSVG = movementSVG;
})();
