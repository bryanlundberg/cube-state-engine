// Low-level helpers over the flat sticker array.
//
// Every check compares a sticker against the CURRENT center of its face, so
// detection is invariant to whole-cube rotations (x/y/z) and AUF: a face is
// judged by its own center, not by a hardcoded color.

import type {
  Color,
  CubeState,
  FaceIndex,
  FlatState,
  Geometry,
} from "../types.js";
import { FACE_NAMES } from "../core/constants.js";

/** Flattens `CubeEngine.state()` back into the flat sticker array layout. */
export function flattenState(state: CubeState): FlatState {
  const out: FlatState = [];
  for (const name of FACE_NAMES) {
    const matrix = state[name];
    for (const row of matrix) {
      for (const v of row) out.push(v);
    }
  }
  return out;
}

/** Center color currently shown on each face position. */
export function centersOf(st: FlatState, geo: Geometry): Color[] {
  const centers = new Array<Color>(6);
  for (let f = 0; f < 6; f++) centers[f] = st[geo.centerIndex(f)];
  return centers;
}

/** A slot is correctly placed when every facelet matches its own face center. */
export function slotCorrect(
  st: FlatState,
  centers: Color[],
  indices: number[],
  per: number
): boolean {
  for (const x of indices) {
    if (st[x] !== centers[Math.floor(x / per)]) return false;
  }
  return true;
}

/** Whole cube solved: every face is a single (uniform) color. */
export function isSolvedFlat(st: FlatState, per: number): boolean {
  for (let f = 0; f < 6; f++) {
    const base = f * per;
    const c = st[base];
    for (let i = 1; i < per; i++) if (st[base + i] !== c) return false;
  }
  return true;
}

/** A single face shows one uniform color (its own current center). */
export function faceUniform(
  st: FlatState,
  geo: Geometry,
  faceIdx: FaceIndex,
  centers: Color[] = centersOf(st, geo)
): boolean {
  const base = faceIdx * geo.per;
  for (let i = 0; i < geo.per; i++) {
    if (st[base + i] !== centers[faceIdx]) return false;
  }
  return true;
}
