import { CubeEngine } from "./src/index.js";

window.CubeEngine = new CubeEngine();
render();

const player = document.querySelector("twisty-player");
const moves = [];

const CE = window.CubeEngine;

const movesMap = {
  f: { move: () => CE.rotateU(false), notation: "U'" },
  j: { move: () => CE.rotateU(true), notation: "U" },
  g: { move: () => CE.rotateF(false), notation: "F'" },
  h: { move: () => CE.rotateF(true), notation: "F" },
  i: { move: () => CE.rotateR(true), notation: "R" },
  k: { move: () => CE.rotateR(false), notation: "R'" },
  d: { move: () => CE.rotateL(true), notation: "L" },
  e: { move: () => CE.rotateL(false), notation: "L'" },
  t: { move: () => CE.rotateX(true), notation: "x" },
  y: { move: () => CE.rotateX(true), notation: "x" },
  b: { move: () => CE.rotateX(false), notation: "x'" },
  n: { move: () => CE.rotateX(false), notation: "x'" },
  ñ: { move: () => CE.rotateY(true), notation: "y" },
  a: { move: () => CE.rotateY(false), notation: "y'" },
  s: { move: () => CE.rotateD(true), notation: "D" },
  l: { move: () => CE.rotateD(false), notation: "D'" },
};

/**
 * Execute a move and update the UI.
 * @param {string} key - The key corresponding to the movement.
 */
function executeMove(key) {
  const moveObj = movesMap[key];

  if (moveObj) {
    // Execute the movement
    moveObj.move();
    moves.push(moveObj.notation);

    // Update the user interface
    document.querySelector("#total").textContent = moves.length;
    document.querySelector("#moves").textContent = moves.join(" ");
    document.querySelector(
      "#is-solve"
    ).textContent = `${window.CubeEngine.isSolved()}`;
    player.alg = moves.join(" ");
    render();
  }
}

// setInterval for random movements
setInterval(() => {
  const keys = Object.keys(movesMap);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  executeMove(randomKey);
}, 250);

/**
 * Key listener for cube movements.
 */
document.addEventListener("keyup", (e) => {
  const key = e.key.toLowerCase();
  executeMove(key);
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
