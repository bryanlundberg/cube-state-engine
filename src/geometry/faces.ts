// The two directions of the face-letter <-> face-index relation, plus the
// coercion every public helper uses to accept either one.

import type { FaceIndex, FaceLetter } from "../types.js";

/** Face letters mapped to their face index in the flat sticker layout. */
export const FACE_MOVE_TO_INDEX: Record<FaceLetter, FaceIndex> = {
  U: 0,
  L: 1,
  F: 2,
  R: 3,
  B: 4,
  D: 5,
};

/** The same relation the other way round: face index -> face letter. */
export const FACE_LETTERS: FaceLetter[] = Object.entries(
  FACE_MOVE_TO_INDEX
).reduce<FaceLetter[]>((acc, [letter, index]) => {
  acc[index] = letter as FaceLetter;
  return acc;
}, new Array<FaceLetter>(6));

/** Face letter (or index) -> face index. */
export function faceIndex(face: FaceLetter | FaceIndex): FaceIndex {
  if (typeof face === "number") return face;
  const idx = FACE_MOVE_TO_INDEX[String(face).toUpperCase() as FaceLetter];
  if (idx == null) throw new Error(`Unknown face: ${face}`);
  return idx;
}
