// Solution analyzer: replays a recorded solve move-by-move and reports the
// timing of each method milestone (cross, the four F2L pairs, OLL and PLL),
// plus a best-effort guess of the solving method (currently CFOP).
//
// Input is just the solution as `[{ m, t }]` where `m` is a move token in the
// same notation the engine accepts (e.g. "R", "U'", "R2", "x", "M'") and `t`
// is the CUMULATIVE elapsed time (ms) up to and including that move. The
// scramble is not required: it is derived as the inverse of the solution.
//
// All milestone checks compare each sticker against the CURRENT center of its
// face, so detection is invariant to whole-cube rotations (x/y/z) and wide
// moves that may appear in real speedsolves.

import { CubeEngine, getMovePermutations } from "./index.js";
import { simplifyMoves } from "./simplify.js";

// Flat layout face order (must match CubeEngine.state()).
const FACE_NAMES = ["UPPER", "LEFT", "FRONT", "RIGHT", "BACK", "DOWN"];

// Basic face moves mapped to their face index in the flat sticker layout.
const FACE_MOVE_TO_INDEX = { U: 0, L: 1, F: 2, R: 3, B: 4, D: 5 };

// Move bases the engine can actually apply (after normalization).
const SUPPORTED_BASES = new Set([
  "U", "D", "L", "R", "F", "B",
  "x", "y", "z",
  "M", "E", "S",
  "Uw", "Dw", "Rw", "Lw", "Fw",
]);

// Lowercase single-letter wide moves -> the engine's wide notation.
const WIDE_LOWER = { r: "Rw", u: "Uw", f: "Fw", l: "Lw", d: "Dw", b: "Bw" };

// Normalizes one move token to the engine's notation and reports its base.
// Returns { token, base } where base is null if the token is unparseable.
function normalizeToken(raw) {
  const m = String(raw).trim().match(/^([A-Za-z]w?)('?2?|2?'?)$/);
  if (!m) return { token: raw, base: null };
  let base = m[1];
  if (base.length === 1 && WIDE_LOWER[base]) base = WIDE_LOWER[base];
  return { token: base + m[2], base };
}

// Derived sticker geometry is identical for every cube of a given size.
const GEOMETRY_CACHE = new Map();

/**
 * Derives the sticker adjacency of a cube from the engine's permutation tables.
 *
 * A facelet is displaced by a face turn iff it physically belongs to that face,
 * so the SET of basic face turns that move a facelet identifies the cubie it
 * sits on: 1 face => center, 2 faces => edge, 3 faces => corner. Grouping
 * facelets by that signature reconstructs every edge/corner slot without any
 * hardcoded layout, and stays correct for any matrix convention the engine uses.
 */
function buildGeometry(size) {
  if (GEOMETRY_CACHE.has(size)) return GEOMETRY_CACHE.get(size);

  const perms = getMovePermutations(size);
  const per = size * size;
  const total = per * 6;
  const faceMoves = Object.keys(FACE_MOVE_TO_INDEX);

  // signature[i] = sorted face indices whose quarter turn displaces sticker i.
  const edgeMap = new Map(); // "a,b"   -> indices[]
  const cornerMap = new Map(); // "a,b,c" -> indices[]
  for (let i = 0; i < total; i++) {
    const faces = [];
    for (const mv of faceMoves) {
      if (perms[mv].cw[i] !== i) faces.push(FACE_MOVE_TO_INDEX[mv]);
    }
    faces.sort((a, b) => a - b);
    const key = faces.join(",");
    if (faces.length === 2) {
      if (!edgeMap.has(key)) edgeMap.set(key, []);
      edgeMap.get(key).push(i);
    } else if (faces.length === 3) {
      if (!cornerMap.has(key)) cornerMap.set(key, []);
      cornerMap.get(key).push(i);
    }
  }

  const edges = [...edgeMap.entries()].map(([key, indices]) => ({
    faces: key.split(",").map(Number),
    indices,
  }));
  const corners = [...cornerMap.entries()].map(([key, indices]) => ({
    faces: key.split(",").map(Number),
    indices,
  }));

  // Neighbor / opposite relationships between the six face positions.
  const neighbors = Array.from({ length: 6 }, () => new Set());
  for (const e of edges) {
    const [a, b] = e.faces;
    neighbors[a].add(b);
    neighbors[b].add(a);
  }
  const opposite = new Array(6).fill(-1);
  for (let f = 0; f < 6; f++) {
    for (let g = 0; g < 6; g++) {
      if (g !== f && !neighbors[f].has(g)) {
        opposite[f] = g;
        break;
      }
    }
  }

  const geo = {
    size,
    per,
    centerIndex: (f) => f * per + Math.floor(per / 2),
    edges,
    corners,
    neighbors,
    opposite,
    edgesByFace: (f) => edges.filter((e) => e.faces.includes(f)),
    cornersByFace: (f) => corners.filter((c) => c.faces.includes(f)),
    edgeByPair: (a, b) =>
      edges.find(
        (e) =>
          (e.faces[0] === a && e.faces[1] === b) ||
          (e.faces[0] === b && e.faces[1] === a)
      ),
  };

  GEOMETRY_CACHE.set(size, geo);
  return geo;
}

/** Inverts a single move token (R -> R', R' -> R, R2 -> R2). */
function invertToken(tok) {
  if (tok.endsWith("2")) return tok;
  if (tok.endsWith("'")) return tok.slice(0, -1);
  return tok + "'";
}

/**
 * Inverts a sequence of move tokens (reverse order, each token inverted).
 * @param {string[]} tokens
 * @returns {string[]}
 */
export function invertSequence(tokens) {
  return tokens.slice().reverse().map(invertToken);
}

// Flattens CubeEngine.state() back into the flat sticker array layout.
function flattenState(state) {
  const out = [];
  for (const name of FACE_NAMES) {
    const matrix = state[name];
    for (const row of matrix) {
      for (const v of row) out.push(v);
    }
  }
  return out;
}

// Center color currently shown on each face position.
function centersOf(st, geo) {
  const centers = new Array(6);
  for (let f = 0; f < 6; f++) centers[f] = st[geo.centerIndex(f)];
  return centers;
}

// A slot is correctly placed when every facelet matches its own face center.
function slotCorrect(st, centers, indices, per) {
  for (const x of indices) {
    if (st[x] !== centers[Math.floor(x / per)]) return false;
  }
  return true;
}

// Whole cube solved: every face is a single (uniform) color.
function isSolvedFlat(st, per) {
  for (let f = 0; f < 6; f++) {
    const base = f * per;
    const c = st[base];
    for (let i = 1; i < per; i++) if (st[base + i] !== c) return false;
  }
  return true;
}

// True when the cross of the given color is complete in this state.
function crossDone(st, geo, color) {
  const centers = centersOf(st, geo);
  const C = centers.indexOf(color);
  if (C < 0) return false;
  return geo
    .edgesByFace(C)
    .every((e) => slotCorrect(st, centers, e.indices, geo.per));
}

// Per-slot F2L completion keyed by the (stable) pair of side-face colors.
function f2lSlotStates(st, geo, color) {
  const centers = centersOf(st, geo);
  const C = centers.indexOf(color);
  const result = {};
  if (C < 0) return result;
  for (const corner of geo.cornersByFace(C)) {
    const sides = corner.faces.filter((f) => f !== C);
    if (sides.length !== 2) continue;
    const [a, b] = sides;
    const edge = geo.edgeByPair(a, b);
    const cornerOk = slotCorrect(st, centers, corner.indices, geo.per);
    const edgeOk = edge
      ? slotCorrect(st, centers, edge.indices, geo.per)
      : false;
    const key = [centers[a], centers[b]].sort().join("-");
    result[key] = cornerOk && edgeOk;
  }
  return result;
}

// Last layer (face opposite the cross) fully oriented = one color on its top.
function ollDone(st, geo, color) {
  const centers = centersOf(st, geo);
  const C = centers.indexOf(color);
  if (C < 0) return false;
  const O = geo.opposite[C];
  const base = O * geo.per;
  for (let i = 0; i < geo.per; i++) {
    if (st[base + i] !== centers[O]) return false;
  }
  return true;
}

// --- Roux geometry --------------------------------------------------------

// The pieces of a Roux 1x2x3 block, parameterized by the block's side face and
// the up face (which fixes down = opposite[up]). The block holds the side
// center, the side's three edges that do NOT touch the up face, and the side's
// two corners that DO touch the down face. The center always matches itself, so
// only edges/corners need checking.
function rouxBlockPieces(geo, sideFace, upFace) {
  const downFace = geo.opposite[upFace];
  const edges = geo
    .edgesByFace(sideFace)
    .filter((e) => !e.faces.includes(upFace));
  const corners = geo
    .cornersByFace(sideFace)
    .filter((c) => c.faces.includes(downFace));
  return { edges, corners };
}

// A Roux block is done when its three edges and two corners are all placed.
function rouxBlockDone(st, centers, geo, sideFace, upFace) {
  const { edges, corners } = rouxBlockPieces(geo, sideFace, upFace);
  if (edges.length !== 3 || corners.length !== 2) return false;
  for (const e of edges)
    if (!slotCorrect(st, centers, e.indices, geo.per)) return false;
  for (const c of corners)
    if (!slotCorrect(st, centers, c.indices, geo.per)) return false;
  return true;
}

// Applies a permutation (out[i] = st[perm[i]]) to a flat sticker array.
function applyPerm(st, perm) {
  const out = new Array(st.length);
  for (let i = 0; i < st.length; i++) out[i] = st[perm[i]];
  return out;
}

// CMLL is done when the four corners touching the up face are solved, allowing
// the M slice to be unaligned: we accept the state if ANY of the four M-slice
// rotations makes those corners correct. M moves neither the corners nor the
// L/R blocks, only the U/F/D/B centers (and M-slice edges), so this captures
// exactly "last-layer corners solved, M not necessarily aligned yet".
function cmllDone(st, geo, upFace, mPerm) {
  let cur = st;
  const corners = geo.cornersByFace(upFace);
  for (let m = 0; m < 4; m++) {
    if (m > 0) cur = applyPerm(cur, mPerm);
    const centers = centersOf(cur, geo);
    if (corners.every((c) => slotCorrect(cur, centers, c.indices, geo.per)))
      return true;
  }
  return false;
}

// Index of the move that COMPLETES a stage: the first move after which the
// condition holds, provided the stage is genuinely achieved by the end of the
// solve. Later moves are allowed to break it transiently (a turn mid-algorithm
// momentarily disturbs an already-finished cross/pair), which is why we take
// the first occurrence rather than requiring it to hold continuously.
function completionIndex(bools) {
  const n = bools.length;
  if (n === 0 || !bools[n - 1]) return null;
  for (let i = 0; i < n; i++) if (bools[i]) return i;
  return null;
}

// Builds the milestone indices for one assumed cross color. Detection is
// cumulative: an F2L pair only counts while the cross is solved, and OLL only
// counts once the full F2L is solved. This rejects transient false positives.
function buildForCross(snapshots, geo, color) {
  const n = snapshots.length;
  const crossBools = snapshots.map((st) => crossDone(st, geo, color));
  const crossIdx = completionIndex(crossBools);

  // Per-slot completion, gated by the cross being solved at the same instant.
  const slotSeries = new Map();
  for (let i = 0; i < n; i++) {
    const states = f2lSlotStates(snapshots[i], geo, color);
    for (const [key, val] of Object.entries(states)) {
      if (!slotSeries.has(key)) slotSeries.set(key, new Array(n).fill(false));
      slotSeries.get(key)[i] = crossBools[i] && val;
    }
  }
  const f2lSlots = [...slotSeries.entries()]
    .map(([slot, bools]) => ({ slot, idx: completionIndex(bools) }))
    .filter((s) => s.idx != null)
    .sort((a, b) => a.idx - b.idx);

  // Full F2L solved = cross plus all four pairs solved at the same instant.
  const f2lComplete = new Array(n).fill(false);
  for (let i = 0; i < n; i++) {
    if (!crossBools[i] || slotSeries.size < 4) continue;
    let all = true;
    for (const bools of slotSeries.values()) {
      if (!bools[i]) {
        all = false;
        break;
      }
    }
    f2lComplete[i] = all;
  }

  // OLL is only meaningful once F2L is done (last layer oriented on top of it).
  const ollIdx = completionIndex(
    snapshots.map((st, i) => f2lComplete[i] && ollDone(st, geo, color))
  );
  const pllIdx = completionIndex(snapshots.map((st) => isSolvedFlat(st, geo.per)));

  return { crossIdx, f2lSlots, ollIdx, pllIdx };
}

// Does this breakdown follow the CFOP order: cross -> 4x F2L -> OLL -> PLL?
function isCFOP(build) {
  const { crossIdx, f2lSlots, ollIdx, pllIdx } = build;
  if (crossIdx == null || pllIdx == null || ollIdx == null) return false;
  if (f2lSlots.length !== 4) return false;
  if (!f2lSlots.every((s) => s.idx >= crossIdx)) return false;
  const lastF2L = f2lSlots[3].idx;
  return ollIdx >= lastF2L && pllIdx >= ollIdx;
}

// Builds the Roux milestone indices for one (sideFace, upFace) orientation.
// Detection is cumulative, mirroring buildForCross: the second block only counts
// while the first block holds, CMLL only once both blocks hold, and LSE is the
// fully solved cube. The first block is whichever of the two opposite side faces
// finishes its block earliest; the other side is the second block.
function buildForRoux(snapshots, geo, sideA, upFace, mPerm) {
  const n = snapshots.length;
  const sideB = geo.opposite[sideA];

  const centersAt = snapshots.map((st) => centersOf(st, geo));
  const aDone = snapshots.map((st, i) =>
    rouxBlockDone(st, centersAt[i], geo, sideA, upFace)
  );
  const bDone = snapshots.map((st, i) =>
    rouxBlockDone(st, centersAt[i], geo, sideB, upFace)
  );
  const aIdx = completionIndex(aDone);
  const bIdx = completionIndex(bDone);

  // First block = the side that completes earliest; second block = the other.
  let firstSide = sideA;
  let secondSide = sideB;
  let fbBools = aDone;
  let sbBools = bDone;
  if ((bIdx ?? Infinity) < (aIdx ?? Infinity)) {
    firstSide = sideB;
    secondSide = sideA;
    fbBools = bDone;
    sbBools = aDone;
  }

  const fbIdx = completionIndex(fbBools);
  // Second block gated by the first block holding at the same instant.
  const secondBlockBools = snapshots.map((_, i) => fbBools[i] && sbBools[i]);
  const sbIdx = completionIndex(secondBlockBools);

  const cmllIdx = completionIndex(
    snapshots.map(
      (st, i) => secondBlockBools[i] && cmllDone(st, geo, upFace, mPerm)
    )
  );
  const lseIdx = completionIndex(snapshots.map((st) => isSolvedFlat(st, geo.per)));

  return { firstSide, secondSide, upFace, fbIdx, sbIdx, cmllIdx, lseIdx };
}

// Does this breakdown follow the Roux order: 1st block -> 2nd block -> CMLL -> LSE?
function isRoux(build) {
  const { fbIdx, sbIdx, cmllIdx, lseIdx } = build;
  if (fbIdx == null || sbIdx == null || cmllIdx == null || lseIdx == null)
    return false;
  return fbIdx <= sbIdx && sbIdx <= cmllIdx && cmllIdx <= lseIdx;
}

/**
 * Analyzes a solution and returns the timing of each method milestone.
 *
 * @param {Array<{m: string, t: number}>} moves - Solution moves with cumulative
 *   timestamps. `m` is a move token; `t` is elapsed ms up to that move.
 * @param {{size?: number}} [options] - Cube size (defaults to 3). Method staging
 *   is only computed for 3x3; other sizes report the solved (PLL) time only.
 * @returns {object} Breakdown with `method` ("CFOP", "Roux" or "unknown"),
 *   `total`, `tps` and `allCrosses` (cross time per face color). For CFOP it
 *   carries `cross`, `f2l[]`, `oll`, `pll`; for Roux it carries `firstBlock`,
 *   `secondBlock`, `cmll`, `lse` (the other method's fields are null). Each
 *   block record also includes the `side` center color it was built on.
 */
export function analyzeSolution(moves, options = {}) {
  const size = options.size === 2 ? 2 : 3;

  // Keep both the original token (`m`, for display) and the engine-normalized
  // token (`mm`, used for replay). Collect anything we cannot parse so the
  // caller can see dropped moves instead of getting silently wrong timings.
  const unsupported = [];
  const seq = (Array.isArray(moves) ? moves : [])
    .map((x) => {
      const m = String(x?.m ?? "").trim();
      const { token, base } = normalizeToken(m);
      const supported = base != null && SUPPORTED_BASES.has(base);
      if (m.length > 0 && !supported) unsupported.push(m);
      return { m, mm: supported ? token : "", t: Number(x?.t) };
    })
    .filter((x) => x.m.length > 0);
  const n = seq.length;

  const simplifiedMoves = simplifyMoves(
    (Array.isArray(moves) ? moves : []).filter((x) => x?.m)
  );
  const simplifiedCount = simplifiedMoves.length;

  const empty = {
    size,
    method: "unknown",
    solved: false,
    total: n > 0 ? seq[n - 1].t : 0,
    tps: 0,
    moves: simplifiedMoves,
    cross: null,
    f2l: [],
    oll: null,
    pll: null,
    firstBlock: null,
    secondBlock: null,
    cmll: null,
    lse: null,
    allCrosses: {},
    unsupported,
  };
  if (n === 0) return empty;

  // Reproduce the scramble (inverse of the solution), then replay forward,
  // capturing a flat snapshot after every solution move. Unsupported tokens
  // contribute no move (mm === "") so the replay simply skips them.
  const engine = new CubeEngine("", { size });
  const scramble = invertSequence(seq.map((x) => x.mm).filter(Boolean)).join(" ");
  engine.applyMoves(scramble, { record: false });

  const geo = buildGeometry(size);
  const snapshots = new Array(n);
  for (let i = 0; i < n; i++) {
    if (seq[i].mm) engine.applyMoves(seq[i].mm, { record: false });
    snapshots[i] = flattenState(engine.state());
  }

  const solved = isSolvedFlat(snapshots[n - 1], geo.per);
  const pllIdxOnly = completionIndex(
    snapshots.map((st) => isSolvedFlat(st, geo.per))
  );

  // Map a milestone index to a timed record, with duration since `prevAt`.
  const milestone = (idx, prevAt) => {
    if (idx == null) return { record: null, at: prevAt };
    const at = seq[idx].t;
    return {
      record: { at, duration: at - prevAt, moveIndex: idx, move: seq[idx].m },
      at,
    };
  };

  // Non-3x3: only the solved (PLL) milestone is meaningful.
  if (size !== 3) {
    const pll = milestone(pllIdxOnly, 0);
    const total = seq[n - 1].t;
    return {
      ...empty,
      solved,
      total,
      tps: total > 0 ? simplifiedCount / (total / 1000) : 0,
      pll: pll.record,
    };
  }

  // Cross can complete on any of the six faces; record each, then pick the
  // cross color that yields a valid CFOP staging (falling back to the earliest).
  const finalCenters = centersOf(snapshots[n - 1], geo);
  const colors = [...new Set(finalCenters)];

  const allCrosses = {};
  for (const color of colors) {
    const idx = completionIndex(
      snapshots.map((st) => crossDone(st, geo, color))
    );
    allCrosses[color] =
      idx == null
        ? null
        : { at: seq[idx].t, moveIndex: idx, move: seq[idx].m };
  }

  const ordered = colors
    .map((color) => ({ color, build: buildForCross(snapshots, geo, color) }))
    .sort((a, b) => {
      const ai = a.build.crossIdx ?? Infinity;
      const bi = b.build.crossIdx ?? Infinity;
      return ai - bi;
    });

  const cfopChosen = ordered.find((c) => isCFOP(c.build)) ?? ordered[0];
  const cfopValid = !!cfopChosen && isCFOP(cfopChosen.build);

  // Stage the solve as Roux (1st block -> 2nd block -> CMLL -> LSE) on every
  // orientation. Each candidate fixes a side face and a perpendicular up face;
  // buildForRoux assigns first/second block by which side finishes earliest.
  // Pick the valid candidate whose first block completes earliest.
  const mPerm = getMovePermutations(size)["M"].cw;
  const rouxCandidates = [];
  for (let s = 0; s < 6; s++) {
    for (const u of geo.neighbors[s]) {
      rouxCandidates.push(buildForRoux(snapshots, geo, s, u, mPerm));
    }
  }
  const rouxBuild =
    rouxCandidates
      .filter((b) => isRoux(b))
      .sort((a, b) => a.fbIdx - b.fbIdx)[0] ?? null;

  // A solved cube satisfies many orderings, so both stagings can be technically
  // valid. Disambiguate by which method's FIRST milestone is genuinely reached
  // early: a real CFOP cross is built up front, whereas on a Roux solve no cross
  // completes until LSE; conversely a full 1x2x3 block only forms mid-CFOP. The
  // structure that actually happened owns the earlier first milestone; ties go
  // to CFOP.
  let method = "unknown";
  if (cfopValid && rouxBuild) {
    method = cfopChosen.build.crossIdx <= rouxBuild.fbIdx ? "CFOP" : "Roux";
  } else if (cfopValid) {
    method = "CFOP";
  } else if (rouxBuild) {
    method = "Roux";
  }
  const total = seq[n - 1].t;
  const base = {
    size,
    method,
    solved,
    total,
    tps: total > 0 ? simplifiedCount / (total / 1000) : 0,
    moves: simplifiedMoves,
    cross: null,
    f2l: [],
    oll: null,
    pll: null,
    firstBlock: null,
    secondBlock: null,
    cmll: null,
    lse: null,
    allCrosses,
    unsupported,
  };

  // Roux: report 1st block / 2nd block / CMLL / LSE, chaining durations.
  if (method === "Roux") {
    const fbM = milestone(rouxBuild.fbIdx, 0);
    const sbM = milestone(rouxBuild.sbIdx, fbM.at);
    const cmllM = milestone(rouxBuild.cmllIdx, sbM.at);
    const lseM = milestone(rouxBuild.lseIdx, cmllM.at);
    return {
      ...base,
      firstBlock: fbM.record
        ? { side: finalCenters[rouxBuild.firstSide], ...fbM.record }
        : null,
      secondBlock: sbM.record
        ? { side: finalCenters[rouxBuild.secondSide], ...sbM.record }
        : null,
      cmll: cmllM.record,
      lse: lseM.record,
    };
  }

  // CFOP (or unknown): report cross / F2L / OLL / PLL from the earliest cross.
  const { color: crossColor, build } = cfopChosen;
  const crossM = milestone(build.crossIdx, 0);
  const cross = crossM.record
    ? { color: crossColor, ...crossM.record }
    : null;

  let prevAt = crossM.at;
  const f2l = [];
  for (const slot of build.f2lSlots) {
    const m = milestone(slot.idx, prevAt);
    if (m.record) {
      f2l.push({ slot: slot.slot, ...m.record });
      prevAt = m.at;
    }
  }

  const ollM = milestone(build.ollIdx, prevAt);
  prevAt = ollM.at;
  const pllM = milestone(build.pllIdx, prevAt);

  return {
    ...base,
    cross,
    f2l,
    oll: ollM.record,
    pll: pllM.record,
  };
}
