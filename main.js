import { CubeEngine } from "./src/index.js";

const v = new CubeEngine();
v.state();
/**
 * Key listener for cube movements.
 */
addEventListener("keyup", (e) => {
  const movesMap = {
    f: () => v.rotateU(false), // F -> U'
    j: () => v.rotateU(true), // J -> U
    g: () => v.rotateF(false), // G -> F'
    h: () => v.rotateF(true), // H -> F
    i: () => v.rotateR(true), // I -> R
    k: () => v.rotateR(false), // K -> R'
    d: () => v.rotateL(true), // D -> L
    e: () => v.rotateL(false), // E -> L'
  };

  const move = movesMap[e.key.toLowerCase()];
  if (move) {
    move();
    console.log(v.state());
  }
});
