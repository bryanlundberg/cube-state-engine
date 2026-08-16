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
import {
  buildGeometry,
  flattenState,
  centersOf,
  slotCorrect,
  isSolvedFlat,
  crossDone,
  f2lSlotStates,
  ollDone,
  cornersSolvedOnFace,
  FACE_MOVE_TO_INDEX,
} from "./predicates.js";

// Face letter for each face position in the flat layout (0=U 1=L 2=F 3=R 4=B 5=D).
const FACE_LETTERS = Object.entries(FACE_MOVE_TO_INDEX).reduce(
  (acc, [letter, index]) => {
    acc[index] = letter;
    return acc;
  },
  new Array(6)
);

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

// A Roux block is done when its three edges and two corners all match the
// centers. The block can be built while the slice between the two blocks is
// rotated away from the centers; that offset is handled by the caller, which
// evaluates each orientation against snapshots pre-rotated by a fixed slice
// amount (see the candidate enumeration). Keeping the offset FIXED per
// orientation -- rather than accepting any of the four rotations move-by-move --
// is what makes detection match how the solve was actually framed instead of
// firing on coincidental alignments.
function rouxBlockDone(st, geo, sideFace, upFace) {
  const { edges, corners } = rouxBlockPieces(geo, sideFace, upFace);
  if (edges.length !== 3 || corners.length !== 2) return false;
  const centers = centersOf(st, geo);
  return (
    edges.every((e) => slotCorrect(st, centers, e.indices, geo.per)) &&
    corners.every((c) => slotCorrect(st, centers, c.indices, geo.per))
  );
}

// Applies a permutation (out[i] = st[perm[i]]) to a flat sticker array.
function applyPerm(st, perm) {
  const out = new Array(st.length);
  for (let i = 0; i < st.length; i++) out[i] = st[perm[i]];
  return out;
}

// CMLL corners are done when the four corners touching the up face match the
// centers. As with the blocks, any fixed slice offset is applied by the caller
// via pre-rotated snapshots, so this is a plain match against the centers.
function cmllCornersDone(st, geo, upFace) {
  return cornersSolvedOnFace(st, geo, upFace);
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

// Index of the FIRST move strictly after `after` at which the condition holds.
// Used for a stage whose completion is "the first time X happens once the
// previous stage is done" -- e.g. the last-layer corners getting solved after
// the second block is built, even if the blocks are momentarily disturbed at
// that instant. Returns null if `after` is null or the condition never holds.
function firstIndexAfter(bools, after) {
  if (after == null) return null;
  for (let i = after + 1; i < bools.length; i++) {
    if (bools[i]) return i;
  }
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

// Builds the Roux milestone indices for one (sideFace, upFace) orientation,
// using snapshots already pre-rotated by this orientation's fixed slice offset.
//
// Milestones are taken at FIRST achievement, not while a condition holds
// continuously: once a stage is reached the solver moves on, and on face-move
// Roux later stages routinely break and rebuild earlier ones (a CMLL alg breaks
// a block; a face-move LSE breaks everything). So:
//   1st block = first instant either side's block is built;
//   2nd block = first instant the OTHER side's block is built afterwards -- NOT
//               gated on the first block still being intact, which it often is
//               not while the second is being inserted;
//   CMLL      = first instant the last-layer corners are solved afterwards;
//   LSE       = the fully solved cube (`lseIdx`, computed once by the caller and
//               passed in, since "solved" is the same in every orientation).
function buildForRoux(snapshots, geo, sideA, upFace, lseIdx) {
  const sideB = geo.opposite[sideA];

  const aDone = snapshots.map((st) => rouxBlockDone(st, geo, sideA, upFace));
  const bDone = snapshots.map((st) => rouxBlockDone(st, geo, sideB, upFace));
  const aIdx = firstIndexAfter(aDone, -1);
  const bIdx = firstIndexAfter(bDone, -1);
  if (aIdx == null || bIdx == null) return null;

  // First block = the side built earliest; the other side is the second block.
  const aFirst = aIdx <= bIdx;
  const firstSide = aFirst ? sideA : sideB;
  const fbIdx = aFirst ? aIdx : bIdx;
  const sbIdx = firstIndexAfter(aFirst ? bDone : aDone, fbIdx);
  if (sbIdx == null) return null;

  const cornerBools = snapshots.map((st) => cmllCornersDone(st, geo, upFace));
  const cmllIdx = firstIndexAfter(cornerBools, sbIdx);
  if (cmllIdx == null) return null;

  return {
    firstSide,
    secondSide: aFirst ? sideB : sideA,
    upFace,
    fbIdx,
    sbIdx,
    cmllIdx,
    lseIdx,
  };
}

// Does this breakdown follow the Roux order: 1st block -> 2nd block -> CMLL -> LSE?
// Shortest plausible length (in moves) of a genuine Roux stage. The block and
// corner conditions flicker true at scattered transient instants throughout a
// solve; a "stage" only a move or two long is one of those coincidences, not a
// real second block or CMLL. Requiring a minimum span rejects them so a spurious
// orientation cannot masquerade as a clean Roux staging.
const ROUX_MIN_STAGE = 5;

function isRoux(build) {
  const { fbIdx, sbIdx, cmllIdx, lseIdx } = build;
  if (fbIdx == null || sbIdx == null || cmllIdx == null || lseIdx == null)
    return false;
  if (!(fbIdx < sbIdx && sbIdx < cmllIdx && cmllIdx < lseIdx)) return false;
  return sbIdx - fbIdx >= ROUX_MIN_STAGE && cmllIdx - sbIdx >= ROUX_MIN_STAGE;
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
 *   `startFace` names the face the solve was started from, whatever the method:
 *   `{ face, color }` with `face` one of U/L/F/R/B/D and `color` that face's
 *   center color at the end of the solve.
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
    startFace: null,
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
  // orientation. A candidate fixes a side face, a perpendicular up face, and a
  // slice offset `d`: the blocks can be assembled with the slice between them
  // turned away from the centers, so each orientation is tested against
  // snapshots pre-rotated by d quarter-turns of its axis slice (M for L/R blocks,
  // E for U/D, S for F/B). Holding that offset fixed for the whole solve (rather
  // than re-matching it move-by-move) is what stops a block reading as "built"
  // on a coincidental alignment.
  //
  // Many orientations still yield a technically ordered staging. The one that
  // reflects the real solve is the one whose three build milestones land
  // EARLIEST in aggregate (smallest fb + sb + cmll): a false orientation only
  // assembles its blocks and corners by coincidence, which does not happen
  // earlier than the genuine build. (isRoux discards orientations whose stages
  // are too short to be anything but a coincidence.) "Solved" is orientation-
  // independent, so the LSE index is computed once and shared.
  const perms = getMovePermutations(size);
  const sliceCwOf = (face) => {
    if (face === 1 || face === 3) return perms["M"].cw; // L/R axis
    if (face === 0 || face === 5) return perms["E"].cw; // U/D axis
    return perms["S"].cw; // F/B axis
  };
  const lseIdx = completionIndex(
    snapshots.map((st) => isSolvedFlat(st, geo.per))
  );
  // Snapshots rotated by d quarter-turns of a given slice, built incrementally
  // and cached so each (axis, d) is computed once and reused across its up faces.
  const rotCache = new Map();
  const rotatedSnaps = (sliceCw, d) => {
    const key = `${sliceCw}:${d}`;
    if (rotCache.has(key)) return rotCache.get(key);
    const snaps =
      d === 0
        ? snapshots
        : rotatedSnaps(sliceCw, d - 1).map((st) => applyPerm(st, sliceCw));
    rotCache.set(key, snaps);
    return snaps;
  };
  const rouxCandidates = [];
  for (let s = 0; s < 6; s++) {
    const sliceCw = sliceCwOf(s);
    for (const u of geo.neighbors[s]) {
      for (let d = 0; d < 4; d++) {
        const build = buildForRoux(rotatedSnaps(sliceCw, d), geo, s, u, lseIdx);
        if (build) rouxCandidates.push(build);
      }
    }
  }
  const rouxBuild =
    rouxCandidates
      .filter((b) => isRoux(b))
      .sort(
        (a, b) =>
          a.fbIdx + a.sbIdx + a.cmllIdx - (b.fbIdx + b.sbIdx + b.cmllIdx)
      )[0] ?? null;

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
    startFace: null,
    allCrosses,
    unsupported,
  };

  // The face the solve was started from, expressed the same way for every
  // method: the cross face for CFOP, the first block's side face for Roux. It is
  // read off the FINAL orientation (rotations during the solve do not change
  // which face that color ends up on), so `face` is always one of U/L/F/R/B/D
  // and `color` is that face's center color.
  const startFaceOf = (faceIdx) =>
    faceIdx == null || faceIdx < 0
      ? null
      : { face: FACE_LETTERS[faceIdx], color: finalCenters[faceIdx] };

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
      startFace: fbM.record ? startFaceOf(rouxBuild.firstSide) : null,
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
    startFace: cross ? startFaceOf(finalCenters.indexOf(crossColor)) : null,
  };
}
