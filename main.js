import { CubeEngine } from "./src/index.js";

window.CubeEngine = new CubeEngine();
render();

const player = document.querySelector("twisty-player");

const CE = window.CubeEngine;

const movesMap = {
  f: { move: () => CE.rotateU(false) },
  j: { move: () => CE.rotateU(true) },
  g: { move: () => CE.rotateF(false) },
  h: { move: () => CE.rotateF(true) },
  i: { move: () => CE.rotateR(true) },
  k: { move: () => CE.rotateR(false) },
  d: { move: () => CE.rotateL(true) },
  e: { move: () => CE.rotateL(false) },
  t: { move: () => CE.rotateX(true) },
  y: { move: () => CE.rotateX(true) },
  b: { move: () => CE.rotateX(false) },
  n: { move: () => CE.rotateX(false) },
  ñ: { move: () => CE.rotateY(true) },
  a: { move: () => CE.rotateY(false) },
  s: { move: () => CE.rotateD(true) },
  l: { move: () => CE.rotateD(false) },
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
    const moves = CE.getMoves(false);

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
