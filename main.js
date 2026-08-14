import {
  CubeEngine,
  matchesGoal,
  simplifyMoves,
  analyzeSolution,
} from "./src/index.js";

const cube = new CubeEngine();
window.CubeEngine = cube; // handy for poking at it in the console

const $ = (sel) => document.querySelector(sel);

const player = $("twisty-player");
const netEl = $("#net");
const lampsEl = $("#lamps");
const keysEl = $("#keys");
const historyEl = $("#history");
const solvedEl = $("#is-solved");
const countEl = $("#move-count");
const simplifiedEl = $("#simplified-count");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* --------------------------------------------------------------------------
   Keyboard map. Printed on the page rather than hidden in a code sample.
   -------------------------------------------------------------------------- */

const KEYMAP = {
  j: "U",  f: "U'",
  s: "D",  l: "D'",
  i: "R",  k: "R'",
  d: "L",  e: "L'",
  h: "F",  g: "F'",
  p: "B",  o: "B'",
  m: "M",  n: "M'",
  t: "x",  b: "x'",
  ";": "y", a: "y'",
  v: "z",  c: "z'",
};

/* --------------------------------------------------------------------------
   Flat net. Built once, then only sticker colors change.
   -------------------------------------------------------------------------- */

const FACES = ["UPPER", "LEFT", "FRONT", "RIGHT", "BACK", "DOWN"];
const FACE_LABELS = {
  UPPER: "Upper", LEFT: "Left", FRONT: "Front",
  RIGHT: "Right", BACK: "Back", DOWN: "Down",
};
const stickerEls = {};

function buildNet(size) {
  netEl.textContent = "";
  for (const face of FACES) {
    const faceEl = document.createElement("div");
    faceEl.className = "face";
    faceEl.dataset.face = face;
    faceEl.style.setProperty("--n", size);
    faceEl.setAttribute("role", "group");
    faceEl.setAttribute("aria-label", `${FACE_LABELS[face]} face`);

    stickerEls[face] = [];
    for (let i = 0; i < size * size; i++) {
      const s = document.createElement("span");
      s.className = "sticker";
      s.setAttribute("aria-hidden", "true");
      faceEl.appendChild(s);
      stickerEls[face].push(s);
    }
    netEl.appendChild(faceEl);
  }
  $("#net-size").textContent = `${size} x ${size}`;
}

function paintNet(state) {
  for (const face of FACES) {
    const flat = state[face].flat();
    const els = stickerEls[face];
    for (let i = 0; i < flat.length; i++) {
      if (els[i].dataset.c !== flat[i]) {
        els[i].dataset.c = flat[i];
        els[i].textContent = flat[i];
      }
    }
  }
}

/* --------------------------------------------------------------------------
   Predicate lamps.
   -------------------------------------------------------------------------- */

const LAMPS = [
  { goal: "cross",  name: "Cross",       api: "isCrossComplete()" },
  { goal: "f2l",    name: "F2L",         api: "isF2LComplete()" },
  { goal: "oll",    name: "OLL",         api: "isLastLayerOriented()" },
  { goal: "oll+cp", name: "OLL + CP",    api: "areLastLayerCornersSolved()" },
  { goal: "full",   name: "Solved",      api: "isCubeSolved()" },
];

function buildLamps() {
  lampsEl.textContent = "";
  for (const lamp of LAMPS) {
    const li = document.createElement("li");
    li.className = "lamp";
    li.dataset.goal = lamp.goal;
    li.dataset.on = "false";
    li.innerHTML =
      `<span class="lamp__dot"></span>` +
      `<span class="lamp__name">${lamp.name}</span>` +
      `<code class="lamp__api">${lamp.api}</code>`;
    lampsEl.appendChild(li);
  }
}

function paintLamps() {
  for (const lamp of LAMPS) {
    const on = matchesGoal(cube, lamp.goal);
    lampsEl.querySelector(`[data-goal="${lamp.goal}"]`).dataset.on = String(on);
  }
}

/* --------------------------------------------------------------------------
   Keyboard legend.
   -------------------------------------------------------------------------- */

function buildKeys() {
  keysEl.textContent = "";
  for (const [key, move] of Object.entries(KEYMAP)) {
    const el = document.createElement("div");
    el.className = "keycap";
    el.dataset.key = key;
    el.innerHTML =
      `<kbd>${key === ";" ? ";" : key.toUpperCase()}</kbd><span>${move}</span>`;
    keysEl.appendChild(el);
  }
}

function flashKey(key) {
  const el = keysEl.querySelector(`[data-key="${CSS.escape(key)}"]`);
  if (!el) return;
  el.dataset.hit = "true";
  setTimeout(() => delete el.dataset.hit, 180);
}

/* --------------------------------------------------------------------------
   The 3D view. Incremental when the player supports it, so long histories
   don't replay from scratch on every turn.
   -------------------------------------------------------------------------- */

function pushToPlayer(move) {
  if (typeof player?.experimentalAddMove === "function") {
    try {
      player.experimentalAddMove(move);
      return;
    } catch {
      /* fall through to a full resync */
    }
  }
  resyncPlayer();
}

function resyncPlayer() {
  if (player) player.alg = cube.getMoves();
}

/* --------------------------------------------------------------------------
   Render pass.
   -------------------------------------------------------------------------- */

function render() {
  const moves = cube.getMoves(false);
  paintNet(cube.state());
  paintLamps();

  const solved = cube.isSolved();
  solvedEl.textContent = String(solved);
  solvedEl.dataset.state = String(solved);
  countEl.textContent = moves.length;
  simplifiedEl.textContent = simplifyMoves(moves).length;
  historyEl.textContent = simplifyMoves(moves).join(" ");
  historyEl.scrollTop = historyEl.scrollHeight;
}

function doMove(move) {
  cube.applyMoves(move, { record: true });
  pushToPlayer(move);
  render();
}

/* --------------------------------------------------------------------------
   Controls.
   -------------------------------------------------------------------------- */

const SCRAMBLE_FACES = ["U", "D", "L", "R", "F", "B"];
const SUFFIX = ["", "'", "2"];

function randomScramble(length = 20) {
  const out = [];
  let last = "";
  let beforeLast = "";
  while (out.length < length) {
    const face = SCRAMBLE_FACES[Math.floor(Math.random() * 6)];
    // No repeats, and no A B A on the same axis.
    if (face === last) continue;
    if (face === beforeLast && isSameAxis(face, last)) continue;
    out.push(face + SUFFIX[Math.floor(Math.random() * 3)]);
    beforeLast = last;
    last = face;
  }
  return out.join(" ");
}

function isSameAxis(a, b) {
  const axis = { U: 0, D: 0, L: 1, R: 1, F: 2, B: 2 };
  return axis[a] === axis[b];
}

$("#scramble-btn").addEventListener("click", () => {
  cube.reset();
  cube.applyMoves(randomScramble(), { record: true });
  resyncPlayer();
  render();
});

$("#reset-btn").addEventListener("click", () => {
  cube.reset();
  resyncPlayer();
  render();
});

let autoTimer = null;
const autoBtn = $("#auto-btn");

autoBtn.addEventListener("click", () => {
  if (autoTimer) {
    clearInterval(autoTimer);
    autoTimer = null;
    autoBtn.setAttribute("aria-pressed", "false");
    return;
  }
  autoBtn.setAttribute("aria-pressed", "true");
  autoTimer = setInterval(() => {
    const keys = Object.keys(KEYMAP);
    const key = keys[Math.floor(Math.random() * keys.length)];
    flashKey(key);
    doMove(KEYMAP[key]);
  }, 700);
});

document.addEventListener("keyup", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  // Let buttons keep their own space/enter behaviour.
  if (e.target instanceof HTMLButtonElement) return;

  const move = KEYMAP[e.key.toLowerCase()];
  if (!move) return;
  flashKey(e.key.toLowerCase());
  doMove(move);
});

/* Copy button ------------------------------------------------------------- */

const copyBtn = $("#copy-btn");
copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText($("#install-cmd").textContent.trim());
    copyBtn.textContent = "Copied";
    copyBtn.dataset.done = "true";
    setTimeout(() => {
      copyBtn.textContent = "Copy";
      delete copyBtn.dataset.done;
    }, 1600);
  } catch {
    copyBtn.textContent = "Press Ctrl+C";
    setTimeout(() => (copyBtn.textContent = "Copy"), 1600);
  }
});

/* --------------------------------------------------------------------------
   Solve analysis. Runs a real recorded solve from the test fixtures.
   -------------------------------------------------------------------------- */

const fmt = (ms) => `${(ms / 1000).toFixed(2)}s`;

function stagesFrom(result) {
  const stages = [];
  if (result.cross) {
    stages.push({ name: `Cross (${result.cross.color})`, stage: "cross", ...result.cross });
  }
  for (const pair of result.f2l) {
    stages.push({ name: `F2L ${pair.slot}`, stage: "f2l", ...pair });
  }
  if (result.oll) stages.push({ name: "OLL", stage: "oll", ...result.oll });
  if (result.pll) stages.push({ name: "PLL", stage: "pll", ...result.pll });

  // Roux solves report a different set of milestones.
  if (!stages.length) {
    const roux = [
      ["First block", "cross", result.firstBlock],
      ["Second block", "f2l", result.secondBlock],
      ["CMLL", "oll", result.cmll],
      ["LSE", "pll", result.lse],
    ];
    for (const [name, stage, rec] of roux) {
      if (rec) stages.push({ name, stage, ...rec });
    }
  }
  return stages;
}

function renderAnalysis(result, sourceLabel) {
  const host = $("#analysis");
  const stages = stagesFrom(result);
  $("#analysis-method").textContent = result.method;
  $("#analysis-src").textContent = sourceLabel;

  if (!stages.length) {
    host.innerHTML = `<p class="prose">No stage breakdown available for this solve.</p>`;
    return;
  }

  const span = stages.reduce((a, s) => a + s.duration, 0) || 1;

  const track = stages
    .map(
      (s) =>
        `<div class="tl__seg" data-stage="${s.stage}" style="flex:${s.duration} 1 0" title="${s.name} — ${fmt(s.duration)}"></div>`
    )
    .join("");

  const legend = stages
    .map(
      (s) =>
        `<div class="leg" data-stage="${s.stage}">` +
        `<span class="leg__swatch"></span>` +
        `<span class="leg__name">${s.name}</span>` +
        `<span class="leg__time">${fmt(s.duration)}</span>` +
        `</div>`
    )
    .join("");

  host.innerHTML =
    `<div class="tl">` +
    `<div class="tl__track">${track}</div>` +
    `<div class="tl__legend">${legend}</div>` +
    `</div>` +
    `<p class="summary">` +
    `<span>Method <b>${result.method}</b></span>` +
    `<span>Total <b>${fmt(result.total)}</b></span>` +
    `<span>Moves <b>${result.moves.length}</b></span>` +
    `<span>TPS <b>${result.tps.toFixed(2)}</b></span>` +
    `<span>Solved <b>${result.solved}</b></span>` +
    `</p>`;

  void span;
}

async function loadAnalysis() {
  const sources = ["./test/cfop-1.json", "./test/roux-1.json"];
  for (const src of sources) {
    try {
      const res = await fetch(src);
      if (!res.ok) continue;
      const data = await res.json();
      const moves = data?.replay?.moves;
      if (!Array.isArray(moves) || !moves.length) continue;
      renderAnalysis(analyzeSolution(moves), src.replace("./", ""));
      return;
    } catch {
      /* try the next source */
    }
  }
  $("#analysis-method").textContent = "unavailable";
  $("#analysis").innerHTML =
    `<p class="prose">Serve this page over HTTP to load the recorded solve fixtures.</p>`;
}

/* --------------------------------------------------------------------------
   Boot.
   -------------------------------------------------------------------------- */

buildNet(cube.size);
buildLamps();
buildKeys();
render();

if (player) {
  player.alg = "";
  if (reduceMotion) player.tempoScale = 8;
}

loadAnalysis();
