import { CubeEngine, analyzeSolution, invertSequence } from "../src/index.js";

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

    expect(out.solved).toBe(true);
    expect(out.pll).not.toBeNull();
    expect(out.pll.moveIndex).toBe(solution.length - 1);
    expect(out.pll.at).toBe(out.total);
  });

  test("every face cross is complete by the end of a solving sequence", () => {
    const scramble = "F R U' L2 D B2 R' U2".split(" ");
    const solution = invertSequence(scramble);
    const out = analyzeSolution(timed(solution));

    const colors = Object.keys(out.allCrosses);
    expect(colors.length).toBe(6);
    for (const color of colors) {
      expect(out.allCrosses[color]).not.toBeNull();
      expect(out.allCrosses[color].moveIndex).toBeLessThanOrEqual(
        out.pll.moveIndex
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
    expect(out.pll.at).toBe(out.total);
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
