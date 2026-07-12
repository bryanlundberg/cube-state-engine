import { CubeEngine } from "../src/index.js";
import {
  getCubeGeometry,
  isCubeSolved,
  isLastLayerOriented,
  areLastLayerCornersSolved,
  isCrossComplete,
  isF2LComplete,
  matchesGoal,
} from "../src/predicates.js";

// Solved-cube color layout: U=W L=O F=G R=R B=B D=Y.
// Builds an engine in a known state by applying `alg` to a solved cube.
function at(alg, size = 3) {
  const e = new CubeEngine("", { size });
  if (alg) e.applyMoves(alg, { record: false });
  return e;
}

// Well-known last-layer-only algorithms (verified in exploration):
//   U        -> LL oriented, corners NOT permuted (a bare AUF)
//   Ua perm  -> LL oriented + corners solved, edges 3-cycled (an OLL+CP state)
//   Sune     -> LL NOT oriented, F2L intact
//   T perm   -> LL oriented, corners permuted away (oriented, not CP)
const ALG_U = "U";
const ALG_UA = "R U' R U R U R U' R' U' R2";
const ALG_SUNE = "R U R' U R U2 R'";
const ALG_TPERM = "R U R' U' R' F R2 U' R' U' R U R' F'";

describe("getCubeGeometry", () => {
  test("derives correct opposite faces for 3x3 and 2x2", () => {
    // U<->D (0,5), L<->R (1,3), F<->B (2,4).
    const expected = [5, 3, 4, 1, 2, 0];
    expect(getCubeGeometry(3).opposite).toEqual(expected);
    expect(getCubeGeometry(2).opposite).toEqual(expected);
  });

  test("reports piece counts per size", () => {
    const g3 = getCubeGeometry(3);
    expect(g3.per).toBe(9);
    expect(g3.edges).toHaveLength(12);
    expect(g3.corners).toHaveLength(8);

    const g2 = getCubeGeometry(2);
    expect(g2.per).toBe(4);
    expect(g2.edges).toHaveLength(0); // a 2x2 has no edge cubies
    expect(g2.corners).toHaveLength(8);
  });

  test("clamps unsupported sizes to 3", () => {
    expect(getCubeGeometry(5).per).toBe(9);
    expect(getCubeGeometry().per).toBe(9);
  });
});

describe("input flexibility", () => {
  test("engine, state() object, and flat array agree", () => {
    const e = at(ALG_SUNE);
    const state = e.state();
    const flat = [];
    for (const name of ["UPPER", "LEFT", "FRONT", "RIGHT", "BACK", "DOWN"]) {
      for (const row of state[name]) for (const v of row) flat.push(v);
    }
    for (const input of [e, state, flat]) {
      expect(isLastLayerOriented(input)).toBe(false);
      expect(isF2LComplete(input)).toBe(true);
    }
  });

  test("rejects unsupported input", () => {
    expect(() => isCubeSolved(42)).toThrow(TypeError);
  });
});

describe("3x3 predicates on known states", () => {
  test("solved cube satisfies every predicate", () => {
    const e = at("");
    expect(isCubeSolved(e)).toBe(true);
    expect(isLastLayerOriented(e)).toBe(true);
    expect(areLastLayerCornersSolved(e)).toBe(true);
    expect(isCrossComplete(e)).toBe(true);
    expect(isF2LComplete(e)).toBe(true);
  });

  test("bare AUF (U): oriented, corners not permuted, F2L intact", () => {
    const e = at(ALG_U);
    expect(isCubeSolved(e)).toBe(false);
    expect(isLastLayerOriented(e)).toBe(true);
    expect(areLastLayerCornersSolved(e)).toBe(false);
    expect(isF2LComplete(e)).toBe(true);
    expect(isCrossComplete(e)).toBe(true); // bottom (D) cross untouched
  });

  test("Ua perm: oriented AND corners solved, but not fully solved", () => {
    const e = at(ALG_UA);
    expect(isCubeSolved(e)).toBe(false);
    expect(isLastLayerOriented(e)).toBe(true);
    expect(areLastLayerCornersSolved(e)).toBe(true);
    expect(isF2LComplete(e)).toBe(true);
  });

  test("Sune: F2L done but last layer not oriented", () => {
    const e = at(ALG_SUNE);
    expect(isLastLayerOriented(e)).toBe(false);
    expect(areLastLayerCornersSolved(e)).toBe(false);
    expect(isF2LComplete(e)).toBe(true);
    expect(isCrossComplete(e)).toBe(true);
  });

  test("T perm: oriented but corners permuted away", () => {
    const e = at(ALG_TPERM);
    expect(isLastLayerOriented(e)).toBe(true);
    expect(areLastLayerCornersSolved(e)).toBe(false);
  });

  test("a single R breaks the cross and F2L", () => {
    const e = at("R");
    expect(isCrossComplete(e)).toBe(false);
    expect(isF2LComplete(e)).toBe(false);
    expect(isLastLayerOriented(e)).toBe(false);
  });

  test("face option targets a specific face", () => {
    const e = at(ALG_U); // U moved; D face still uniform
    expect(isLastLayerOriented(e, { face: "D" })).toBe(true);
    expect(isLastLayerOriented(e, { face: "U" })).toBe(true);
  });

  test("isCrossComplete honors an explicit color", () => {
    const e = at(ALG_U);
    expect(isCrossComplete(e, { color: "Y" })).toBe(true); // bottom cross
    expect(isCrossComplete(e, { color: "W" })).toBe(false); // top edges rotated by U
  });
});

describe("matchesGoal dispatcher", () => {
  test("string goals", () => {
    expect(matchesGoal(at(""), "full")).toBe(true);
    expect(matchesGoal(at(""), "solved")).toBe(true);
    expect(matchesGoal(at(ALG_U), "full")).toBe(false);
    expect(matchesGoal(at(ALG_U), "oll")).toBe(true);
    expect(matchesGoal(at(ALG_U), "oll+cp")).toBe(false);
    expect(matchesGoal(at(ALG_UA), "oll+cp")).toBe(true);
    expect(matchesGoal(at(ALG_SUNE), "oll")).toBe(false);
    expect(matchesGoal(at(ALG_SUNE), "f2l")).toBe(true);
    expect(matchesGoal(at(""), "cross")).toBe(true);
  });

  test("defaults to full solve", () => {
    expect(matchesGoal(at(""))).toBe(true);
    expect(matchesGoal(at(ALG_U))).toBe(false);
  });

  test("object spec with parameters", () => {
    expect(matchesGoal(at(ALG_U), { goal: "oll", face: "U" })).toBe(true);
    expect(matchesGoal(at(ALG_U), { goal: "cross", color: "Y" })).toBe(true);
    expect(matchesGoal(at(ALG_U), { goal: "cross", color: "W" })).toBe(false);
  });

  test("custom predicate escape hatch (function or object.custom)", () => {
    expect(matchesGoal(at(""), (e) => e.isSolved())).toBe(true);
    expect(matchesGoal(at(ALG_U), { custom: (e) => e.isSolved() })).toBe(false);
  });

  test("unknown goal throws", () => {
    expect(() => matchesGoal(at(""), "banana")).toThrow(/Unknown goal/);
  });
});

describe("2x2 predicates", () => {
  test("solved 2x2", () => {
    const e = at("", 2);
    expect(isCubeSolved(e)).toBe(true);
    expect(isLastLayerOriented(e)).toBe(true);
    expect(areLastLayerCornersSolved(e)).toBe(true);
  });

  test("U keeps top oriented but unsolves corners", () => {
    const e = at("U", 2);
    expect(isCubeSolved(e)).toBe(false);
    expect(isLastLayerOriented(e)).toBe(true);
    expect(areLastLayerCornersSolved(e)).toBe(false);
  });

  test("R disturbs top orientation", () => {
    const e = at("R", 2);
    expect(isLastLayerOriented(e)).toBe(false);
  });

  test("matchesGoal 'full' works on 2x2", () => {
    expect(matchesGoal(at("", 2), "full")).toBe(true);
    expect(matchesGoal(at("U R", 2), "full")).toBe(false);
  });

  test("F2L is not a meaningful goal on 2x2 (no edges)", () => {
    // A 2x2 has no edge cubies, so F2L never reports complete.
    expect(isF2LComplete(at("", 2))).toBe(false);
  });
});
