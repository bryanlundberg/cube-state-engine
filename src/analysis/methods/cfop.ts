// CFOP staging: cross -> four F2L pairs -> OLL -> PLL.

import type {
  Color,
  FlatState,
  Geometry,
  Milestone,
  SolveMethod,
  Staging,
  StagingContext,
} from "../../types.js";
import { crossDone, f2lSlotStates, ollDone } from "../../predicates/stages.js";
import { completionIndex } from "../milestones.js";

interface CrossBuild {
  crossIdx: number | null;
  f2lSlots: Array<{ slot: string; idx: number }>;
  ollIdx: number | null;
  pllIdx: number | null;
}

// Builds the milestone indices for one assumed cross color. Detection is
// cumulative: an F2L pair only counts while the cross is solved, and OLL only
// counts once the full F2L is solved. This rejects transient false positives.
// `solvedIdx` (the fully solved cube) doubles as the PLL milestone.
function buildForCross(
  snapshots: FlatState[],
  geo: Geometry,
  color: Color,
  solvedIdx: number | null
): CrossBuild {
  const n = snapshots.length;
  const crossBools = snapshots.map((st) => crossDone(st, geo, color));
  const crossIdx = completionIndex(crossBools);

  // Per-slot completion, gated by the cross being solved at the same instant.
  const slotSeries = new Map<string, boolean[]>();
  for (let i = 0; i < n; i++) {
    const states = f2lSlotStates(snapshots[i], geo, color);
    for (const [key, val] of Object.entries(states)) {
      if (!slotSeries.has(key)) slotSeries.set(key, new Array(n).fill(false));
      slotSeries.get(key)![i] = crossBools[i] && val;
    }
  }
  const f2lSlots = [...slotSeries.entries()]
    .map(([slot, bools]) => ({ slot, idx: completionIndex(bools) }))
    .filter((s): s is { slot: string; idx: number } => s.idx != null)
    .sort((a, b) => a.idx - b.idx);

  // Full F2L solved = cross plus all four pairs solved at the same instant.
  const f2lComplete = new Array<boolean>(n).fill(false);
  for (let i = 0; i < n; i++) {
    if (!crossBools[i] || slotSeries.size < 4) continue;
    let all = true;
    for (const bools of slotSeries.values()) {
      if (!bools[i]) {
        all = false;
        break;
      }
    }
    f2lComplete[i] = all;
  }

  // OLL is only meaningful once F2L is done (last layer oriented on top of it).
  const ollIdx = completionIndex(
    snapshots.map((st, i) => f2lComplete[i] && ollDone(st, geo, color))
  );

  return { crossIdx, f2lSlots, ollIdx, pllIdx: solvedIdx };
}

// Does this breakdown follow the CFOP order: cross -> 4x F2L -> OLL -> PLL?
function isCFOP(build: CrossBuild): boolean {
  const { crossIdx, f2lSlots, ollIdx, pllIdx } = build;
  if (crossIdx == null || pllIdx == null || ollIdx == null) return false;
  if (f2lSlots.length !== 4) return false;
  if (!f2lSlots.every((s) => s.idx >= crossIdx)) return false;
  const lastF2L = f2lSlots[3].idx;
  return ollIdx >= lastF2L && pllIdx >= ollIdx;
}

export const cfop: SolveMethod = {
  name: "CFOP",

  // The cross can complete on any of the six faces, so every color is staged
  // and the one that yields a valid CFOP ordering wins. When none does, the
  // earliest cross is still reported as a best-effort breakdown (the analyzer
  // labels the method "unknown" in that case).
  stage(ctx: StagingContext): Staging | null {
    const { snapshots, geo, finalCenters, solvedIdx } = ctx;
    const colors = [...new Set(finalCenters)];
    if (colors.length === 0) return null;

    const ordered = colors
      .map((color) => ({
        color,
        build: buildForCross(snapshots, geo, color, solvedIdx),
      }))
      .sort((a, b) => {
        const ai = a.build.crossIdx ?? Infinity;
        const bi = b.build.crossIdx ?? Infinity;
        return ai - bi;
      });

    const { color, build } = ordered.find((c) => isCFOP(c.build)) ?? ordered[0];

    const milestones: Milestone[] = [
      { key: "cross", label: "Cross", idx: build.crossIdx, meta: { color } },
      ...build.f2lSlots.map((s) => ({
        key: "f2l",
        label: `F2L ${s.slot}`,
        idx: s.idx,
        meta: { slot: s.slot },
      })),
      { key: "oll", label: "OLL", idx: build.ollIdx },
      { key: "pll", label: "PLL", idx: build.pllIdx },
    ];

    return {
      valid: isCFOP(build),
      firstIdx: build.crossIdx,
      startFace: build.crossIdx == null ? null : finalCenters.indexOf(color),
      milestones,
    };
  },
};
