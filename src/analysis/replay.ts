// Replay: everything derived from a recorded solution BEFORE any method
// staging happens -- token normalization, the scramble, and one flat cube
// snapshot after every move.
//
// Input is the solution as `[{ m, t }]` where `m` is a move token in the same
// notation the engine accepts (e.g. "R", "U'", "R2", "x", "M'") and `t` is the
// CUMULATIVE elapsed time (ms) up to and including that move. The scramble is
// not required: it is derived as the inverse of the solution.

import type {
  CubeSize,
  ParsedMove,
  ReplayContext,
  TimedMove,
} from "../types.js";
import { CubeEngine } from "../core/engine.js";
import { normalizeSize } from "../core/constants.js";
import { buildGeometry } from "../geometry/geometry.js";
import { simplifyMoves } from "../notation/simplify.js";
import {
  invertSequence,
  normalizeToken,
  SUPPORTED_BASES,
} from "../notation/tokens.js";
import { centersOf, flattenState, isSolvedFlat } from "../predicates/flat.js";

/**
 * Parses a recorded solution and replays it, capturing the cube state after
 * every move. This is the shared input every staging strategy reads.
 *
 * @param moves - Solution moves with cumulative timestamps.
 * @param options - Cube size (2 or 3, defaults to 3).
 */
export function buildReplay(
  moves: TimedMove[],
  { size = 3 }: { size?: CubeSize } = {}
): ReplayContext {
  const cubeSize = normalizeSize(size);
  const list = Array.isArray(moves) ? moves : [];

  // Keep both the original token (`m`, for display) and the engine-normalized
  // token (`mm`, used for replay). Collect anything we cannot parse so the
  // caller can see dropped moves instead of getting silently wrong timings.
  const unsupported: string[] = [];
  const seq: ParsedMove[] = list
    .map((x) => {
      const m = String(x?.m ?? "").trim();
      const { token, base } = normalizeToken(m);
      const supported = base != null && SUPPORTED_BASES.has(base);
      if (m.length > 0 && !supported) unsupported.push(m);
      return { m, mm: supported ? token : "", t: Number(x?.t) };
    })
    .filter((x) => x.m.length > 0);
  const n = seq.length;

  const simplifiedMoves = simplifyMoves(list.filter((x) => x?.m));
  const geo = buildGeometry(cubeSize);

  const base: ReplayContext = {
    size: cubeSize,
    seq,
    n,
    geo,
    snapshots: [],
    finalCenters: [],
    solved: false,
    simplifiedMoves,
    unsupported,
  };
  if (n === 0) return base;

  // Reproduce the scramble (inverse of the solution), then replay forward,
  // capturing a flat snapshot after every solution move. Unsupported tokens
  // contribute no move (mm === "") so the replay simply skips them.
  const engine = new CubeEngine("", { size: cubeSize });
  const scramble = invertSequence(seq.map((x) => x.mm).filter(Boolean)).join(" ");
  engine.applyMoves(scramble, { record: false });

  const snapshots = new Array(n);
  for (let i = 0; i < n; i++) {
    if (seq[i].mm) engine.applyMoves(seq[i].mm, { record: false });
    snapshots[i] = flattenState(engine.state());
  }

  return {
    ...base,
    snapshots,
    finalCenters: centersOf(snapshots[n - 1], geo),
    solved: isSolvedFlat(snapshots[n - 1], geo.per),
  };
}
