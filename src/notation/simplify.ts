// Move-sequence simplifier.
//
// Connects consecutive IDENTICAL quarter turns into a single double turn
// (R R -> R2, F F -> F2, y y -> y2, R' R' -> R2). It does NOT cancel opposite
// moves: F F' stays exactly as F F', and U2 U2 stays as U2 U2 — no reduction
// to identity, no net-rotation folding. The only transformation is "join two
// equal quarter turns into their double".
//
// Accepts a space-separated string, an array of token strings, or an array of
// timed moves (`[{ m, t }]`); returns the same shape. When merging timed moves
// the resulting double keeps the SECOND move's timestamp (the instant the
// double turn finishes), so it composes cleanly with analyzeSolution.

import type { TimedMove } from "../types.js";

// Two tokens merge iff they are exactly equal AND are quarter turns (no "2").
// The merged token drops any prime and appends "2" (R'->R2, Rw->Rw2).
function canMerge(a: unknown, b: unknown): boolean {
  return typeof a === "string" && a === b && !a.includes("2");
}

function doubled(tok: string): string {
  return tok.replace("'", "") + "2";
}

// Core pass over plain token strings. A single left-to-right pass suffices:
// merging two quarters into a double can never create a new mergeable pair.
function simplifyTokens(tokens: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < tokens.length; ) {
    const a = tokens[i];
    const b = tokens[i + 1];
    if (i + 1 < tokens.length && canMerge(a, b)) {
      out.push(doubled(a));
      i += 2;
    } else {
      out.push(a);
      i += 1;
    }
  }
  return out;
}

// Same pass over timed moves, keeping the second move's timestamp on a merge.
function simplifyTimed(moves: TimedMove[]): TimedMove[] {
  const out: TimedMove[] = [];
  for (let i = 0; i < moves.length; ) {
    const a = moves[i];
    const b = moves[i + 1];
    if (i + 1 < moves.length && canMerge(a?.m, b?.m)) {
      out.push({ m: doubled(a.m), t: b.t });
      i += 2;
    } else {
      out.push(a);
      i += 1;
    }
  }
  return out;
}

/**
 * Simplifies a move sequence by joining consecutive identical quarter turns
 * into double turns, without cancelling opposite or redundant moves.
 *
 * @example
 * simplifyMoves("U R R D R' B");      // "U R2 D R' B"
 * simplifyMoves("F F'");              // "F F'"   (unchanged)
 * simplifyMoves("R R R");             // "R2 R"   (no cancellation)
 * simplifyMoves(["y'", "y'", "L"]);   // ["y2", "L"]
 */
export function simplifyMoves(moves: string): string;
export function simplifyMoves(moves: string[]): string[];
export function simplifyMoves(moves: TimedMove[]): TimedMove[];
export function simplifyMoves(
  moves: string | string[] | TimedMove[]
): string | string[] | TimedMove[] {
  if (typeof moves === "string") {
    const tokens = moves.split(/\s+/).filter((t) => t.length > 0);
    return simplifyTokens(tokens).join(" ");
  }
  if (Array.isArray(moves)) {
    if (moves.length === 0) return [];
    if (typeof moves[0] === "string") return simplifyTokens(moves as string[]);
    return simplifyTimed(moves as TimedMove[]);
  }
  return moves;
}
