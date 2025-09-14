import { CubeEngine, COLOR } from "../src/index.js";

test("spawn a cube", () => {
  const virtualization = new CubeEngine();
  const state = virtualization.state();
  const result = {
    UPPER: [
      [COLOR.W[0], COLOR.W[1], COLOR.W[2]],
      [COLOR.W[3], COLOR.W[4], COLOR.W[5]],
      [COLOR.W[6], COLOR.W[7], COLOR.W[8]],
    ],
    LEFT: [
      [COLOR.O[0], COLOR.O[1], COLOR.O[2]],
      [COLOR.O[3], COLOR.O[4], COLOR.O[5]],
      [COLOR.O[6], COLOR.O[7], COLOR.O[8]],
    ],
    FRONT: [
      [COLOR.G[0], COLOR.G[1], COLOR.G[2]],
      [COLOR.G[3], COLOR.G[4], COLOR.G[5]],
      [COLOR.G[6], COLOR.G[7], COLOR.G[8]],
    ],
    RIGHT: [
      [COLOR.R[0], COLOR.R[1], COLOR.R[2]],
      [COLOR.R[3], COLOR.R[4], COLOR.R[5]],
      [COLOR.R[6], COLOR.R[7], COLOR.R[8]],
    ],
    BACK: [
      [COLOR.B[0], COLOR.B[1], COLOR.B[2]],
      [COLOR.B[3], COLOR.B[4], COLOR.B[5]],
      [COLOR.B[6], COLOR.B[7], COLOR.B[8]],
    ],
    DOWN: [
      [COLOR.Y[0], COLOR.Y[1], COLOR.Y[2]],
      [COLOR.Y[3], COLOR.Y[4], COLOR.Y[5]],
      [COLOR.Y[6], COLOR.Y[7], COLOR.Y[8]],
    ],
  };
  expect(JSON.stringify(state)).toBe(JSON.stringify(result));
});

test("ROTATE U", () => {
  const virtualization = new CubeEngine();
  virtualization.rotateU();
  const state = virtualization.state();
  const result = {
    UPPER: [
      [COLOR.W[6], COLOR.W[3], COLOR.W[0]],
      [COLOR.W[7], COLOR.W[4], COLOR.W[1]],
      [COLOR.W[8], COLOR.W[5], COLOR.W[2]],
    ],
    LEFT: [
      [COLOR.G[0], COLOR.G[1], COLOR.G[2]],
      [COLOR.O[3], COLOR.O[4], COLOR.O[5]],
      [COLOR.O[6], COLOR.O[7], COLOR.O[8]],
    ],
    FRONT: [
      [COLOR.R[0], COLOR.R[1], COLOR.R[2]],
      [COLOR.G[3], COLOR.G[4], COLOR.G[5]],
      [COLOR.G[6], COLOR.G[7], COLOR.G[8]],
    ],
    RIGHT: [
      [COLOR.B[0], COLOR.B[1], COLOR.B[2]],
      [COLOR.R[3], COLOR.R[4], COLOR.R[5]],
      [COLOR.R[6], COLOR.R[7], COLOR.R[8]],
    ],
    BACK: [
      [COLOR.O[0], COLOR.O[1], COLOR.O[2]],
      [COLOR.B[3], COLOR.B[4], COLOR.B[5]],
      [COLOR.B[6], COLOR.B[7], COLOR.B[8]],
    ],
    DOWN: [
      [COLOR.Y[0], COLOR.Y[1], COLOR.Y[2]],
      [COLOR.Y[3], COLOR.Y[4], COLOR.Y[5]],
      [COLOR.Y[6], COLOR.Y[7], COLOR.Y[8]],
    ],
  };
  expect(JSON.stringify(state)).toBe(JSON.stringify(result));
});

test("ROTATE U'", () => {
  const virtualization = new CubeEngine();
  virtualization.rotateU(false);
  const state = virtualization.state();
  const result = {
    UPPER: [
      [COLOR.W[2], COLOR.W[5], COLOR.W[8]],
      [COLOR.W[1], COLOR.W[4], COLOR.W[7]],
      [COLOR.W[0], COLOR.W[3], COLOR.W[6]],
    ],
    LEFT: [
      [COLOR.B[0], COLOR.B[1], COLOR.B[2]],
      [COLOR.O[3], COLOR.O[4], COLOR.O[5]],
      [COLOR.O[6], COLOR.O[7], COLOR.O[8]],
    ],
    FRONT: [
      [COLOR.O[0], COLOR.O[1], COLOR.O[2]],
      [COLOR.G[3], COLOR.G[4], COLOR.G[5]],
      [COLOR.G[6], COLOR.G[7], COLOR.G[8]],
    ],
    RIGHT: [
      [COLOR.G[0], COLOR.G[1], COLOR.G[2]],
      [COLOR.R[3], COLOR.R[4], COLOR.R[5]],
      [COLOR.R[6], COLOR.R[7], COLOR.R[8]],
    ],
    BACK: [
      [COLOR.R[0], COLOR.R[1], COLOR.R[2]],
      [COLOR.B[3], COLOR.B[4], COLOR.B[5]],
      [COLOR.B[6], COLOR.B[7], COLOR.B[8]],
    ],
    DOWN: [
      [COLOR.Y[0], COLOR.Y[1], COLOR.Y[2]],
      [COLOR.Y[3], COLOR.Y[4], COLOR.Y[5]],
      [COLOR.Y[6], COLOR.Y[7], COLOR.Y[8]],
    ],
  };
  expect(JSON.stringify(state)).toBe(JSON.stringify(result));
});

test("ROTATE F", () => {
  const virtualization = new CubeEngine();
  virtualization.rotateF(true);
  const state = virtualization.state();
  const result = {
    UPPER: [
      [COLOR.W[0], COLOR.W[1], COLOR.W[2]],
      [COLOR.W[3], COLOR.W[4], COLOR.W[5]],
      [COLOR.O[8], COLOR.O[5], COLOR.O[2]],
    ],
    LEFT: [
      [COLOR.O[0], COLOR.O[1], COLOR.Y[0]],
      [COLOR.O[3], COLOR.O[4], COLOR.Y[1]],
      [COLOR.O[6], COLOR.O[7], COLOR.Y[2]],
    ],
    FRONT: [
      [COLOR.G[6], COLOR.G[3], COLOR.G[0]],
      [COLOR.G[7], COLOR.G[4], COLOR.G[1]],
      [COLOR.G[8], COLOR.G[5], COLOR.G[2]],
    ],
    RIGHT: [
      [COLOR.W[6], COLOR.R[1], COLOR.R[2]],
      [COLOR.W[7], COLOR.R[4], COLOR.R[5]],
      [COLOR.W[8], COLOR.R[7], COLOR.R[8]],
    ],
    BACK: [
      [COLOR.B[0], COLOR.B[1], COLOR.B[2]],
      [COLOR.B[3], COLOR.B[4], COLOR.B[5]],
      [COLOR.B[6], COLOR.B[7], COLOR.B[8]],
    ],
    DOWN: [
      [COLOR.R[2], COLOR.R[1], COLOR.R[0]],
      [COLOR.Y[3], COLOR.Y[4], COLOR.Y[5]],
      [COLOR.Y[6], COLOR.Y[7], COLOR.Y[8]],
    ],
  };
  expect(JSON.stringify(state)).toBe(JSON.stringify(result));
});

test("ROTATE F'", () => {
  const virtualization = new CubeEngine();
  virtualization.rotateF(false);
  const state = virtualization.state();
  const result = {
    UPPER: [
      [COLOR.W[0], COLOR.W[1], COLOR.W[2]],
      [COLOR.W[3], COLOR.W[4], COLOR.W[5]],
      [COLOR.R[8], COLOR.R[5], COLOR.R[2]],
    ],
    LEFT: [
      [COLOR.O[0], COLOR.O[1], COLOR.W[0]],
      [COLOR.O[3], COLOR.O[4], COLOR.W[1]],
      [COLOR.O[6], COLOR.O[7], COLOR.W[2]],
    ],
    FRONT: [
      [COLOR.G[6], COLOR.G[3], COLOR.G[0]],
      [COLOR.G[7], COLOR.G[4], COLOR.G[1]],
      [COLOR.G[8], COLOR.G[5], COLOR.G[2]],
    ],
    RIGHT: [
      [COLOR.Y[6], COLOR.R[1], COLOR.R[2]],
      [COLOR.Y[7], COLOR.R[4], COLOR.R[5]],
      [COLOR.Y[8], COLOR.R[7], COLOR.R[8]],
    ],
    BACK: [
      [COLOR.B[0], COLOR.B[1], COLOR.B[2]],
      [COLOR.B[3], COLOR.B[4], COLOR.B[5]],
      [COLOR.B[6], COLOR.B[7], COLOR.B[8]],
    ],
    DOWN: [
      [COLOR.O[2], COLOR.O[1], COLOR.O[0]],
      [COLOR.Y[3], COLOR.Y[4], COLOR.Y[5]],
      [COLOR.Y[6], COLOR.Y[7], COLOR.Y[8]],
    ],
  };
  expect(JSON.stringify(state)).toBe(JSON.stringify(result));
});

test("ROTATE x", () => {
  const virtualization = new CubeEngine();
  virtualization.rotateX();
  const state = virtualization.state();
  const result = {
    UPPER: [
      [COLOR.G[0], COLOR.G[1], COLOR.G[2]],
      [COLOR.G[3], COLOR.G[4], COLOR.G[5]],
      [COLOR.G[6], COLOR.G[7], COLOR.G[8]],
    ],
    LEFT: [
      [COLOR.O[2], COLOR.O[5], COLOR.O[8]],
      [COLOR.O[1], COLOR.O[4], COLOR.O[7]],
      [COLOR.O[0], COLOR.O[3], COLOR.O[6]],
    ],
    FRONT: [
      [COLOR.Y[0], COLOR.Y[1], COLOR.Y[2]],
      [COLOR.Y[3], COLOR.Y[4], COLOR.Y[5]],
      [COLOR.Y[6], COLOR.Y[7], COLOR.Y[8]],
    ],
    RIGHT: [
      [COLOR.R[6], COLOR.R[3], COLOR.R[0]],
      [COLOR.R[7], COLOR.R[4], COLOR.R[1]],
      [COLOR.R[8], COLOR.R[5], COLOR.R[2]],
    ],
    BACK: [
      [COLOR.W[8], COLOR.W[7], COLOR.W[6]],
      [COLOR.W[5], COLOR.W[4], COLOR.W[3]],
      [COLOR.W[2], COLOR.W[1], COLOR.W[0]],
    ],
    DOWN: [
      [COLOR.B[0], COLOR.B[1], COLOR.B[2]],
      [COLOR.B[3], COLOR.B[4], COLOR.B[5]],
      [COLOR.B[6], COLOR.B[7], COLOR.B[8]],
    ],
  };
  expect(JSON.stringify(state)).toBe(JSON.stringify(result));
});

test("ROTATE x'", () => {
  const virtualization = new CubeEngine();
  virtualization.rotateX(false);
  const state = virtualization.state();
  const result = {
    UPPER: [
      [COLOR.B[6], COLOR.B[7], COLOR.B[8]],
      [COLOR.B[3], COLOR.B[4], COLOR.B[5]],
      [COLOR.B[0], COLOR.B[1], COLOR.B[2]],
    ],
    LEFT: [
      [COLOR.O[6], COLOR.O[3], COLOR.O[0]],
      [COLOR.O[7], COLOR.O[4], COLOR.O[1]],
      [COLOR.O[8], COLOR.O[5], COLOR.O[2]],
    ],
    FRONT: [
      [COLOR.W[0], COLOR.W[1], COLOR.W[2]],
      [COLOR.W[3], COLOR.W[4], COLOR.W[5]],
      [COLOR.W[6], COLOR.W[7], COLOR.W[8]],
    ],
    RIGHT: [
      [COLOR.R[2], COLOR.R[5], COLOR.R[8]],
      [COLOR.R[1], COLOR.R[4], COLOR.R[7]],
      [COLOR.R[0], COLOR.R[3], COLOR.R[6]],
    ],
    BACK: [
      [COLOR.Y[8], COLOR.Y[7], COLOR.Y[6]],
      [COLOR.Y[5], COLOR.Y[4], COLOR.Y[3]],
      [COLOR.Y[2], COLOR.Y[1], COLOR.Y[0]],
    ],
    DOWN: [
      [COLOR.G[0], COLOR.G[1], COLOR.G[2]],
      [COLOR.G[3], COLOR.G[4], COLOR.G[5]],
      [COLOR.G[6], COLOR.G[7], COLOR.G[8]],
    ],
  };
  expect(JSON.stringify(state)).toBe(JSON.stringify(result));
});

test("ROTATE y", () => {
  const virtualization = new CubeEngine();
  virtualization.rotateY();
  const state = virtualization.state();
  const result = {
    UPPER: [
      [COLOR.W[6], COLOR.W[3], COLOR.W[0]],
      [COLOR.W[7], COLOR.W[4], COLOR.W[1]],
      [COLOR.W[8], COLOR.W[5], COLOR.W[2]],
    ],
    LEFT: [
      [COLOR.G[0], COLOR.G[1], COLOR.G[2]],
      [COLOR.G[3], COLOR.G[4], COLOR.G[5]],
      [COLOR.G[6], COLOR.G[7], COLOR.G[8]],
    ],
    FRONT: [
      [COLOR.R[0], COLOR.R[1], COLOR.R[2]],
      [COLOR.R[3], COLOR.R[4], COLOR.R[5]],
      [COLOR.R[6], COLOR.R[7], COLOR.R[8]],
    ],
    RIGHT: [
      [COLOR.B[0], COLOR.B[1], COLOR.B[2]],
      [COLOR.B[3], COLOR.B[4], COLOR.B[5]],
      [COLOR.B[6], COLOR.B[7], COLOR.B[8]],
    ],
    BACK: [
      [COLOR.O[0], COLOR.O[1], COLOR.O[2]],
      [COLOR.O[3], COLOR.O[4], COLOR.O[5]],
      [COLOR.O[6], COLOR.O[7], COLOR.O[8]],
    ],
    DOWN: [
      [COLOR.Y[2], COLOR.Y[5], COLOR.Y[8]],
      [COLOR.Y[1], COLOR.Y[4], COLOR.Y[7]],
      [COLOR.Y[0], COLOR.Y[3], COLOR.Y[6]],
    ],
  };
  expect(JSON.stringify(state)).toBe(JSON.stringify(result));
});

test("ROTATE y'", () => {
  const virtualization = new CubeEngine();
  virtualization.rotateY(false);
  const state = virtualization.state();
  const result = {
    UPPER: [
      [COLOR.W[2], COLOR.W[5], COLOR.W[8]],
      [COLOR.W[1], COLOR.W[4], COLOR.W[7]],
      [COLOR.W[0], COLOR.W[3], COLOR.W[6]],
    ],
    LEFT: [
      [COLOR.B[0], COLOR.B[1], COLOR.B[2]],
      [COLOR.B[3], COLOR.B[4], COLOR.B[5]],
      [COLOR.B[6], COLOR.B[7], COLOR.B[8]],
    ],
    FRONT: [
      [COLOR.O[0], COLOR.O[1], COLOR.O[2]],
      [COLOR.O[3], COLOR.O[4], COLOR.O[5]],
      [COLOR.O[6], COLOR.O[7], COLOR.O[8]],
    ],
    RIGHT: [
      [COLOR.G[0], COLOR.G[1], COLOR.G[2]],
      [COLOR.G[3], COLOR.G[4], COLOR.G[5]],
      [COLOR.G[6], COLOR.G[7], COLOR.G[8]],
    ],
    BACK: [
      [COLOR.R[0], COLOR.R[1], COLOR.R[2]],
      [COLOR.R[3], COLOR.R[4], COLOR.R[5]],
      [COLOR.R[6], COLOR.R[7], COLOR.R[8]],
    ],
    DOWN: [
      [COLOR.Y[6], COLOR.Y[3], COLOR.Y[0]],
      [COLOR.Y[7], COLOR.Y[4], COLOR.Y[1]],
      [COLOR.Y[8], COLOR.Y[5], COLOR.Y[2]],
    ],
  };
  expect(JSON.stringify(state)).toBe(JSON.stringify(result));
});

test("ROTATE R", () => {
  const virtualization = new CubeEngine();
  virtualization.rotateR(true);
  const state = virtualization.state();
  const result = {
    UPPER: [
      [COLOR.W[0], COLOR.W[1], COLOR.G[2]],
      [COLOR.W[3], COLOR.W[4], COLOR.G[5]],
      [COLOR.W[6], COLOR.W[7], COLOR.G[8]],
    ],
    LEFT: [
      [COLOR.O[0], COLOR.O[1], COLOR.O[2]],
      [COLOR.O[3], COLOR.O[4], COLOR.O[5]],
      [COLOR.O[6], COLOR.O[7], COLOR.O[8]],
    ],
    FRONT: [
      [COLOR.G[0], COLOR.G[1], COLOR.Y[2]],
      [COLOR.G[3], COLOR.G[4], COLOR.Y[5]],
      [COLOR.G[6], COLOR.G[7], COLOR.Y[8]],
    ],
    RIGHT: [
      [COLOR.R[0], COLOR.R[1], COLOR.R[2]],
      [COLOR.R[3], COLOR.R[4], COLOR.R[5]],
      [COLOR.R[6], COLOR.R[7], COLOR.R[8]],
    ],
    BACK: [
      [COLOR.W[0], COLOR.B[1], COLOR.B[2]],
      [COLOR.W[3], COLOR.B[4], COLOR.B[5]],
      [COLOR.W[6], COLOR.B[7], COLOR.B[8]],
    ],
    DOWN: [
      [COLOR.Y[0], COLOR.Y[1], COLOR.B[2]],
      [COLOR.Y[3], COLOR.Y[4], COLOR.B[5]],
      [COLOR.Y[6], COLOR.Y[7], COLOR.B[8]],
    ],
  };
  expect(JSON.stringify(state)).toBe(JSON.stringify(result));
});

test("ROTATE R'", () => {
  const virtualization = new CubeEngine();
  virtualization.rotateR(false);
  const state = virtualization.state();
  const result = {
    UPPER: [
      [COLOR.W[0], COLOR.W[1], COLOR.B[2]],
      [COLOR.W[3], COLOR.W[4], COLOR.B[5]],
      [COLOR.W[6], COLOR.W[7], COLOR.B[8]],
    ],
    LEFT: [
      [COLOR.O[0], COLOR.O[1], COLOR.O[2]],
      [COLOR.O[3], COLOR.O[4], COLOR.O[5]],
      [COLOR.O[6], COLOR.O[7], COLOR.O[8]],
    ],
    FRONT: [
      [COLOR.G[0], COLOR.G[1], COLOR.W[2]],
      [COLOR.G[3], COLOR.G[4], COLOR.W[5]],
      [COLOR.G[6], COLOR.G[7], COLOR.W[8]],
    ],
    RIGHT: [
      [COLOR.R[0], COLOR.R[1], COLOR.R[2]],
      [COLOR.R[3], COLOR.R[4], COLOR.R[5]],
      [COLOR.R[6], COLOR.R[7], COLOR.R[8]],
    ],
    BACK: [
      [COLOR.Y[0], COLOR.B[1], COLOR.B[2]],
      [COLOR.Y[3], COLOR.B[4], COLOR.B[5]],
      [COLOR.Y[6], COLOR.B[7], COLOR.B[8]],
    ],
    DOWN: [
      [COLOR.Y[0], COLOR.Y[1], COLOR.G[2]],
      [COLOR.Y[3], COLOR.Y[4], COLOR.G[5]],
      [COLOR.Y[6], COLOR.Y[7], COLOR.G[8]],
    ],
  };
  expect(JSON.stringify(state)).toBe(JSON.stringify(result));
});

test("ROTATE L", () => {
  const virtualization = new CubeEngine();
  virtualization.rotateL(true);
  const state = virtualization.state();
  const result = {
    UPPER: [
      [COLOR.B[0], COLOR.W[1], COLOR.W[2]],
      [COLOR.B[3], COLOR.W[4], COLOR.W[5]],
      [COLOR.B[6], COLOR.W[7], COLOR.W[8]],
    ],
    LEFT: [
      [COLOR.O[0], COLOR.O[1], COLOR.O[2]],
      [COLOR.O[3], COLOR.O[4], COLOR.O[5]],
      [COLOR.O[6], COLOR.O[7], COLOR.O[8]],
    ],
    FRONT: [
      [COLOR.W[0], COLOR.G[1], COLOR.G[2]],
      [COLOR.W[3], COLOR.G[4], COLOR.G[5]],
      [COLOR.W[6], COLOR.G[7], COLOR.G[8]],
    ],
    RIGHT: [
      [COLOR.R[0], COLOR.R[1], COLOR.R[2]],
      [COLOR.R[3], COLOR.R[4], COLOR.R[5]],
      [COLOR.R[6], COLOR.R[7], COLOR.R[8]],
    ],
    BACK: [
      [COLOR.B[0], COLOR.B[1], COLOR.Y[2]],
      [COLOR.B[3], COLOR.B[4], COLOR.Y[5]],
      [COLOR.B[6], COLOR.B[7], COLOR.Y[8]],
    ],
    DOWN: [
      [COLOR.G[0], COLOR.Y[1], COLOR.Y[2]],
      [COLOR.G[3], COLOR.Y[4], COLOR.Y[5]],
      [COLOR.G[6], COLOR.Y[7], COLOR.Y[8]],
    ],
  };
  expect(JSON.stringify(state)).toBe(JSON.stringify(result));
});

test("ROTATE L'", () => {
  const virtualization = new CubeEngine();
  virtualization.rotateL(false);
  const state = virtualization.state();
  const result = {
    UPPER: [
      [COLOR.G[0], COLOR.W[1], COLOR.W[2]],
      [COLOR.G[3], COLOR.W[4], COLOR.W[5]],
      [COLOR.G[6], COLOR.W[7], COLOR.W[8]],
    ],
    LEFT: [
      [COLOR.O[0], COLOR.O[1], COLOR.O[2]],
      [COLOR.O[3], COLOR.O[4], COLOR.O[5]],
      [COLOR.O[6], COLOR.O[7], COLOR.O[8]],
    ],
    FRONT: [
      [COLOR.Y[0], COLOR.G[1], COLOR.G[2]],
      [COLOR.Y[3], COLOR.G[4], COLOR.G[5]],
      [COLOR.Y[6], COLOR.G[7], COLOR.G[8]],
    ],
    RIGHT: [
      [COLOR.R[0], COLOR.R[1], COLOR.R[2]],
      [COLOR.R[3], COLOR.R[4], COLOR.R[5]],
      [COLOR.R[6], COLOR.R[7], COLOR.R[8]],
    ],
    BACK: [
      [COLOR.B[0], COLOR.B[1], COLOR.W[2]],
      [COLOR.B[3], COLOR.B[4], COLOR.W[5]],
      [COLOR.B[6], COLOR.B[7], COLOR.W[8]],
    ],
    DOWN: [
      [COLOR.B[0], COLOR.Y[1], COLOR.Y[2]],
      [COLOR.B[3], COLOR.Y[4], COLOR.Y[5]],
      [COLOR.B[6], COLOR.Y[7], COLOR.Y[8]],
    ],
  };
  expect(JSON.stringify(state)).toBe(JSON.stringify(result));
});

test("ROTATE D", () => {
  const virtualization = new CubeEngine();
  virtualization.rotateD(true);
  const state = virtualization.state();
  const result = {
    UPPER: [
      [COLOR.W[0], COLOR.W[1], COLOR.W[2]],
      [COLOR.W[3], COLOR.W[4], COLOR.W[5]],
      [COLOR.W[6], COLOR.W[7], COLOR.W[8]],
    ],
    LEFT: [
      [COLOR.O[0], COLOR.O[1], COLOR.O[2]],
      [COLOR.O[3], COLOR.O[4], COLOR.O[5]],
      [COLOR.B[6], COLOR.B[7], COLOR.B[8]],
    ],
    FRONT: [
      [COLOR.G[0], COLOR.G[1], COLOR.G[2]],
      [COLOR.G[3], COLOR.G[4], COLOR.G[5]],
      [COLOR.O[6], COLOR.O[7], COLOR.O[8]],
    ],
    RIGHT: [
      [COLOR.R[0], COLOR.R[1], COLOR.R[2]],
      [COLOR.R[3], COLOR.R[4], COLOR.R[5]],
      [COLOR.G[6], COLOR.G[7], COLOR.G[8]],
    ],
    BACK: [
      [COLOR.B[0], COLOR.B[1], COLOR.B[2]],
      [COLOR.B[3], COLOR.B[4], COLOR.B[5]],
      [COLOR.R[6], COLOR.R[7], COLOR.R[8]],
    ],
    DOWN: [
      [COLOR.Y[0], COLOR.Y[1], COLOR.Y[2]],
      [COLOR.Y[3], COLOR.Y[4], COLOR.Y[5]],
      [COLOR.Y[6], COLOR.Y[7], COLOR.Y[8]],
    ],
  };
  expect(JSON.stringify(state)).toBe(JSON.stringify(result));
});

test("ROTATE D'", () => {
  const virtualization = new CubeEngine();
  virtualization.rotateD(false);
  const state = virtualization.state();
  const result = {
    UPPER: [
      [COLOR.W[0], COLOR.W[1], COLOR.W[2]],
      [COLOR.W[3], COLOR.W[4], COLOR.W[5]],
      [COLOR.W[6], COLOR.W[7], COLOR.W[8]],
    ],
    LEFT: [
      [COLOR.O[0], COLOR.O[1], COLOR.O[2]],
      [COLOR.O[3], COLOR.O[4], COLOR.O[5]],
      [COLOR.G[6], COLOR.G[7], COLOR.G[8]],
    ],
    FRONT: [
      [COLOR.G[0], COLOR.G[1], COLOR.G[2]],
      [COLOR.G[3], COLOR.G[4], COLOR.G[5]],
      [COLOR.R[6], COLOR.R[7], COLOR.R[8]],
    ],
    RIGHT: [
      [COLOR.R[0], COLOR.R[1], COLOR.R[2]],
      [COLOR.R[3], COLOR.R[4], COLOR.R[5]],
      [COLOR.B[6], COLOR.B[7], COLOR.B[8]],
    ],
    BACK: [
      [COLOR.B[0], COLOR.B[1], COLOR.B[2]],
      [COLOR.B[3], COLOR.B[4], COLOR.B[5]],
      [COLOR.O[6], COLOR.O[7], COLOR.O[8]],
    ],
    DOWN: [
      [COLOR.Y[0], COLOR.Y[1], COLOR.Y[2]],
      [COLOR.Y[3], COLOR.Y[4], COLOR.Y[5]],
      [COLOR.Y[6], COLOR.Y[7], COLOR.Y[8]],
    ],
  };
  expect(JSON.stringify(state)).toBe(JSON.stringify(result));
});

test("U' U L R D' F L F' x' L D y' U' L D y' R D y' L x L D y' L F", () => {
  const virtualization = new CubeEngine();
  virtualization.rotateU(false);
  virtualization.rotateU();
  virtualization.rotateL();
  virtualization.rotateR();
  virtualization.rotateD(false);
  virtualization.rotateF();
  virtualization.rotateL();
  virtualization.rotateF(false);
  virtualization.rotateX(false);
  virtualization.rotateL();
  virtualization.rotateD();
  virtualization.rotateY(false);
  virtualization.rotateU(false);
  virtualization.rotateL();
  virtualization.rotateD();
  virtualization.rotateY(false);
  virtualization.rotateR();
  virtualization.rotateD();
  virtualization.rotateY(false);
  virtualization.rotateL();
  virtualization.rotateX();
  virtualization.rotateL();
  virtualization.rotateD();
  virtualization.rotateY(false);
  virtualization.rotateL();
  virtualization.rotateF();
  const state = virtualization.state();
  const result = {
    UPPER: [
      [COLOR.O[0], COLOR.Y[1], COLOR.W[2]],
      [COLOR.Y[3], COLOR.R[4], COLOR.O[5]],
      [COLOR.O[6], COLOR.B[7], COLOR.G[8]],
    ],
    LEFT: [
      [COLOR.W[0], COLOR.B[1], COLOR.Y[2]],
      [COLOR.O[3], COLOR.B[4], COLOR.W[5]],
      [COLOR.B[6], COLOR.Y[7], COLOR.O[8]],
    ],
    FRONT: [
      [COLOR.G[0], COLOR.W[1], COLOR.Y[2]],
      [COLOR.R[3], COLOR.W[4], COLOR.O[5]],
      [COLOR.Y[6], COLOR.B[7], COLOR.G[8]],
    ],
    RIGHT: [
      [COLOR.R[0], COLOR.B[1], COLOR.B[2]],
      [COLOR.G[3], COLOR.G[4], COLOR.Y[5]],
      [COLOR.W[6], COLOR.G[7], COLOR.B[8]],
    ],
    BACK: [
      [COLOR.O[0], COLOR.R[1], COLOR.G[2]],
      [COLOR.O[3], COLOR.Y[4], COLOR.W[5]],
      [COLOR.R[6], COLOR.G[7], COLOR.R[8]],
    ],
    DOWN: [
      [COLOR.B[0], COLOR.R[1], COLOR.R[2]],
      [COLOR.G[3], COLOR.O[4], COLOR.R[5]],
      [COLOR.Y[6], COLOR.W[7], COLOR.W[8]],
    ],
  };
  expect(JSON.stringify(state)).toBe(JSON.stringify(result));
});


test("initialize with scramble by string: R U' F R2 D", () => {
  const scrambled = new CubeEngine("R U' F R2 D");

  const result = {
    UPPER: [[COLOR.G[0], COLOR.G[1], COLOR.G[2]], [COLOR.W[3], COLOR.W[4], COLOR.B[5]], [COLOR.O[6], COLOR.O[7], COLOR.B[8]]],
    LEFT: [[COLOR.W[0], COLOR.B[1], COLOR.Y[2]], [COLOR.O[3], COLOR.O[4], COLOR.Y[5]], [COLOR.O[6], COLOR.B[7], COLOR.B[8]]],
    FRONT: [[COLOR.G[0], COLOR.G[1], COLOR.W[2]], [COLOR.G[3], COLOR.G[4], COLOR.W[5]], [COLOR.O[6], COLOR.O[7], COLOR.B[8]]],
    RIGHT: [[COLOR.R[0], COLOR.R[1], COLOR.W[2]], [COLOR.R[3], COLOR.R[4], COLOR.W[5]], [COLOR.Y[6], COLOR.Y[7], COLOR.R[8]]],
    BACK: [[COLOR.O[0], COLOR.R[1], COLOR.R[2]], [COLOR.O[3], COLOR.B[4], COLOR.B[5]], [COLOR.Y[6], COLOR.G[7], COLOR.W[8]]],
    DOWN: [[COLOR.Y[0], COLOR.Y[1], COLOR.R[2]], [COLOR.Y[3], COLOR.Y[4], COLOR.R[5]], [COLOR.B[6], COLOR.W[7], COLOR.G[8]]]
  }
  expect(JSON.stringify(scrambled.state())).toBe(JSON.stringify(result));
});

test("applyMoves with record: false does not record history", () => {
  const cube = new CubeEngine();
  cube.applyMoves("R U' F R2 D");
  expect(cube.getMoves(false)).toHaveLength(0);
});

test("Dw equals y' U", () => {
  const a = new CubeEngine();
  const b = new CubeEngine();
  a.applyMoves("Dw", { record: false });
  b.applyMoves("y' U", { record: false });
  expect(JSON.stringify(a.state())).toBe(JSON.stringify(b.state()));
});

test("Dw' equals y U'", () => {
  const a = new CubeEngine();
  const b = new CubeEngine();
  a.applyMoves("Dw'", { record: false });
  b.applyMoves("y U'", { record: false });
  expect(JSON.stringify(a.state())).toBe(JSON.stringify(b.state()));
});

test("Dw2 equals Dw Dw", () => {
  const a = new CubeEngine();
  const b = new CubeEngine();
  a.applyMoves("Dw2", { record: false });
  b.applyMoves("Dw Dw", { record: false });
  expect(JSON.stringify(a.state())).toBe(JSON.stringify(b.state()));
});

test("applyMoves records Dw tokens when record: true", () => {
  const cube = new CubeEngine();
  cube.applyMoves("Dw Dw' Dw2", { record: true });
  // Dw2 should be recorded as two Dw quarter-turns
  expect(cube.getMoves(true)).toBe("Dw Dw' Dw Dw");
  expect(cube.getMoves(false)).toEqual(["Dw", "Dw'", "Dw", "Dw"]);
});

test("constructor scramble supports Dw and does not record history", () => {
  const cube = new CubeEngine("Dw Dw'");
  expect(cube.isSolved()).toBe(true);
  expect(cube.getMoves(false)).toHaveLength(0);
});

test("ROTATE Rw then Rw' returns to solved", () => {
  const cube = new CubeEngine();
  cube.rotateRw(true);
  cube.rotateRw(false);
  expect(cube.isSolved()).toBe(true);
});

test("applyMoves supports Rw and Rw' and records when requested", () => {
  const cube = new CubeEngine();
  cube.applyMoves("Rw Rw'", { record: true });
  expect(cube.isSolved()).toBe(true);
  expect(cube.getMoves(true)).toBe("Rw Rw'");
});

test("Rw equals x L", () => {
  const a = new CubeEngine();
  const b = new CubeEngine();
  a.applyMoves("Rw", { record: false });
  b.applyMoves("x L", { record: false });
  expect(JSON.stringify(a.state())).toBe(JSON.stringify(b.state()));
});

test("Rw' equals x' L'", () => {
  const a = new CubeEngine();
  const b = new CubeEngine();
  a.applyMoves("Rw'", { record: false });
  b.applyMoves("x' L'", { record: false });
  expect(JSON.stringify(a.state())).toBe(JSON.stringify(b.state()));
});

test("ROTATE M then M' returns to solved", () => {
  const cube = new CubeEngine();
  cube.rotateM(true);
  cube.rotateM(false);
  expect(cube.isSolved()).toBe(true);
});

test("applyMoves supports M and M' and records when requested", () => {
  const cube = new CubeEngine();
  cube.applyMoves("M M' M2", { record: true });
  // M2 should be recorded as two M quarter-turns
  expect(cube.getMoves(true)).toBe("M M' M M");
  expect(cube.getMoves(false)).toEqual(["M", "M'", "M", "M"]);
});

test("M equals Lw L'", () => {
  const a = new CubeEngine();
  const b = new CubeEngine();
  a.applyMoves("M", { record: false });
  b.applyMoves("Lw L'", { record: false });
  expect(JSON.stringify(a.state())).toBe(JSON.stringify(b.state()));
});

test("M' equals Lw' L", () => {
  const a = new CubeEngine();
  const b = new CubeEngine();
  a.applyMoves("M'", { record: false });
  b.applyMoves("Lw' L", { record: false });
  expect(JSON.stringify(a.state())).toBe(JSON.stringify(b.state()));
});

test("constructor scramble supports M and does not record history", () => {
  const cube = new CubeEngine("M M'");
  expect(cube.isSolved()).toBe(true);
  expect(cube.getMoves(false)).toHaveLength(0);
});
