// Predicates for the stages a solving method goes through: cross, F2L slots,
// last-layer orientation and last-layer corners. Shared by the analyzer's
// staging strategies and by the public goal API.

import type { Color, FaceIndex, FlatState, Geometry } from "../types.js";
import { centersOf, faceUniform, slotCorrect } from "./flat.js";

/** True when the cross of the given color is complete in this state. */
export function crossDone(
  st: FlatState,
  geo: Geometry,
  color: Color
): boolean {
  const centers = centersOf(st, geo);
  const C = centers.indexOf(color);
  if (C < 0) return false;
  return geo
    .edgesByFace(C)
    .every((e) => slotCorrect(st, centers, e.indices, geo.per));
}

/** Per-slot F2L completion, keyed by the (stable) pair of side-face colors. */
export function f2lSlotStates(
  st: FlatState,
  geo: Geometry,
  color: Color
): Record<string, boolean> {
  const centers = centersOf(st, geo);
  const C = centers.indexOf(color);
  const result: Record<string, boolean> = {};
  if (C < 0) return result;
  for (const corner of geo.cornersByFace(C)) {
    const sides = corner.faces.filter((f) => f !== C);
    if (sides.length !== 2) continue;
    const [a, b] = sides as [FaceIndex, FaceIndex];
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

/** Last layer (the face opposite the cross) fully oriented = one color on top. */
export function ollDone(st: FlatState, geo: Geometry, color: Color): boolean {
  const centers = centersOf(st, geo);
  const C = centers.indexOf(color);
  if (C < 0) return false;
  const O = geo.opposite[C];
  return faceUniform(st, geo, O, centers);
}

/**
 * The four corners touching a face are all solved (each sticker matches its
 * neighbor centers): the "corners permuted + oriented" condition for that layer.
 */
export function cornersSolvedOnFace(
  st: FlatState,
  geo: Geometry,
  faceIdx: FaceIndex
): boolean {
  const centers = centersOf(st, geo);
  return geo
    .cornersByFace(faceIdx)
    .every((c) => slotCorrect(st, centers, c.indices, geo.per));
}
