// Permutation tables, derived once per cube size and shared by every instance.

import type {
  CubeSize,
  MoveKey,
  MovePermutations,
  Permutation,
} from "../types.js";
import { normalizeSize } from "./constants.js";
import { MOVE_FNS, OracleCube, type OracleRotation } from "./oracle.js";

const PERM_CACHE = new Map<CubeSize, MovePermutations>();

/** Builds a single move's permutation by applying it to a tagged oracle cube. */
function buildPerm(
  size: CubeSize,
  fnName: OracleRotation,
  clockwise: boolean
): Permutation {
  const oracle = new OracleCube(size);
  oracle[fnName](clockwise);
  return oracle.flatten();
}

/** Builds (and caches) the full clockwise/counterclockwise set for a size. */
function getPerms(size: CubeSize): MovePermutations {
  const cached = PERM_CACHE.get(size);
  if (cached) return cached;

  const perms = {} as MovePermutations;
  for (const key of Object.keys(MOVE_FNS) as MoveKey[]) {
    perms[key] = {
      cw: buildPerm(size, MOVE_FNS[key], true),
      ccw: buildPerm(size, MOVE_FNS[key], false),
    };
  }
  PERM_CACHE.set(size, perms);
  return perms;
}

/**
 * Exposes the (cached) permutation tables for a given cube size.
 *
 * Each entry maps a move key to `{ cw, ccw }` permutation arrays such that
 * `newState[i] = oldState[perm[i]]`. This is primarily an advanced/introspection
 * helper: the geometry is derived from it, so the cube's sticker adjacency
 * (which stickers form each edge/corner) is never hardcoded.
 */
export function getMovePermutations(size: number = 3): MovePermutations {
  return getPerms(normalizeSize(size));
}

/** Internal entry point that skips size coercion. */
export { getPerms };
