import { CubeEngine } from "./src/index.js";

const v = new CubeEngine();
v.state();
const player = document.querySelector("twisty-player");

const moves = [];
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
    t: () => v.rotateX(true), // T -> X
    y: () => v.rotateX(true), // Y -> X
    b: () => v.rotateX(false), // B -> X'
    n: () => v.rotateX(false), // N -> X'
    ñ: () => v.rotateY(true), // Ñ / ; -> Y
    a: () => v.rotateY(false), // A -> Y'
  };

  const move = movesMap[e.key.toLowerCase()];
  if (move) {
    console.log(move);
    switch (`${move}`) {
      case "() => v.rotateU(false)":
        moves.push("U'");
        break;
      case "() => v.rotateU(true)":
        moves.push("U");
        break;
      case "() => v.rotateF(false)":
        moves.push("F'");
        break;
      case "() => v.rotateF(true)":
        moves.push("F");
        break;
      case "() => v.rotateR(true)":
        moves.push("R");
        break;
      case "() => v.rotateR(false)":
        moves.push("R'");
        break;
      case "() => v.rotateL(true)":
        moves.push("L");
        break;
      case "() => v.rotateL(false)":
        moves.push("L'");
        break;
      case "() => v.rotateX(true)":
        moves.push("x");
        break;
      case "() => v.rotateX(true)":
        moves.push("x");
        break;
      case "() => v.rotateX(false)":
        moves.push("x'");
        break;
      case "() => v.rotateX(false)":
        moves.push("x'");
        break;
      case "() => v.rotateY(true)":
        moves.push("y");
        break;
      case "() => v.rotateY(false)":
        moves.push("y'");
        break;
    }

    document.querySelector("#total").textContent = moves.length;
    document.querySelector("#moves").textContent = moves.join(" ");
    document.querySelector("#is-solve").textContent = `${false}`;
    player.alg = moves.join(" ");
    console.log(v.state());
  }
});
