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
  const state = virtualization.rotateF();
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
