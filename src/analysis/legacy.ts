// Compatibility projection: the v1.x flat per-method fields, rebuilt from the
// method-agnostic `stages` list. Stage keys ARE the legacy field names, so this
// is a plain dispatch -- and a method that reports its own vocabulary simply
// projects onto nothing instead of being guessed at.
//
// Nothing here computes a milestone: it only renames and reshapes what
// `toStages` already timed, which is why the two views can never disagree.
// The whole file goes away in 2.0, when `stages` becomes the only shape.

import type {
  BlockRecord,
  Color,
  CrossRecord,
  F2LRecord,
  Stage,
  StageRecord,
} from "../types.js";

export interface LegacyFields {
  cross: CrossRecord | null;
  f2l: F2LRecord[];
  oll: StageRecord | null;
  pll: StageRecord | null;
  firstBlock: BlockRecord | null;
  secondBlock: BlockRecord | null;
  cmll: StageRecord | null;
  lse: StageRecord | null;
}

export function emptyLegacyFields(): LegacyFields {
  return {
    cross: null,
    f2l: [],
    oll: null,
    pll: null,
    firstBlock: null,
    secondBlock: null,
    cmll: null,
    lse: null,
  };
}

export function toLegacyFields(stages: Stage[]): LegacyFields {
  const out = emptyLegacyFields();
  for (const s of stages) {
    const record: StageRecord = {
      at: s.at,
      duration: s.duration,
      moveIndex: s.moveIndex,
      move: s.move,
    };
    switch (s.key) {
      // The cross and block milestones always carry their color in `meta`.
      case "cross":
        out.cross = { color: s.meta.color as Color, ...record };
        break;
      case "f2l":
        out.f2l.push({ slot: String(s.meta.slot), ...record });
        break;
      case "oll":
        out.oll = record;
        break;
      case "pll":
        out.pll = record;
        break;
      case "firstBlock":
        out.firstBlock = { side: s.meta.side as Color, ...record };
        break;
      case "secondBlock":
        out.secondBlock = { side: s.meta.side as Color, ...record };
        break;
      case "cmll":
        out.cmll = record;
        break;
      case "lse":
        out.lse = record;
        break;
      default:
        break;
    }
  }
  return out;
}
