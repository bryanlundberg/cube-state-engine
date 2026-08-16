// Derived sticker geometry: which stickers form each edge and corner, which
// faces are adjacent, and which face is opposite which.
//
// A facelet is displaced by a face turn iff it physically belongs to that face,
// so the SET of basic face turns that move a facelet identifies the cubie it
// sits on: 1 face => center, 2 faces => edge, 3 faces => corner. Grouping
// facelets by that signature reconstructs every edge/corner slot without any
// hardcoded layout, and stays correct for any matrix convention the engine uses.

import type {
  CubeSize,
  CubieSlot,
  FaceIndex,
  FaceLetter,
  Geometry,
} from "../types.js";
import { normalizeSize } from "../core/constants.js";
import { getMovePermutations } from "../core/permutations.js";
import { FACE_MOVE_TO_INDEX } from "./faces.js";

// Derived geometry is identical for every cube of a given size.
const GEOMETRY_CACHE = new Map<CubeSize, Geometry>();

/** Derives (and caches) the sticker adjacency of a cube of the given size. */
export function buildGeometry(size: CubeSize): Geometry {
  const cached = GEOMETRY_CACHE.get(size);
  if (cached) return cached;

  const perms = getMovePermutations(size);
  const per = size * size;
  const total = per * 6;
  const faceMoves = Object.keys(FACE_MOVE_TO_INDEX) as FaceLetter[];

  // signature[i] = sorted face indices whose quarter turn displaces sticker i.
  const edgeMap = new Map<string, number[]>(); // "a,b"   -> indices[]
  const cornerMap = new Map<string, number[]>(); // "a,b,c" -> indices[]
  for (let i = 0; i < total; i++) {
    const faces: FaceIndex[] = [];
    for (const mv of faceMoves) {
      if (perms[mv].cw[i] !== i) faces.push(FACE_MOVE_TO_INDEX[mv]);
    }
    faces.sort((a, b) => a - b);
    const key = faces.join(",");
    if (faces.length === 2) {
      if (!edgeMap.has(key)) edgeMap.set(key, []);
      edgeMap.get(key)!.push(i);
    } else if (faces.length === 3) {
      if (!cornerMap.has(key)) cornerMap.set(key, []);
      cornerMap.get(key)!.push(i);
    }
  }

  const toSlots = (map: Map<string, number[]>): CubieSlot[] =>
    [...map.entries()].map(([key, indices]) => ({
      faces: key.split(",").map(Number),
      indices,
    }));

  const edges = toSlots(edgeMap);
  const corners = toSlots(cornerMap);

  // Neighbor / opposite relationships between the six face positions. Two faces
  // are adjacent iff they share a cubie (edge OR corner); opposite faces never
  // share one. Deriving adjacency from corners as well as edges keeps this
  // correct on a 2x2 (which has no edge cubies at all).
  const neighbors: Set<FaceIndex>[] = Array.from({ length: 6 }, () => new Set());
  const mark = (faces: FaceIndex[]): void => {
    for (let i = 0; i < faces.length; i++) {
      for (let j = i + 1; j < faces.length; j++) {
        neighbors[faces[i]].add(faces[j]);
        neighbors[faces[j]].add(faces[i]);
      }
    }
  };
  for (const e of edges) mark(e.faces);
  for (const c of corners) mark(c.faces);

  const opposite: FaceIndex[] = new Array<FaceIndex>(6).fill(-1);
  for (let f = 0; f < 6; f++) {
    for (let g = 0; g < 6; g++) {
      if (g !== f && !neighbors[f].has(g)) {
        opposite[f] = g;
        break;
      }
    }
  }

  const geo: Geometry = {
    size,
    per,
    centerIndex: (f) => f * per + Math.floor(per / 2),
    edges,
    corners,
    neighbors,
    opposite,
    edgesByFace: (f) => edges.filter((e) => e.faces.includes(f)),
    cornersByFace: (f) => corners.filter((c) => c.faces.includes(f)),
    edgeByPair: (a, b) =>
      edges.find(
        (e) =>
          (e.faces[0] === a && e.faces[1] === b) ||
          (e.faces[0] === b && e.faces[1] === a)
      ),
  };

  GEOMETRY_CACHE.set(size, geo);
  return geo;
}

/**
 * Exposes the (cached) derived geometry for a given cube size.
 * @param size - 2 or 3 (defaults to 3).
 */
export function getCubeGeometry(size: number = 3): Geometry {
  return buildGeometry(normalizeSize(size));
}
