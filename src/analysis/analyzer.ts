// Solution analyzer: replays a recorded solve move-by-move, asks every
// registered method to stage it, and reports the timing of the winning
// staging's milestones.
//
// This file is only the orchestrator. The pieces live next to it:
//   replay.ts     - tokens -> cube snapshots (and the derived scramble)
//   milestones.ts - completion indices -> timed, duration-chained stages
//   legacy.ts     - projection onto the v1.x per-method fields
//   methods/      - one staging strategy per solving method (CFOP, Roux, ...)
//
// All milestone checks compare each sticker against the CURRENT center of its
// face, so detection is invariant to whole-cube rotations (x/y/z) and wide
// moves that may appear in real speedsolves.

import type {
  CrossTime,
  CubeSize,
  SolveAnalysis,
  StagingContext,
  TimedMove,
} from "../types.js";
import { FACE_LETTERS } from "../geometry/faces.js";
import { crossDone } from "../predicates/stages.js";
import { isSolvedFlat } from "../predicates/flat.js";
import { buildReplay } from "./replay.js";
import { completionIndex, toStages } from "./milestones.js";
import { emptyLegacyFields, toLegacyFields } from "./legacy.js";
import { listMethods } from "./methods/index.js";

/**
 * When the cross completed on every face color, independent of the method that
 * was actually used (a Roux solve still reports the six times).
 */
function crossTimesByColor(ctx: StagingContext): Record<string, CrossTime | null> {
  const { snapshots, geo, seq, finalCenters } = ctx;
  const out: Record<string, CrossTime | null> = {};
  for (const color of new Set(finalCenters)) {
    const idx = completionIndex(
      snapshots.map((st) => crossDone(st, geo, color))
    );
    out[color] =
      idx == null ? null : { at: seq[idx].t, moveIndex: idx, move: seq[idx].m };
  }
  return out;
}

/**
 * Analyzes a solution and returns the timing of each method milestone.
 *
 * @param moves - Solution moves with cumulative timestamps. `m` is a move
 *   token; `t` is elapsed ms up to that move.
 * @param options - Cube size (defaults to 3). Method staging is only computed
 *   for 3x3; other sizes report the solved (PLL) time only.
 *
 * Read `stages` for the breakdown: it is the same shape whatever the method.
 * The per-method fields (`cross`/`f2l`/`oll`/`pll`, `firstBlock`/`secondBlock`/
 * `cmll`/`lse`) are a deprecated projection of it and go away in 2.0.
 */
export function analyzeSolution(
  moves: TimedMove[],
  options: { size?: CubeSize } = {}
): SolveAnalysis {
  const replay = buildReplay(moves, { size: options.size });
  const { size, seq, n, geo, snapshots, simplifiedMoves, unsupported } = replay;

  const total = n > 0 ? seq[n - 1].t : 0;
  const report = (extra: Partial<SolveAnalysis> = {}): SolveAnalysis => ({
    size,
    method: "unknown",
    solved: replay.solved,
    total,
    tps: total > 0 ? simplifiedMoves.length / (total / 1000) : 0,
    moves: simplifiedMoves,
    stages: [],
    ...emptyLegacyFields(),
    startFace: null,
    allCrosses: {},
    unsupported,
    ...extra,
  });

  if (n === 0) return report();

  // The fully solved cube: PLL for CFOP, LSE for Roux, and the only milestone
  // that means anything on a non-3x3. Computed once and shared with every
  // strategy through the context.
  const solvedIdx = completionIndex(
    snapshots.map((st) => isSolvedFlat(st, geo.per))
  );
  const ctx: StagingContext = { ...replay, solvedIdx };

  // Non-3x3: no method staging, only the solved milestone.
  if (size !== 3) {
    const stages = toStages(seq, [{ key: "pll", label: "PLL", idx: solvedIdx }]);
    return report({ stages, ...toLegacyFields(stages) });
  }

  // Every method stages the solve; only the ones that genuinely fit compete.
  // A solved cube satisfies many orderings, so two stagings can both be valid.
  // Disambiguate by which method's FIRST milestone is genuinely reached early:
  // a real CFOP cross is built up front, whereas on a Roux solve no cross
  // completes until LSE; conversely a full 1x2x3 block only forms mid-CFOP. The
  // structure that actually happened owns the earlier first milestone; ties go
  // to whichever method was registered first.
  const staged = listMethods()
    .map((method) => ({ method, staging: method.stage(ctx) }))
    .filter((c) => c.staging != null);

  const winner = staged
    .filter((c) => c.staging!.valid)
    .sort(
      (a, b) =>
        (a.staging!.firstIdx ?? Infinity) - (b.staging!.firstIdx ?? Infinity)
    )[0];

  // No method fits: fall back to the first-registered method's best-effort
  // breakdown, reported under an "unknown" label.
  const chosen = winner ?? staged[0];
  if (!chosen) return report({ allCrosses: crossTimesByColor(ctx) });

  const stages = toStages(seq, chosen.staging!.milestones);
  const faceIdx = chosen.staging!.startFace;

  return report({
    method: winner ? winner.method.name : "unknown",
    stages,
    ...toLegacyFields(stages),
    // The face the solve was started from, expressed the same way for every
    // method: the cross face for CFOP, the first block's side face for Roux. It
    // is read off the FINAL orientation (rotations during the solve do not
    // change which face that color ends up on), so `face` is always one of
    // U/L/F/R/B/D and `color` is that face's center color.
    startFace:
      faceIdx == null || faceIdx < 0
        ? null
        : { face: FACE_LETTERS[faceIdx], color: replay.finalCenters[faceIdx] },
    allCrosses: crossTimesByColor(ctx),
  });
}
