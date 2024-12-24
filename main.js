import { CubeEngine } from "./src/index.js";

window.CubeEngine = new CubeEngine();
render();

const player = document.querySelector("twisty-player");
const moves = [];

/**
 * Key listener for cube movements.
 */
document.addEventListener("keyup", (e) => {
  const movesMap = {
    f: { move: () => window.CubeEngine.rotateU(false), notation: "U'" },
    j: { move: () => window.CubeEngine.rotateU(true), notation: "U" },
    g: { move: () => window.CubeEngine.rotateF(false), notation: "F'" },
    h: { move: () => window.CubeEngine.rotateF(true), notation: "F" },
    i: { move: () => window.CubeEngine.rotateR(true), notation: "R" },
    k: { move: () => window.CubeEngine.rotateR(false), notation: "R'" },
    d: { move: () => window.CubeEngine.rotateL(true), notation: "L" },
    e: { move: () => window.CubeEngine.rotateL(false), notation: "L'" },
    t: { move: () => window.CubeEngine.rotateX(true), notation: "x" },
    y: { move: () => window.CubeEngine.rotateX(true), notation: "x" },
    b: { move: () => window.CubeEngine.rotateX(false), notation: "x'" },
    n: { move: () => window.CubeEngine.rotateX(false), notation: "x'" },
    ñ: { move: () => window.CubeEngine.rotateY(true), notation: "y" },
    a: { move: () => window.CubeEngine.rotateY(false), notation: "y'" },
  };

  const key = e.key.toLowerCase();
  const moveObj = movesMap[key];

  if (moveObj) {
    moveObj.move();
    moves.push(moveObj.notation);

    // sync UI
    document.querySelector("#total").textContent = moves.length;
    document.querySelector("#moves").textContent = moves.join(" ");
    document.querySelector("#is-solve").textContent = `${false}`;
    player.alg = moves.join(" ");
    render();
  }
});

function render() {
  const state = window.CubeEngine.state();
  Object.keys(state).forEach((layer) => {
    const layerContent = state[layer]
      .map(
        (row) =>
          `<div>${row.map((cell) => `<span>${cell}</span>`).join("")}</div>`
      )
      .join("");

    document.querySelector(`#${layer}`).innerHTML = layerContent;
  });
}
