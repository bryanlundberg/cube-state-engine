// Move-token notation: normalizing what a timer recorded into what the engine
// can apply, and inverting sequences.

import type { MoveKey } from "../types.js";

/** Move bases the engine can actually apply (after normalization). */
export const SUPPORTED_BASES: ReadonlySet<string> = new Set<MoveKey>([
  "U", "D", "L", "R", "F", "B",
  "x", "y", "z",
  "M", "E", "S",
  "Uw", "Dw", "Rw", "Lw", "Fw",
]);

/** Lowercase single-letter wide moves -> the engine's wide notation. */
const WIDE_LOWER: Record<string, string> = {
  r: "Rw",
  u: "Uw",
  f: "Fw",
  l: "Lw",
  d: "Dw",
  b: "Bw",
};

export interface NormalizedToken {
  token: string;
  /** Null when the token is unparseable. */
  base: string | null;
}

/** Normalizes one move token to the engine's notation and reports its base. */
export function normalizeToken(raw: string): NormalizedToken {
  const m = String(raw)
    .trim()
    .match(/^([A-Za-z]w?)('?2?|2?'?)$/);
  if (!m) return { token: raw, base: null };
  let base = m[1];
  if (base.length === 1 && WIDE_LOWER[base]) base = WIDE_LOWER[base];
  return { token: base + m[2], base };
}

/** Inverts a single move token (R -> R', R' -> R, R2 -> R2). */
export function invertToken(tok: string): string {
  if (tok.endsWith("2")) return tok;
  if (tok.endsWith("'")) return tok.slice(0, -1);
  return tok + "'";
}

/** Inverts a sequence of move tokens (reverse order, each token inverted). */
export function invertSequence(tokens: string[]): string[] {
  return tokens.slice().reverse().map(invertToken);
}
