// Reusable cube-state predicates and derived geometry.
//
// These helpers were originally private to the solution analyzer. They are
// extracted here so both the analyzer AND external callers (e.g. a trainer that
// checks whether a given goal — OLL, F2L, a solved cube — has been reached) can
// share exactly one implementation.
//
// Every check compares each sticker against the CURRENT center of its face, so
// detection is invariant to whole-cube rotations (x/y/z) and AUF: a face is
// judged by its own center, not by a hardcoded color.

import { getMovePermutations } from "./index.js";

// Flat layout face order (must match CubeEngine.state()).
// Index: 0=UPPER 1=LEFT 2=FRONT 3=RIGHT 4=BACK 5=DOWN
export const FACE_NAMES = ["UPPER", "LEFT", "FRONT", "RIGHT", "BACK", "DOWN"];

// Face letters mapped to their face index in the flat sticker layout.
export const FACE_MOVE_TO_INDEX = { U: 0, L: 1, F: 2, R: 3, B: 4, D: 5 };

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
export function buildGeometry(size) {
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

  // Neighbor / opposite relationships between the six face positions. Two faces
  // are adjacent iff they share a cubie (edge OR corner); opposite faces never
  // share one. Deriving adjacency from corners as well as edges keeps this
  // correct on a 2x2 (which has no edge cubies at all).
  const neighbors = Array.from({ length: 6 }, () => new Set());
  const mark = (faces) => {
    for (let i = 0; i < faces.length; i++) {
      for (let j = i + 1; j < faces.length; j++) {
        neighbors[faces[i]].add(faces[j]);
        neighbors[faces[j]].add(faces[i]);
      }
    }
  };
  for (const e of edges) mark(e.faces);
  for (const c of corners) mark(c.faces);

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

// Flattens CubeEngine.state() back into the flat sticker array layout.
export function flattenState(state) {
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
export function centersOf(st, geo) {
  const centers = new Array(6);
  for (let f = 0; f < 6; f++) centers[f] = st[geo.centerIndex(f)];
  return centers;
}

// A slot is correctly placed when every facelet matches its own face center.
export function slotCorrect(st, centers, indices, per) {
  for (const x of indices) {
    if (st[x] !== centers[Math.floor(x / per)]) return false;
  }
  return true;
}

// Whole cube solved: every face is a single (uniform) color.
export function isSolvedFlat(st, per) {
  for (let f = 0; f < 6; f++) {
    const base = f * per;
    const c = st[base];
    for (let i = 1; i < per; i++) if (st[base + i] !== c) return false;
  }
  return true;
}

// True when the cross of the given color is complete in this state.
export function crossDone(st, geo, color) {
  const centers = centersOf(st, geo);
  const C = centers.indexOf(color);
  if (C < 0) return false;
  return geo
    .edgesByFace(C)
    .every((e) => slotCorrect(st, centers, e.indices, geo.per));
}

// Per-slot F2L completion keyed by the (stable) pair of side-face colors.
export function f2lSlotStates(st, geo, color) {
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
export function ollDone(st, geo, color) {
  const centers = centersOf(st, geo);
  const C = centers.indexOf(color);
  if (C < 0) return false;
  const O = geo.opposite[C];
  return faceUniform(st, geo, O, centers);
}

// A single face shows one uniform color (its own current center).
export function faceUniform(st, geo, faceIdx, centers = centersOf(st, geo)) {
  const base = faceIdx * geo.per;
  for (let i = 0; i < geo.per; i++) {
    if (st[base + i] !== centers[faceIdx]) return false;
  }
  return true;
}

// The four corners touching a face are all solved (each sticker matches its
// neighbor centers). This is the "corners permuted + oriented" condition for
// the layer on that face.
export function cornersSolvedOnFace(st, geo, faceIdx) {
  const centers = centersOf(st, geo);
  return geo
    .cornersByFace(faceIdx)
    .every((c) => slotCorrect(st, centers, c.indices, geo.per));
}

// --- Public API -----------------------------------------------------------
//
// The functions below accept a `CubeEngine`, a `state()` object, or a flat
// sticker array, so a caller can pass whichever it already holds. In the
// trainer the last layer is a FIXED face (the cube starts solved and the
// smartcube tracks from there), so `face` defaults to 'U' and no multi-color
// search is needed.

const ALLOWED_SIZES = [2, 3];

/**
 * Exposes the (cached) derived geometry for a given cube size.
 * @param {number} [size=3] - 2 or 3.
 */
export function getCubeGeometry(size = 3) {
  return buildGeometry(ALLOWED_SIZES.includes(size) ? size : 3);
}

// Normalizes any accepted input into a flat sticker array.
function toFlat(input) {
  if (Array.isArray(input)) return input;
  if (input && typeof input.state === "function") {
    return flattenState(input.state());
  }
  if (input && input.UPPER) return flattenState(input);
  throw new TypeError(
    "Expected a CubeEngine, a state() object, or a flat sticker array"
  );
}

// Flat array + matching geometry for the input's inferred size.
function context(input) {
  const flat = toFlat(input);
  const per = flat.length / 6;
  const size = Math.round(Math.sqrt(per));
  return { flat, geo: getCubeGeometry(size) };
}

// Face letter (or index) -> face index.
function faceIndex(face) {
  if (typeof face === "number") return face;
  const idx = FACE_MOVE_TO_INDEX[String(face).toUpperCase()];
  if (idx == null) throw new Error(`Unknown face: ${face}`);
  return idx;
}

/**
 * Whether the given face shows a single uniform color (last layer oriented).
 * @param {*} input - CubeEngine, state object, or flat array.
 * @param {{face?: string|number}} [opts] - Face to check (default 'U').
 */
export function isLastLayerOriented(input, { face = "U" } = {}) {
  const { flat, geo } = context(input);
  return faceUniform(flat, geo, faceIndex(face));
}

/**
 * Whether the four corners of the given face are fully solved (their side
 * stickers match the neighboring centers).
 * @param {*} input - CubeEngine, state object, or flat array.
 * @param {{face?: string|number}} [opts] - Face to check (default 'U').
 */
export function areLastLayerCornersSolved(input, { face = "U" } = {}) {
  const { flat, geo } = context(input);
  return cornersSolvedOnFace(flat, geo, faceIndex(face));
}

/**
 * Whether the cross of a given color is complete. Defaults to the color
 * currently on the DOWN center (the usual CFOP cross face).
 * @param {*} input - CubeEngine, state object, or flat array.
 * @param {{color?: string}} [opts]
 */
export function isCrossComplete(input, { color } = {}) {
  const { flat, geo } = context(input);
  const c = color ?? centersOf(flat, geo)[5];
  return crossDone(flat, geo, c);
}

/**
 * Whether the first two layers are complete for a given cross color: the cross
 * itself plus all four F2L pairs solved. Defaults to the DOWN center color.
 * @param {*} input - CubeEngine, state object, or flat array.
 * @param {{cross?: string}} [opts]
 */
export function isF2LComplete(input, { cross } = {}) {
  const { flat, geo } = context(input);
  const color = cross ?? centersOf(flat, geo)[5];
  if (!crossDone(flat, geo, color)) return false;
  const slots = Object.values(f2lSlotStates(flat, geo, color));
  return slots.length === 4 && slots.every(Boolean);
}

/**
 * Whether the whole cube is solved (every face uniform).
 * @param {*} input - CubeEngine, state object, or flat array.
 */
export function isCubeSolved(input) {
  const { flat, geo } = context(input);
  return isSolvedFlat(flat, geo.per);
}

/**
 * Dispatcher the trainer calls after each move to test a configurable goal.
 *
 * `goalSpec` may be:
 *   - a function `(input) => boolean` — a custom predicate (escape hatch);
 *   - a string goal name: 'full' | 'solved' | 'oll' | 'oll+cp' | 'f2l' | 'cross';
 *   - an object `{ goal, face, color, cross, custom }` where `custom` (a
 *     function) takes precedence and the rest parameterize the named goal.
 *
 * @param {*} input - CubeEngine, state object, or flat array.
 * @param {string|object|function} [goalSpec='full']
 * @returns {boolean}
 */
export function matchesGoal(input, goalSpec = "full") {
  if (typeof goalSpec === "function") return !!goalSpec(input);
  const spec = typeof goalSpec === "string" ? { goal: goalSpec } : goalSpec || {};
  if (typeof spec.custom === "function") return !!spec.custom(input);

  const goal = String(spec.goal ?? "full").toLowerCase();
  const face = spec.face ?? "U";
  switch (goal) {
    case "full":
    case "solved":
      return isCubeSolved(input);
    case "oll":
      return isLastLayerOriented(input, { face });
    case "oll+cp":
    case "ollcp":
    case "oll_cp":
      return (
        isLastLayerOriented(input, { face }) &&
        areLastLayerCornersSolved(input, { face })
      );
    case "f2l":
      return isF2LComplete(input, { cross: spec.cross ?? spec.color });
    case "cross":
      return isCrossComplete(input, { color: spec.color });
    default:
      throw new Error(`Unknown goal: ${spec.goal}`);
  }
}
