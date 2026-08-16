import {
  CubeEngine,
  analyzeSolution,
  invertSequence,
  centersOf,
  flattenState,
  getCubeGeometry,
} from "../src/index.js";
import cfop1 from "./cfop-1.json";
import cfop2 from "./cfop-2.json";
import roux1 from "./roux-1.json";
import roux2 from "./roux-2.json";
import roux3 from "./roux-3.json";
import roux4 from "./roux-4.json";

// Builds a `[{ m, t }]` solution from a token array, assigning each move a
// cumulative timestamp (200ms per move by default).
function timed(tokens, step = 200) {
  return tokens.map((m, i) => ({ m, t: (i + 1) * step }));
}

describe("invertSequence", () => {
  test("reverses order and inverts each token", () => {
    expect(invertSequence(["R", "U'", "F2"])).toEqual(["F2", "U", "R'"]);
  });

  test("a sequence followed by its inverse solves the cube", () => {
    const tokens = "R U R' U' F2 D' L".split(" ");
    const cube = new CubeEngine();
    cube.applyMoves(tokens.join(" "));
    cube.applyMoves(invertSequence(tokens).join(" "));
    expect(cube.isSolved()).toBe(true);
  });
});

describe("analyzeSolution - basics", () => {
  test("empty solution returns zeroed breakdown", () => {
    const out = analyzeSolution([]);
    expect(out.total).toBe(0);
    expect(out.cross).toBeNull();
    expect(out.f2l).toEqual([]);
    expect(out.pll).toBeNull();
  });

  test("any inverse-of-scramble solution ends solved with PLL at the last move", () => {
    const scramble = "R U2 F' L D B R' U F2 D'".split(" ");
    const solution = invertSequence(scramble); // guaranteed to solve
    const out = analyzeSolution(timed(solution));

    // Terminal milestone is PLL (CFOP) or LSE (Roux), depending on detection.
    const finalStage = out.pll ?? out.lse;
    expect(out.solved).toBe(true);
    expect(finalStage).not.toBeNull();
    expect(finalStage.moveIndex).toBe(solution.length - 1);
    expect(finalStage.at).toBe(out.total);
  });

  test("every face cross is complete by the end of a solving sequence", () => {
    const scramble = "F R U' L2 D B2 R' U2".split(" ");
    const solution = invertSequence(scramble);
    const out = analyzeSolution(timed(solution));

    const finalStage = out.pll ?? out.lse;
    const colors = Object.keys(out.allCrosses);
    expect(colors.length).toBe(6);
    for (const color of colors) {
      expect(out.allCrosses[color]).not.toBeNull();
      expect(out.allCrosses[color].moveIndex).toBeLessThanOrEqual(
        finalStage.moveIndex
      );
    }
  });

  test("milestones are ordered and the chosen cross precedes solve", () => {
    const scramble = "U R2 F B' D2 L F' U2 R D".split(" ");
    const solution = invertSequence(scramble);
    const out = analyzeSolution(timed(solution));

    if (out.cross) {
      expect(out.cross.moveIndex).toBeLessThanOrEqual(out.pll.moveIndex);
    }
    for (const pair of out.f2l) {
      expect(pair.moveIndex).toBeLessThanOrEqual(out.pll.moveIndex);
    }
  });
});

describe("analyzeSolution - staged CFOP solve", () => {
  // Builds a genuinely staged solve by undoing real CFOP phases from solved
  // (cross-preserving F2L triggers + real OLL/PLL algs), then inverting. The
  // resulting solution finishes the cross, then four pairs, then OLL, then PLL.
  const phases = {
    cross: "F2 D R2",
    pair1: "R U R'",
    pair2: "L' U' L",
    pair3: "R U' R'",
    pair4: "y L' U L",
    oll: "R U R' U R U2 R'", // Sune
    pll: "R U R' U' R' F R2 U' R' U' R U R' F'", // T-perm
  };
  const scrambleTokens = [
    ...invertSequence(phases.pll.split(" ")),
    ...invertSequence(phases.oll.split(" ")),
    ...invertSequence(phases.pair4.split(" ")),
    ...invertSequence(phases.pair3.split(" ")),
    ...invertSequence(phases.pair2.split(" ")),
    ...invertSequence(phases.pair1.split(" ")),
    ...invertSequence(phases.cross.split(" ")),
  ];
  const solution = invertSequence(scrambleTokens);

  test("classifies the solve as CFOP", () => {
    const out = analyzeSolution(timed(solution));
    expect(out.method).toBe("CFOP");
    expect(out.solved).toBe(true);
  });

  test("reports all seven CFOP milestones in order", () => {
    const out = analyzeSolution(timed(solution));
    expect(out.cross).not.toBeNull();
    expect(out.f2l).toHaveLength(4);
    expect(out.oll).not.toBeNull();
    expect(out.pll).not.toBeNull();

    // Strictly non-decreasing completion indices: cross <= f2l* <= oll <= pll.
    expect(out.cross.moveIndex).toBeLessThanOrEqual(out.f2l[0].moveIndex);
    for (let i = 1; i < out.f2l.length; i++) {
      expect(out.f2l[i - 1].moveIndex).toBeLessThanOrEqual(out.f2l[i].moveIndex);
    }
    expect(out.f2l[3].moveIndex).toBeLessThanOrEqual(out.oll.moveIndex);
    expect(out.oll.moveIndex).toBeLessThanOrEqual(out.pll.moveIndex);
  });

  test("stage durations are consistent with cumulative timestamps", () => {
    const out = analyzeSolution(timed(solution, 150));
    // Each stage duration equals its `at` minus the previous stage's `at`.
    expect(out.cross.duration).toBe(out.cross.at);
    let prev = out.cross.at;
    for (const pair of out.f2l) {
      expect(pair.duration).toBe(pair.at - prev);
      prev = pair.at;
    }
    expect(out.oll.duration).toBe(out.oll.at - prev);
    expect(out.pll.duration).toBe(out.pll.at - out.oll.at);
  });

  test("timestamps map straight through (t is cumulative)", () => {
    const moves = timed(invertSequence("R U F".split(" ")), 500);
    const out = analyzeSolution(moves);
    expect(out.total).toBe(moves[moves.length - 1].t);
    expect((out.pll ?? out.lse).at).toBe(out.total);
  });
});

describe("analyzeSolution - real solve data quirks", () => {
  test("handles a leading rotation and a t=0 first move", () => {
    const solution = invertSequence("R U R' U' F2".split(" "));
    const moves = [{ m: "x'", t: 0 }, ...solution.map((m, i) => ({ m, t: (i + 1) * 100 }))];
    const out = analyzeSolution(moves);
    expect(out.solved).toBe(true);
    expect(out.unsupported).toEqual([]);
  });

  test("normalizes lowercase wide moves (r u f l d) like Rw Uw Fw Lw Dw", () => {
    const lower = "r u f l d".split(" ");
    const upper = "Rw Uw Fw Lw Dw".split(" ");
    const lowerOut = analyzeSolution(timed(invertSequence(lower)));
    const upperOut = analyzeSolution(timed(invertSequence(upper)));
    expect(lowerOut.unsupported).toEqual([]);
    expect(lowerOut.solved).toBe(upperOut.solved);
  });

  test("reports unrecognized tokens in `unsupported`", () => {
    const out = analyzeSolution([
      { m: "R", t: 100 },
      { m: "Q", t: 200 }, // not a move
      { m: "b", t: 300 }, // Bw: not supported by the engine
    ]);
    expect(out.unsupported).toContain("Q");
    expect(out.unsupported).toContain("b");
  });
});

describe("geometry derivation", () => {
  // The analyzer derives cube geometry internally; we validate it indirectly by
  // confirming a solved cube reports a complete cross for all six colors.
  test("solved cube has a complete cross on every color", () => {
    // A single move and its inverse: snapshot after the inverse is solved.
    const out = analyzeSolution(timed(["R", "R'"]));
    expect(out.solved).toBe(true);
    for (const color of Object.keys(out.allCrosses)) {
      expect(out.allCrosses[color]).not.toBeNull();
    }
  });
});

describe("analyzeSolution - method discrimination on real solves", () => {
  // The two methods must never be confused: CFOP solves report CFOP, Roux
  // solves report Roux, each with only its own milestone fields populated.
  const cases = [
    ["cfop-1", "CFOP", cfop1.replay.moves],
    ["cfop-2", "CFOP", cfop2.replay.moves],
    ["roux-1", "Roux", roux1.replay.moves],
    ["roux-2", "Roux", roux2.replay.moves],
    ["roux-3", "Roux", roux3.replay.moves],
    ["roux-4", "Roux", roux4.replay.moves],
  ];

  test.each(cases)("detects %s as %s", (_name, expected, moves) => {
    const out = analyzeSolution(moves);
    expect(out.method).toBe(expected);
    expect(out.solved).toBe(true);

    const cfopPopulated = out.cross != null && out.pll != null;
    const rouxPopulated = out.firstBlock != null && out.lse != null;
    if (expected === "CFOP") {
      expect(cfopPopulated).toBe(true);
      expect(rouxPopulated).toBe(false);
    } else {
      expect(rouxPopulated).toBe(true);
      expect(cfopPopulated).toBe(false);
    }
  });
});

describe("analyzeSolution - CFOP on real solves", () => {
  // Two genuine human CFOP solves recorded move-by-move with cumulative times.
  const solves = [
    ["cfop-1", cfop1.replay.moves],
    ["cfop-2", cfop2.replay.moves],
  ];

  test.each(solves)("classifies %s as a solved CFOP solve", (_name, moves) => {
    const out = analyzeSolution(moves);
    expect(out.method).toBe("CFOP");
    expect(out.solved).toBe(true);
  });

  test.each(solves)("reports the seven CFOP milestones in order for %s", (_name, moves) => {
    const out = analyzeSolution(moves);
    expect(out.cross).not.toBeNull();
    expect(out.f2l).toHaveLength(4);
    expect(out.oll).not.toBeNull();
    expect(out.pll).not.toBeNull();

    // Non-decreasing completion indices: cross <= f2l* <= oll <= pll.
    expect(out.cross.moveIndex).toBeLessThanOrEqual(out.f2l[0].moveIndex);
    for (let i = 1; i < out.f2l.length; i++) {
      expect(out.f2l[i - 1].moveIndex).toBeLessThanOrEqual(out.f2l[i].moveIndex);
    }
    expect(out.f2l[3].moveIndex).toBeLessThanOrEqual(out.oll.moveIndex);
    expect(out.oll.moveIndex).toBeLessThanOrEqual(out.pll.moveIndex);

    // PLL is the final solved state, at the last recorded move.
    expect(out.pll.at).toBe(out.total);
  });

  test.each(solves)("leaves Roux fields empty for %s", (_name, moves) => {
    const out = analyzeSolution(moves);
    expect(out.firstBlock).toBeNull();
    expect(out.secondBlock).toBeNull();
    expect(out.cmll).toBeNull();
    expect(out.lse).toBeNull();
  });
});

describe("analyzeSolution - Roux on real solves", () => {
  // Two genuine human Roux solves recorded move-by-move with cumulative times.
  const solves = [
    ["roux-1", roux1.replay.moves],
    ["roux-2", roux2.replay.moves],
    ["roux-3", roux3.replay.moves],
    ["roux-4", roux4.replay.moves],
  ];

  test.each(solves)("classifies %s as a solved Roux solve", (_name, moves) => {
    const out = analyzeSolution(moves);
    expect(out.method).toBe("Roux");
    expect(out.solved).toBe(true);
  });

  test.each(solves)("reports the four Roux milestones in order for %s", (_name, moves) => {
    const out = analyzeSolution(moves);
    expect(out.firstBlock).not.toBeNull();
    expect(out.secondBlock).not.toBeNull();
    expect(out.cmll).not.toBeNull();
    expect(out.lse).not.toBeNull();

    // Non-decreasing completion indices: 1st block <= 2nd block <= CMLL <= LSE.
    expect(out.firstBlock.moveIndex).toBeLessThanOrEqual(out.secondBlock.moveIndex);
    expect(out.secondBlock.moveIndex).toBeLessThanOrEqual(out.cmll.moveIndex);
    expect(out.cmll.moveIndex).toBeLessThanOrEqual(out.lse.moveIndex);

    // LSE is the final solved state, at the last recorded move.
    expect(out.lse.at).toBe(out.total);
  });

  test.each(solves)("leaves CFOP fields empty for %s", (_name, moves) => {
    const out = analyzeSolution(moves);
    expect(out.cross).toBeNull();
    expect(out.f2l).toEqual([]);
    expect(out.oll).toBeNull();
    expect(out.pll).toBeNull();
  });

  // Guards against degenerate staging where a later stage is detected on the
  // SAME move as the previous one (duration 0). This happened when block
  // detection compared against the live centers without allowing the slice
  // between the blocks to drift: the blocks only "completed" once the cube was
  // already solved, collapsing CMLL onto the second block. Each stage of a real
  // solve finishes on a strictly later move than the one before it.
  test.each(solves)("each Roux stage completes on a strictly later move for %s", (_name, moves) => {
    const out = analyzeSolution(moves);
    expect(out.firstBlock.moveIndex).toBeLessThan(out.secondBlock.moveIndex);
    expect(out.secondBlock.moveIndex).toBeLessThan(out.cmll.moveIndex);
    expect(out.cmll.moveIndex).toBeLessThan(out.lse.moveIndex);
  });

  // Regression: each Roux stage must span enough moves to be a real stage, not a
  // transient coincidence. The block/corner conditions flicker true at scattered
  // instants throughout a solve; the old detection latched onto an early one and
  // collapsed CMLL onto the second block (a 2-move "CMLL"), throwing off every
  // downstream duration. Genuine stages are several moves long.
  test.each(solves)("each Roux stage spans a plausible number of moves for %s", (_name, moves) => {
    const out = analyzeSolution(moves);
    expect(out.secondBlock.moveIndex - out.firstBlock.moveIndex).toBeGreaterThanOrEqual(5);
    expect(out.cmll.moveIndex - out.secondBlock.moveIndex).toBeGreaterThanOrEqual(5);
  });

  test.each(solves)("the two blocks are built on opposite faces for %s", (_name, moves) => {
    const out = analyzeSolution(moves);
    // Block side labels are the center colors; opposite faces never share one.
    expect(out.firstBlock.side).not.toBe(out.secondBlock.side);
    expect(typeof out.firstBlock.side).toBe("string");
  });

  test.each(solves)("stage durations chain from the previous milestone for %s", (_name, moves) => {
    const out = analyzeSolution(moves);
    expect(out.firstBlock.duration).toBe(out.firstBlock.at);
    expect(out.secondBlock.duration).toBe(out.secondBlock.at - out.firstBlock.at);
    expect(out.cmll.duration).toBe(out.cmll.at - out.secondBlock.at);
    expect(out.lse.duration).toBe(out.lse.at - out.cmll.at);
  });

  // Ground truth: the human solver watched these two replays move-by-move and
  // reported where each stage finishes (move numbers below are their 1-indexed
  // counts converted to 0-indexed moveIndex). These pin the detector to the
  // actual solve, not just to a self-consistent ordering -- the earlier versions
  // satisfied every ordering test above while still placing the second block and
  // CMLL on the wrong moves. A few moves of slack absorbs the ambiguity of
  // reading a stage boundary off a replay by eye.
  const groundTruth = {
    "roux-3": { firstBlock: 32, secondBlock: 84, cmll: 115, lse: 155 },
    "roux-4": { secondBlock: 81, cmll: 97, lse: 141 },
  };
  test.each([["roux-3", roux3.replay.moves], ["roux-4", roux4.replay.moves]])(
    "milestones match the human-validated replay for %s",
    (name, moves) => {
      const out = analyzeSolution(moves);
      const truth = groundTruth[name];
      const near = (got, want) => expect(Math.abs(got - want)).toBeLessThanOrEqual(8);
      if (truth.firstBlock != null) near(out.firstBlock.moveIndex, truth.firstBlock);
      near(out.secondBlock.moveIndex, truth.secondBlock);
      near(out.cmll.moveIndex, truth.cmll);
      expect(out.lse.moveIndex).toBe(truth.lse);
    }
  );
});

describe("analyzeSolution - startFace", () => {
  // The face the solve was started from, reported the same way whatever the
  // method: the cross face for CFOP, the first block's face for Roux.
  const cfopSolves = [
    ["cfop-1", cfop1.replay.moves],
    ["cfop-2", cfop2.replay.moves],
  ];
  const rouxSolves = [
    ["roux-1", roux1.replay.moves],
    ["roux-2", roux2.replay.moves],
    ["roux-3", roux3.replay.moves],
    ["roux-4", roux4.replay.moves],
  ];

  test("is null when there is no solve to stage", () => {
    expect(analyzeSolution([]).startFace).toBeNull();
  });

  test.each([...cfopSolves, ...rouxSolves])(
    "names one of the six faces plus its color for %s",
    (_name, moves) => {
      const out = analyzeSolution(moves);
      expect(out.startFace).not.toBeNull();
      expect(["U", "L", "F", "R", "B", "D"]).toContain(out.startFace.face);
      expect(["W", "O", "G", "R", "B", "Y"]).toContain(out.startFace.color);
    }
  );

  test.each([...cfopSolves, ...rouxSolves])(
    "the face letter carries that color at the end of %s",
    (_name, moves) => {
      const out = analyzeSolution(moves);
      // Replay scramble + solution independently and read the final centers:
      // the reported letter must be the face actually showing that color.
      const tokens = moves.map((x) => x.m);
      const cube = new CubeEngine();
      cube.applyMoves(invertSequence(tokens).join(" "), { record: false });
      cube.applyMoves(tokens.join(" "), { record: false });
      const centers = centersOf(flattenState(cube.state()), getCubeGeometry(3));
      const faceIndex = { U: 0, L: 1, F: 2, R: 3, B: 4, D: 5 }[out.startFace.face];
      expect(centers[faceIndex]).toBe(out.startFace.color);
    }
  );

  test.each(cfopSolves)("matches the cross face color on %s", (_name, moves) => {
    const out = analyzeSolution(moves);
    expect(out.startFace.color).toBe(out.cross.color);
  });

  test.each(rouxSolves)("matches the first block side on %s", (_name, moves) => {
    const out = analyzeSolution(moves);
    expect(out.startFace.color).toBe(out.firstBlock.side);
  });
});
