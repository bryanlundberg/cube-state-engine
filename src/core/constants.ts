// Layout constants shared by the engine and everything derived from it.

import type { Color, CubeSize, FaceName, MoveKey } from "../types.js";

/** Face order used across the flat sticker representation. */
export const FACE_NAMES: readonly FaceName[] = [
  "UPPER",
  "LEFT",
  "FRONT",
  "RIGHT",
  "BACK",
  "DOWN",
];

/** Solved color of each face, in `FACE_NAMES` order. */
export const FACE_COLORS: readonly Color[] = ["W", "O", "G", "R", "B", "Y"];

/** Moves that only affect inner/double layers, so they are no-ops on a 2x2. */
export const NOOP_SIZE2: ReadonlySet<MoveKey> = new Set<MoveKey>([
  "Uw",
  "Dw",
  "Rw",
  "Lw",
  "Fw",
  "M",
  "E",
  "S",
]);

const ALLOWED_SIZES: readonly number[] = [2, 3];

/** Coerces any input to a supported cube size, defaulting to 3. */
export function normalizeSize(size: unknown): CubeSize {
  return ALLOWED_SIZES.includes(size as number) ? (size as CubeSize) : 3;
}

/** A solved face of each color, handy for asserting against `state()`. */
export const COLOR: Record<Color, Color[]> = {
  W: ["W", "W", "W", "W", "W", "W", "W", "W", "W"],
  G: ["G", "G", "G", "G", "G", "G", "G", "G", "G"],
  R: ["R", "R", "R", "R", "R", "R", "R", "R", "R"],
  B: ["B", "B", "B", "B", "B", "B", "B", "B", "B"],
  O: ["O", "O", "O", "O", "O", "O", "O", "O", "O"],
  Y: ["Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y"],
};
