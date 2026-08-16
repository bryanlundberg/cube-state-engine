import { describe, expect, test } from "bun:test";

import type { SolveMethod, StagingContext } from "../src/index.js";
import {
  analyzeSolution,
  registerMethod,
  listMethods,
  buildReplay,
  invertSequence,
} from "../src/index.js";
import cfop1 from "./cfop-1.json";

// Bun gives each test file its own module registry, so the method registered
// below never leaks into the other suites.

describe("method registry", () => {
  test("the built-ins are registered in tie-break order", () => {
    expect(listMethods().map((m) => m.name)).toEqual(["CFOP", "Roux"]);
  });

  test("rejects anything that is not a staging strategy", () => {
    // Deliberately ill-typed: the guard exists for JavaScript callers.
    const bad = (value: unknown) => registerMethod(value as SolveMethod);
    expect(() => bad({ name: "NoStage" })).toThrow(TypeError);
    expect(() => bad(null)).toThrow(TypeError);
  });
});

describe("buildReplay", () => {
  // The context every strategy reads: one snapshot per move, plus the geometry.
  test("captures one snapshot per move and the final centers", () => {
    const tokens = invertSequence("R U F".split(" "));
    const moves = tokens.map((m, i) => ({ m, t: (i + 1) * 100 }));
    const ctx = buildReplay(moves, { size: 3 });

    expect(ctx.n).toBe(tokens.length);
    expect(ctx.snapshots).toHaveLength(tokens.length);
    expect(ctx.snapshots[0]).toHaveLength(54);
    expect(ctx.finalCenters).toHaveLength(6);
    expect(ctx.solved).toBe(true);
  });

  test("an empty solution replays to nothing", () => {
    const ctx = buildReplay([], { size: 3 });
    expect(ctx.n).toBe(0);
    expect(ctx.snapshots).toEqual([]);
    expect(ctx.solved).toBe(false);
  });
});

describe("registerMethod", () => {
  // Registered last, so this must run after the built-in ordering test above.
  test("a registered method competes for the staging and can win", () => {
    registerMethod({
      name: "Always",
      // Claims every solve, with its first milestone on the opening move --
      // earlier than any real cross or block, so it must win the arbitration.
      stage: (ctx: StagingContext) => ({
        valid: true,
        firstIdx: 0,
        startFace: 5, // DOWN
        milestones: [
          { key: "opening", label: "Opening", idx: 0 },
          { key: "done", label: "Done", idx: ctx.solvedIdx },
        ],
      }),
    });

    const out = analyzeSolution(cfop1.replay.moves);
    expect(out.method).toBe("Always");
    expect(out.stages.map((s) => s.key)).toEqual(["opening", "done"]);
    expect(out.stages[1].at).toBe(out.total);

    // A method reporting its own vocabulary simply projects onto no legacy
    // field; the v1.x CFOP/Roux slots stay empty instead of being guessed at.
    expect(out.cross).toBeNull();
    expect(out.firstBlock).toBeNull();

    // startFace stays method-agnostic: the face index the strategy reported.
    expect(out.startFace!.face).toBe("D");
    expect(typeof out.startFace!.color).toBe("string");

    // Method-independent reporting is unaffected.
    expect(out.solved).toBe(true);
    expect(Object.keys(out.allCrosses)).toHaveLength(6);
  });
});
