import {
  CubeEngine,
  analyzeSolution,
  centersOf,
  flattenState,
  getCubeGeometry,
  invertSequence,
  matchesGoal,
  simplifyMoves,
} from "./dist/index.mjs";

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

const COLOR_NAMES = {
  W: "white", Y: "yellow", G: "green", B: "blue", R: "red", O: "orange",
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

   While a solve replays, the checks are pinned to THAT solve's cross color, so
   they stay right through the x/y/z rotations a real speedsolve contains. With
   nothing pinned they fall back to the library defaults: the color currently on
   the DOWN center, and 'U' for the last layer.
   -------------------------------------------------------------------------- */

const LAMPS = [
  { goal: "cross",  name: "Cross",       api: "isCrossComplete()" },
  { goal: "f2l",    name: "F2L",         api: "isF2LComplete()" },
  { goal: "oll",    name: "OLL",         api: "isLastLayerOriented()" },
  { goal: "oll+cp", name: "OLL + CP",    api: "areLastLayerCornersSolved()" },
  { goal: "full",   name: "Solved",      api: "isCubeSolved()" },
];

const lampEls = new Map();
let crossColor = null;

function buildLamps() {
  lampsEl.textContent = "";
  lampEls.clear();
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
    lampEls.set(lamp.goal, li);
  }
}

/** The face opposite the pinned cross, whichever way the cube is turned. */
function lastLayerFace(flat, geo) {
  if (!crossColor) return "U";
  const idx = centersOf(flat, geo).indexOf(crossColor);
  return idx < 0 ? "U" : geo.opposite[idx];
}

function lampSpec(goal, face) {
  if (!crossColor) return goal;
  switch (goal) {
    case "cross":  return { goal, color: crossColor };
    case "f2l":    return { goal, cross: crossColor };
    case "oll":
    case "oll+cp": return { goal, face };
    default:       return goal;
  }
}

function paintLamps() {
  // One flatten, five checks: the predicates take a flat array directly.
  const flat = flattenState(cube.state());
  const geo = getCubeGeometry(cube.size);
  const face = lastLayerFace(flat, geo);
  for (const lamp of LAMPS) {
    lampEls.get(lamp.goal).dataset.on = String(
      matchesGoal(flat, lampSpec(lamp.goal, face))
    );
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

   `playerBase` holds moves the engine applied without recording them -- the
   replay scramble -- so the 3D view can show a scrambled cube while the move
   counter still reads zero at the start of the solve.
   -------------------------------------------------------------------------- */

let playerBase = "";

function playerAlg() {
  const recorded = cube.getMoves();
  if (!playerBase) return recorded;
  return recorded ? `${playerBase} ${recorded}` : playerBase;
}

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

/**
 * Rebuild the player from the full history.
 * @param {boolean} jump - Skip the animation and land on the final state.
 *   Used for scrambles, where playing 20 moves back is noise, not feedback.
 */
function resyncPlayer(jump = false) {
  if (!player) return;
  player.alg = playerAlg();
  if (!jump) return;
  try {
    player.timestamp = Infinity;
  } catch {
    /* older builds animate instead; harmless */
  }
}

/* --------------------------------------------------------------------------
   Render pass.
   -------------------------------------------------------------------------- */

function render() {
  const moves = cube.getMoves(false);
  const simplified = simplifyMoves(moves);
  paintNet(cube.state());
  paintLamps();

  const solved = cube.isSolved();
  solvedEl.textContent = String(solved);
  solvedEl.dataset.state = String(solved);
  countEl.textContent = moves.length;
  simplifiedEl.textContent = simplified.length;
  historyEl.textContent = simplified.join(" ");
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
  takeOver();
  cube.reset();
  cube.applyMoves(randomScramble(), { record: true });
  resyncPlayer(true);
  render();
});

$("#reset-btn").addEventListener("click", () => {
  takeOver();
  cube.reset();
  resyncPlayer();
  render();
});

// A manual turn means the visitor took over; stop replaying under their hands.
document.addEventListener("keydown", (e) => {
  if (KEYMAP[e.key.toLowerCase()]) takeOver();
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
   Solve analysis. Runs real recorded solves from the test fixtures.
   -------------------------------------------------------------------------- */

const fmt = (ms) => `${(ms / 1000).toFixed(2)}s`;

// The timeline has four tones. Each method's milestones map onto them in the
// order they happen: build, build, last layer, finish.
const STAGE_TONE = {
  cross: "cross",
  f2l: "f2l",
  oll: "oll",
  pll: "pll",
  firstBlock: "cross",
  secondBlock: "f2l",
  cmll: "oll",
  lse: "pll",
};

function stagesFrom(result) {
  // `stages` is already the breakdown of whichever method was detected, so the
  // page never branches on CFOP vs Roux.
  let pair = 0;
  return result.stages.map((s) => {
    const face = s.meta.color ?? s.meta.side;
    const label = COLOR_NAMES[face] ?? face;
    const name = label ? `${s.label} (${label})` : s.label;
    return {
      ...s,
      name,
      // The checklist wants an even column of labels it can be scanned in one
      // pass, so the four pairs are numbered there. Which pair each one was
      // stays on the hover title, and in the analyzer legend further down.
      short: s.key === "f2l" ? `F2L ${++pair}` : name,
      stage: STAGE_TONE[s.key] ?? "f2l",
    };
  });
}

function renderAnalysis(solve) {
  const host = $("#analysis");
  const { analysis: result, stages } = solve;
  $("#analysis-method").textContent = result.method;
  $("#analysis-src").textContent = solve.src;

  if (!stages.length) {
    host.innerHTML = `<p class="prose">No stage breakdown available for this solve.</p>`;
    return;
  }

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
    `<span>Moves <b>${result.turnCount}</b></span>` +
    `<span>TPS <b>${result.tps.toFixed(2)}</b></span>` +
    `<span>Solved <b>${result.solved}</b></span>` +
    `</p>`;
}

/* --------------------------------------------------------------------------
   Solve replay.

   The cube doesn't shuffle at random any more: it replays recorded solves at
   the speed they were actually turned, and the checklist ticks over as the
   engine reports each stage finished. Nothing here knows how to solve a cube --
   the moves are a human's, and the milestones come from analyzeSolution().
   -------------------------------------------------------------------------- */

const SOLVE_SOURCES = [
  "./test/cfop-1.json",
  "./test/cfop-2.json",
  "./test/roux-1.json",
];

const HOLD_SCRAMBLED = 1000; // a beat on the scrambled cube before the solve
const HOLD_SOLVED = 2600;    // a beat on the finished checklist before the next
const SPEEDS = [1, 2, 4];

const replayEl = $("#replay");
const trackEl = $("#replay-track");
const headEl = $("#replay-head");
const stepsEl = $("#steps");
const srcEl = $("#replay-src");
const methodEl = $("#replay-method");
const playBtn = $("#play-btn");
const speedBtn = $("#speed-btn");

const replay = {
  solves: [],
  index: 0,
  solve: null,
  move: 0,       // next move to play
  clock: 0,      // ms elapsed inside the current phase
  phase: "idle", // idle | scrambled | solving | solved
  frame: 0,
  last: 0,
  wantsPlay: false, // what the visitor asked for
  onScreen: true,   // the rig is in the viewport
  speed: 1,
  stepEls: [],
  segEls: [],
};

async function loadSolve(src) {
  const res = await fetch(src);
  if (!res.ok) throw new Error(`${src}: ${res.status}`);
  const data = await res.json();
  const moves = data?.replay?.moves;
  if (!Array.isArray(moves) || !moves.length) throw new Error(`${src}: no moves`);

  const analysis = analyzeSolution(moves);
  return {
    src: src.replace("./", ""),
    moves,
    analysis,
    stages: stagesFrom(analysis),
    // The scramble is the inverse of the solution, so the file's own scramble
    // field never has to be trusted.
    scramble: invertSequence(moves.map((x) => x.m)).join(" "),
    // Only CFOP has a cross to pin the checks to; a Roux solve leaves the
    // predicates on their defaults.
    crossColor:
      analysis.method === "CFOP" ? analysis.startFace?.color ?? null : null,
    total: analysis.total || moves[moves.length - 1].t || 1,
  };
}

function buildReplayUI(solve) {
  trackEl.querySelectorAll(".replay__seg").forEach((el) => el.remove());
  stepsEl.textContent = "";
  replay.stepEls = [];
  replay.segEls = [];

  for (const stage of solve.stages) {
    const seg = document.createElement("div");
    seg.className = "replay__seg";
    seg.dataset.stage = stage.stage;
    seg.dataset.done = "false";
    seg.style.flex = `${stage.duration} 1 0`;
    seg.title = `${stage.name} — ${fmt(stage.duration)}`;
    trackEl.insertBefore(seg, headEl);
    replay.segEls.push(seg);

    const li = document.createElement("li");
    li.className = "step";
    li.dataset.stage = stage.stage;
    li.dataset.state = "pending";
    li.title = `${stage.name} — ${fmt(stage.duration)}`;
    li.innerHTML =
      `<span class="step__mark" aria-hidden="true"></span>` +
      `<span class="step__name">${stage.short}</span>` +
      `<span class="step__time">--</span>`;
    stepsEl.appendChild(li);
    replay.stepEls.push(li);
  }

  // Moves after the last milestone (a solve that keeps turning past solved)
  // still belong on the track, or the playhead would run past the segments.
  const staged = solve.stages.reduce((a, s) => a + s.duration, 0);
  const tail = solve.total - staged;
  if (tail > 0) {
    const seg = document.createElement("div");
    seg.className = "replay__seg";
    seg.style.flex = `${tail} 1 0`;
    trackEl.insertBefore(seg, headEl);
  }

  setActiveStep(0);
}

function setActiveStep(i) {
  const li = replay.stepEls[i];
  if (li && li.dataset.state === "pending") li.dataset.state = "active";
}

function completeStep(i, stage) {
  const li = replay.stepEls[i];
  if (!li) return;
  li.dataset.state = "done";
  li.querySelector(".step__time").textContent = fmt(stage.at);
  if (replay.segEls[i]) replay.segEls[i].dataset.done = "true";
  setActiveStep(i + 1);
}

function paintHead(ratio) {
  headEl.style.insetInlineStart = `${Math.min(1, Math.max(0, ratio)) * 100}%`;
}

function setPhase(phase) {
  replay.phase = phase;
  replayEl.dataset.phase = phase;
}

function startSolve(solve) {
  replay.solve = solve;
  replay.move = 0;
  replay.clock = 0;
  setPhase("scrambled");

  crossColor = solve.crossColor;
  cube.reset();
  cube.applyMoves(solve.scramble, { record: false });
  playerBase = solve.scramble;
  resyncPlayer(true);

  srcEl.textContent = solve.src;
  methodEl.textContent = solve.analysis.method;
  buildReplayUI(solve);
  paintHead(0);
  renderAnalysis(solve);
  render();
}

function stepMove() {
  const i = replay.move++;
  const { moves, stages } = replay.solve;
  cube.applyMoves(moves[i].m, { record: true });
  pushToPlayer(moves[i].m);
  for (let k = 0; k < stages.length; k++) {
    if (stages[k].moveIndex === i) completeStep(k, stages[k]);
  }
  render();
}

function nextSolve() {
  replay.index = (replay.index + 1) % replay.solves.length;
  startSolve(replay.solves[replay.index]);
}

function tick(now) {
  replay.frame = requestAnimationFrame(tick);
  // A backgrounded tab or a long paint shouldn't fast-forward the solve.
  const dt = Math.min(now - replay.last, 250) * replay.speed;
  replay.last = now;
  replay.clock += dt;

  if (replay.phase === "scrambled") {
    if (replay.clock >= HOLD_SCRAMBLED) {
      replay.clock = 0;
      setPhase("solving");
    }
    return;
  }

  if (replay.phase === "solved") {
    if (replay.clock >= HOLD_SOLVED) nextSolve();
    return;
  }

  if (replay.phase !== "solving") return;

  const { moves, total } = replay.solve;
  while (replay.move < moves.length && moves[replay.move].t <= replay.clock) {
    stepMove();
  }
  paintHead(replay.clock / total);

  if (replay.move >= moves.length) {
    paintHead(1);
    replay.clock = 0;
    setPhase("solved");
  }
}

/** Starts or stops the frame loop to match what the visitor asked for. */
function updateRunning() {
  const shouldRun =
    replay.wantsPlay &&
    replay.onScreen &&
    !document.hidden &&
    replay.solves.length > 0;

  playBtn.setAttribute("aria-pressed", String(replay.wantsPlay));
  playBtn.textContent = replay.wantsPlay ? "Pause" : "Play solve";

  if (shouldRun && !replay.frame) {
    replay.last = performance.now();
    replay.frame = requestAnimationFrame(tick);
  } else if (!shouldRun && replay.frame) {
    cancelAnimationFrame(replay.frame);
    replay.frame = 0;
  }
}

function setTempo() {
  // The 3D view animates each move; at replay speed it has to hurry to keep up
  // with the net, which repaints instantly.
  if (player && !reduceMotion) player.tempoScale = 2 * replay.speed;
}

function playReplay() {
  if (!replay.solves.length) return;
  replay.wantsPlay = true;
  // Nothing to resume: either this is the first play, or the visitor took the
  // cube over and what's on screen is no longer this solve.
  if (replay.phase === "idle") startSolve(replay.solves[replay.index]);
  setTempo();
  updateRunning();
}

function pauseReplay() {
  replay.wantsPlay = false;
  updateRunning();
}

/** The visitor is driving now: stop the replay and unpin the checks. */
function takeOver() {
  replay.wantsPlay = false;
  setPhase("idle");
  crossColor = null;
  playerBase = "";
  if (player && !reduceMotion) player.tempoScale = 1;
  updateRunning();
}

playBtn.addEventListener("click", () => {
  if (replay.wantsPlay) pauseReplay();
  else playReplay();
});

speedBtn.addEventListener("click", () => {
  replay.speed = SPEEDS[(SPEEDS.indexOf(replay.speed) + 1) % SPEEDS.length];
  speedBtn.textContent = `${replay.speed}x`;
  if (replay.wantsPlay) setTempo();
});

// Don't animate a cube nobody is looking at.
document.addEventListener("visibilitychange", updateRunning);

if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    ([entry]) => {
      replay.onScreen = entry.isIntersecting;
      updateRunning();
    },
    { threshold: 0.05 }
  );
  io.observe($(".rig"));
}

async function bootReplay() {
  const loaded = [];
  for (const src of SOLVE_SOURCES) {
    try {
      loaded.push(await loadSolve(src));
    } catch {
      /* skip a fixture we can't read */
    }
  }
  replay.solves = loaded;

  if (!loaded.length) {
    srcEl.textContent = "unavailable";
    methodEl.textContent = "--";
    stepsEl.innerHTML =
      `<li class="step" data-state="pending"><span class="step__mark"></span>` +
      `<span class="step__name">Serve this page over HTTP to load the ` +
      `recorded solves.</span></li>`;
    $("#analysis-method").textContent = "unavailable";
    $("#analysis").innerHTML =
      `<p class="prose">Serve this page over HTTP to load the recorded solve fixtures.</p>`;
    return;
  }

  // Show the first solve's scramble and its empty checklist straight away, so
  // the panel is never blank -- then start turning, unless motion is unwelcome.
  startSolve(loaded[0]);
  if (reduceMotion) {
    setPhase("idle");
    updateRunning();
  } else {
    playReplay();
  }
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

bootReplay();
