// Roux staging: 1st block -> 2nd block -> CMLL -> LSE.

import type {
  CubieSlot,
  FaceIndex,
  FlatState,
  Geometry,
  Permutation,
  SolveMethod,
  Staging,
  StagingContext,
} from "../../types.js";
import { getMovePermutations } from "../../core/permutations.js";
import { centersOf, slotCorrect } from "../../predicates/flat.js";
import { cornersSolvedOnFace } from "../../predicates/stages.js";
import { firstIndexAfter } from "../milestones.js";

interface RouxBuild {
  firstSide: FaceIndex;
  secondSide: FaceIndex;
  upFace: FaceIndex;
  fbIdx: number;
  sbIdx: number;
  cmllIdx: number;
  lseIdx: number | null;
}

// The pieces of a Roux 1x2x3 block, parameterized by the block's side face and
// the up face (which fixes down = opposite[up]). The block holds the side
// center, the side's three edges that do NOT touch the up face, and the side's
// two corners that DO touch the down face. The center always matches itself, so
// only edges/corners need checking.
function rouxBlockPieces(
  geo: Geometry,
  sideFace: FaceIndex,
  upFace: FaceIndex
): { edges: CubieSlot[]; corners: CubieSlot[] } {
  const downFace = geo.opposite[upFace];
  const edges = geo
    .edgesByFace(sideFace)
    .filter((e) => !e.faces.includes(upFace));
  const corners = geo
    .cornersByFace(sideFace)
    .filter((c) => c.faces.includes(downFace));
  return { edges, corners };
}

// A Roux block is done when its three edges and two corners all match the
// centers. The block can be built while the slice between the two blocks is
// rotated away from the centers; that offset is handled by the caller, which
// evaluates each orientation against snapshots pre-rotated by a fixed slice
// amount (see the candidate enumeration). Keeping the offset FIXED per
// orientation -- rather than accepting any of the four rotations move-by-move --
// is what makes detection match how the solve was actually framed instead of
// firing on coincidental alignments.
function rouxBlockDone(
  st: FlatState,
  geo: Geometry,
  sideFace: FaceIndex,
  upFace: FaceIndex
): boolean {
  const { edges, corners } = rouxBlockPieces(geo, sideFace, upFace);
  if (edges.length !== 3 || corners.length !== 2) return false;
  const centers = centersOf(st, geo);
  return (
    edges.every((e) => slotCorrect(st, centers, e.indices, geo.per)) &&
    corners.every((c) => slotCorrect(st, centers, c.indices, geo.per))
  );
}

// Applies a permutation (out[i] = st[perm[i]]) to a flat sticker array.
function applyPerm(st: FlatState, perm: Permutation): FlatState {
  const out = new Array(st.length);
  for (let i = 0; i < st.length; i++) out[i] = st[perm[i]];
  return out;
}

// CMLL corners are done when the four corners touching the up face match the
// centers. As with the blocks, any fixed slice offset is applied by the caller
// via pre-rotated snapshots, so this is a plain match against the centers.
function cmllCornersDone(
  st: FlatState,
  geo: Geometry,
  upFace: FaceIndex
): boolean {
  return cornersSolvedOnFace(st, geo, upFace);
}

// Builds the Roux milestone indices for one (sideFace, upFace) orientation,
// using snapshots already pre-rotated by this orientation's fixed slice offset.
//
// Milestones are taken at FIRST achievement, not while a condition holds
// continuously: once a stage is reached the solver moves on, and on face-move
// Roux later stages routinely break and rebuild earlier ones (a CMLL alg breaks
// a block; a face-move LSE breaks everything). So:
//   1st block = first instant either side's block is built;
//   2nd block = first instant the OTHER side's block is built afterwards -- NOT
//               gated on the first block still being intact, which it often is
//               not while the second is being inserted;
//   CMLL      = first instant the last-layer corners are solved afterwards;
//   LSE       = the fully solved cube (`lseIdx`, computed once by the caller and
//               passed in, since "solved" is the same in every orientation).
function buildForRoux(
  snapshots: FlatState[],
  geo: Geometry,
  sideA: FaceIndex,
  upFace: FaceIndex,
  lseIdx: number | null
): RouxBuild | null {
  const sideB = geo.opposite[sideA];

  const aDone = snapshots.map((st) => rouxBlockDone(st, geo, sideA, upFace));
  const bDone = snapshots.map((st) => rouxBlockDone(st, geo, sideB, upFace));
  const aIdx = firstIndexAfter(aDone, -1);
  const bIdx = firstIndexAfter(bDone, -1);
  if (aIdx == null || bIdx == null) return null;

  // First block = the side built earliest; the other side is the second block.
  const aFirst = aIdx <= bIdx;
  const firstSide = aFirst ? sideA : sideB;
  const fbIdx = aFirst ? aIdx : bIdx;
  const sbIdx = firstIndexAfter(aFirst ? bDone : aDone, fbIdx);
  if (sbIdx == null) return null;

  const cornerBools = snapshots.map((st) => cmllCornersDone(st, geo, upFace));
  const cmllIdx = firstIndexAfter(cornerBools, sbIdx);
  if (cmllIdx == null) return null;

  return {
    firstSide,
    secondSide: aFirst ? sideB : sideA,
    upFace,
    fbIdx,
    sbIdx,
    cmllIdx,
    lseIdx,
  };
}

// Shortest plausible length (in moves) of a genuine Roux stage. The block and
// corner conditions flicker true at scattered transient instants throughout a
// solve; a "stage" only a move or two long is one of those coincidences, not a
// real second block or CMLL. Requiring a minimum span rejects them so a spurious
// orientation cannot masquerade as a clean Roux staging.
const ROUX_MIN_STAGE = 5;

// Does this breakdown follow the Roux order: 1st block -> 2nd block -> CMLL -> LSE?
function isRoux(build: RouxBuild): boolean {
  const { fbIdx, sbIdx, cmllIdx, lseIdx } = build;
  if (fbIdx == null || sbIdx == null || cmllIdx == null || lseIdx == null)
    return false;
  if (!(fbIdx < sbIdx && sbIdx < cmllIdx && cmllIdx < lseIdx)) return false;
  return sbIdx - fbIdx >= ROUX_MIN_STAGE && cmllIdx - sbIdx >= ROUX_MIN_STAGE;
}

export const roux: SolveMethod = {
  name: "Roux",

  // Stage the solve on every orientation. A candidate fixes a side face, a
  // perpendicular up face, and a slice offset `d`: the blocks can be assembled
  // with the slice between them turned away from the centers, so each
  // orientation is tested against snapshots pre-rotated by d quarter-turns of
  // its axis slice (M for L/R blocks, E for U/D, S for F/B). Holding that offset
  // fixed for the whole solve (rather than re-matching it move-by-move) is what
  // stops a block reading as "built" on a coincidental alignment.
  //
  // Many orientations still yield a technically ordered staging. The one that
  // reflects the real solve is the one whose three build milestones land
  // EARLIEST in aggregate (smallest fb + sb + cmll): a false orientation only
  // assembles its blocks and corners by coincidence, which does not happen
  // earlier than the genuine build. (isRoux discards orientations whose stages
  // are too short to be anything but a coincidence.) "Solved" is orientation-
  // independent, so the LSE index is shared from the context.
  stage(ctx: StagingContext): Staging | null {
    const { size, snapshots, geo, finalCenters, solvedIdx } = ctx;

    const perms = getMovePermutations(size);
    const sliceCwOf = (face: FaceIndex): Permutation => {
      if (face === 1 || face === 3) return perms["M"].cw; // L/R axis
      if (face === 0 || face === 5) return perms["E"].cw; // U/D axis
      return perms["S"].cw; // F/B axis
    };

    // Snapshots rotated by d quarter-turns of a given slice, built incrementally
    // and cached so each (axis, d) is computed once and reused across its up faces.
    const rotCache = new Map<string, FlatState[]>();
    const rotatedSnaps = (sliceCw: Permutation, d: number): FlatState[] => {
      const key = `${sliceCw}:${d}`;
      const cached = rotCache.get(key);
      if (cached) return cached;
      const snaps =
        d === 0
          ? snapshots
          : rotatedSnaps(sliceCw, d - 1).map((st) => applyPerm(st, sliceCw));
      rotCache.set(key, snaps);
      return snaps;
    };

    const candidates: RouxBuild[] = [];
    for (let s = 0; s < 6; s++) {
      const sliceCw = sliceCwOf(s);
      for (const u of geo.neighbors[s]) {
        for (let d = 0; d < 4; d++) {
          const build = buildForRoux(
            rotatedSnaps(sliceCw, d),
            geo,
            s,
            u,
            solvedIdx
          );
          if (build) candidates.push(build);
        }
      }
    }

    const build =
      candidates
        .filter((b) => isRoux(b))
        .sort(
          (a, b) =>
            a.fbIdx + a.sbIdx + a.cmllIdx - (b.fbIdx + b.sbIdx + b.cmllIdx)
        )[0] ?? null;
    if (!build) return null;

    return {
      valid: true,
      firstIdx: build.fbIdx,
      startFace: build.firstSide,
      milestones: [
        {
          key: "firstBlock",
          label: "First block",
          idx: build.fbIdx,
          meta: { side: finalCenters[build.firstSide] },
        },
        {
          key: "secondBlock",
          label: "Second block",
          idx: build.sbIdx,
          meta: { side: finalCenters[build.secondSide] },
        },
        { key: "cmll", label: "CMLL", idx: build.cmllIdx },
        { key: "lse", label: "LSE", idx: build.lseIdx },
      ],
    };
  },
};
