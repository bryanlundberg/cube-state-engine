import { CubeEngine, COLOR } from "../src/index.js";

describe("2x2 Cube Tests", () => {
  test("spawn a 2x2 cube", () => {
    const virtualization = new CubeEngine("", { size: 2 });
    const state = virtualization.state();
    const result = {
      UPPER: [
        [COLOR.W[0], COLOR.W[1]],
        [COLOR.W[2], COLOR.W[3]],
      ],
      LEFT: [
        [COLOR.O[0], COLOR.O[1]],
        [COLOR.O[2], COLOR.O[3]],
      ],
      FRONT: [
        [COLOR.G[0], COLOR.G[1]],
        [COLOR.G[2], COLOR.G[3]],
      ],
      RIGHT: [
        [COLOR.R[0], COLOR.R[1]],
        [COLOR.R[2], COLOR.R[3]],
      ],
      BACK: [
        [COLOR.B[0], COLOR.B[1]],
        [COLOR.B[2], COLOR.B[3]],
      ],
      DOWN: [
        [COLOR.Y[0], COLOR.Y[1]],
        [COLOR.Y[2], COLOR.Y[3]],
      ],
    };
    expect(JSON.stringify(state)).toBe(JSON.stringify(result));
  });

  test("Middle slice moves (M) should have no effect on 2x2 cube", () => {
    const virtualization = new CubeEngine("", { size: 2 });
    const initialState = JSON.stringify(virtualization.state());

    // Apply M move (middle slice between L and R)
    virtualization.rotateM(true);
    const afterMoveState = JSON.stringify(virtualization.state());

    // States should be identical since there's no middle layer in a 2x2
    expect(afterMoveState).toBe(initialState);
  });

  test("Wide moves (Rw) should have no effect on 2x2 cube", () => {
    const virtualization = new CubeEngine("", { size: 2 });
    const initialState = JSON.stringify(virtualization.state());

    // Apply Rw move
    virtualization.rotateRw(true);
    const afterMoveState = JSON.stringify(virtualization.state());

    // States should be identical since there are no double layers in a 2x2
    expect(afterMoveState).toBe(initialState);
  });

  test("Wide moves (Lw) should have no effect on 2x2 cube", () => {
    const virtualization = new CubeEngine("", { size: 2 });
    const initialState = JSON.stringify(virtualization.state());

    // Apply Lw move
    virtualization.rotateLw(true);
    const afterMoveState = JSON.stringify(virtualization.state());

    // States should be identical since there are no double layers in a 2x2
    expect(afterMoveState).toBe(initialState);
  });

  test("Wide moves (Uw) should have no effect on 2x2 cube", () => {
    const virtualization = new CubeEngine("", { size: 2 });
    const initialState = JSON.stringify(virtualization.state());

    // Apply Uw move
    virtualization.rotateUw(true);
    const afterMoveState = JSON.stringify(virtualization.state());

    // States should be identical since there are no double layers in a 2x2
    expect(afterMoveState).toBe(initialState);
  });

  test("Wide moves (Dw) should have no effect on 2x2 cube", () => {
    const virtualization = new CubeEngine("", { size: 2 });
    const initialState = JSON.stringify(virtualization.state());

    // Apply Dw move
    virtualization.rotateDw(true);
    const afterMoveState = JSON.stringify(virtualization.state());

    // States should be identical since there are no double layers in a 2x2
    expect(afterMoveState).toBe(initialState);
  });

  test("Basic algorithm execution on 2x2 cube", () => {
    const virtualization = new CubeEngine("", { size: 2 });
    // Execute a simple algorithm (Sune: R U R' U R U2 R')
    virtualization.applyMoves("R U R' U R U2 R'");

    // Verify the algorithm was applied correctly
    const state = virtualization.state();
    expect(state.UPPER[0][0]).not.toBe(COLOR.W[0]); // The top face should be affected
  });
});
