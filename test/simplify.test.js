import { simplifyMoves } from "../src/index.js";

describe("simplifyMoves - strings", () => {
  test("joins two identical quarter turns into a double", () => {
    expect(simplifyMoves("R R")).toBe("R2");
    expect(simplifyMoves("F F")).toBe("F2");
  });

  test("does NOT cancel opposite moves", () => {
    expect(simplifyMoves("F F'")).toBe("F F'");
    expect(simplifyMoves("R R'")).toBe("R R'");
  });

  test("joins primed and rotation/slice/wide quarter turns", () => {
    expect(simplifyMoves("R' R'")).toBe("R2");
    expect(simplifyMoves("y y")).toBe("y2");
    expect(simplifyMoves("M M")).toBe("M2");
    expect(simplifyMoves("Rw Rw")).toBe("Rw2");
  });

  test("leaves doubles and non-identical neighbors untouched (no reduction)", () => {
    expect(simplifyMoves("U2 U2")).toBe("U2 U2"); // no cancellation to identity
    expect(simplifyMoves("R R2")).toBe("R R2");
    expect(simplifyMoves("R2 R")).toBe("R2 R");
  });

  test("three in a row joins only the first pair (no further folding)", () => {
    expect(simplifyMoves("R R R")).toBe("R2 R");
    expect(simplifyMoves("R R R R")).toBe("R2 R2");
  });

  test("works within a longer sequence", () => {
    // The trailing "F' F'" is two identical quarter turns -> joins to "F2".
    expect(simplifyMoves("U R R D R' B R F L' F' F'")).toBe(
      "U R2 D R' B R F L' F2"
    );
  });

  test("handles irregular whitespace", () => {
    expect(simplifyMoves("  R   R  F F ")).toBe("R2 F2");
  });
});

describe("simplifyMoves - token arrays", () => {
  test("returns an array when given an array of tokens", () => {
    expect(simplifyMoves(["y'", "y'", "L"])).toEqual(["y2", "L"]);
  });

  test("empty array returns empty array", () => {
    expect(simplifyMoves([])).toEqual([]);
  });
});

describe("simplifyMoves - timed moves", () => {
  test("merges {m,t} pairs keeping the second timestamp", () => {
    const out = simplifyMoves([
      { m: "U", t: 100 },
      { m: "R", t: 200 },
      { m: "R", t: 250 },
      { m: "F", t: 400 },
      { m: "F'", t: 500 },
    ]);
    expect(out).toEqual([
      { m: "U", t: 100 },
      { m: "R2", t: 250 }, // R(200) R(250) -> R2 keeps t=250
      { m: "F", t: 400 },
      { m: "F'", t: 500 }, // not cancelled
    ]);
  });
});
