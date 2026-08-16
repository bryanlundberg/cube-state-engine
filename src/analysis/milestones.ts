// Milestones: turning a boolean series ("was this stage done after move i?")
// into a completion index, and a list of completion indices into timed stages.
//
// Every staging strategy speaks this vocabulary, so the timing rules live here
// once instead of being re-derived per method.

import type { Milestone, ParsedMove, Stage } from "../types.js";

/**
 * Index of the move that COMPLETES a stage: the first move after which the
 * condition holds, provided the stage is genuinely achieved by the end of the
 * solve. Later moves are allowed to break it transiently (a turn mid-algorithm
 * momentarily disturbs an already-finished cross/pair), which is why we take
 * the first occurrence rather than requiring it to hold continuously.
 */
export function completionIndex(bools: boolean[]): number | null {
  const n = bools.length;
  if (n === 0 || !bools[n - 1]) return null;
  for (let i = 0; i < n; i++) if (bools[i]) return i;
  return null;
}

/**
 * Index of the FIRST move strictly after `after` at which the condition holds.
 * Used for a stage whose completion is "the first time X happens once the
 * previous stage is done" -- e.g. the last-layer corners getting solved after
 * the second block is built, even if the blocks are momentarily disturbed at
 * that instant. Returns null if `after` is null or the condition never holds.
 */
export function firstIndexAfter(
  bools: boolean[],
  after: number | null
): number | null {
  if (after == null) return null;
  for (let i = after + 1; i < bools.length; i++) {
    if (bools[i]) return i;
  }
  return null;
}

/**
 * Turns a strategy's milestones into timed stages, chaining each duration from
 * the previous stage that was actually reached. Milestones with no completion
 * index are dropped, so a missing stage passes its predecessor's time straight
 * through to the next one instead of resetting the chain.
 */
export function toStages(seq: ParsedMove[], milestones: Milestone[]): Stage[] {
  const stages: Stage[] = [];
  let prevAt = 0;
  for (const ms of milestones) {
    if (ms?.idx == null) continue;
    const at = seq[ms.idx].t;
    stages.push({
      key: ms.key,
      label: ms.label,
      at,
      duration: at - prevAt,
      moveIndex: ms.idx,
      move: seq[ms.idx].m,
      meta: ms.meta ?? {},
    });
    prevAt = at;
  }
  return stages;
}
