// Face order used across the flat sticker representation.
// Index: 0=UPPER 1=LEFT 2=FRONT 3=RIGHT 4=BACK 5=DOWN
const FACE_NAMES = ["UPPER", "LEFT", "FRONT", "RIGHT", "BACK", "DOWN"];
const FACE_COLORS = ["W", "O", "G", "R", "B", "Y"];

// Moves that only affect inner/double layers and therefore are no-ops on a 2x2.
const NOOP_SIZE2 = new Set(["Uw", "Dw", "Rw", "Lw", "Fw", "M", "E", "S"]);

// Maps each move key to the oracle method that performs it.
const MOVE_FNS = {
  U: "rotateU",
  D: "rotateD",
  L: "rotateL",
  R: "rotateR",
  F: "rotateF",
  B: "rotateB",
  x: "rotateX",
  y: "rotateY",
  z: "rotateZ",
  M: "rotateM",
  E: "rotateE",
  S: "rotateS",
  Uw: "rotateUw",
  Dw: "rotateDw",
  Rw: "rotateRw",
  Lw: "rotateLw",
  Fw: "rotateFw",
};

// Permutation tables are derived once per cube size and shared across instances.
const PERM_CACHE = new Map();

/**
 * Reference (matrix-based) cube used only to derive permutation tables.
 *
 * It reproduces the exact rotation algorithm the engine has always used, but
 * operates on integer sticker tags (the flat index each sticker starts at).
 * Applying a move and flattening the result yields a permutation array `perm`
 * such that `newState[i] = oldState[perm[i]]`. This runs a handful of times per
 * size at module load and is then cached, so the runtime hot path never touches
 * matrices, structuredClone, or move composition.
 */
class _OracleCube {
  constructor(size) {
    this.size = size;
    this.STATES = {};
    for (let f = 0; f < FACE_NAMES.length; f++) {
      const face = [];
      for (let r = 0; r < size; r++) {
        const row = [];
        for (let c = 0; c < size; c++) {
          row.push(f * size * size + r * size + c);
        }
        face.push(row);
      }
      this.STATES[FACE_NAMES[f]] = face;
    }
  }

  // Concatenate every face row-major into a single flat array of tags.
  flatten() {
    const out = [];
    for (const name of FACE_NAMES) {
      const face = this.STATES[name];
      for (let r = 0; r < this.size; r++) {
        for (let c = 0; c < this.size; c++) {
          out.push(face[r][c]);
        }
      }
    }
    return out;
  }

  switchMatrix(matrix, clockwise = true) {
    const clone = structuredClone(matrix);
    const size = this.size;

    let tempMatrix = [];
    for (let i = 0; i < size; i++) {
      tempMatrix = [...tempMatrix, ...clone[i]];
    }

    if (size === 2) {
      if (clockwise) {
        return [
          [tempMatrix[2], tempMatrix[0]],
          [tempMatrix[3], tempMatrix[1]],
        ];
      } else {
        return [
          [tempMatrix[1], tempMatrix[3]],
          [tempMatrix[0], tempMatrix[2]],
        ];
      }
    } else {
      if (clockwise) {
        return [
          [tempMatrix[6], tempMatrix[3], tempMatrix[0]],
          [tempMatrix[7], tempMatrix[4], tempMatrix[1]],
          [tempMatrix[8], tempMatrix[5], tempMatrix[2]],
        ];
      } else {
        return [
          [tempMatrix[2], tempMatrix[5], tempMatrix[8]],
          [tempMatrix[1], tempMatrix[4], tempMatrix[7]],
          [tempMatrix[0], tempMatrix[3], tempMatrix[6]],
        ];
      }
    }
  }

  specialFlip(matrix) {
    return structuredClone(matrix)
      .reverse()
      .map((row) => [...row].reverse());
  }

  rotateU(clockwise = true) {
    if (clockwise) {
      this.STATES.UPPER = this.switchMatrix(this.STATES.UPPER, true);

      const tempFront = [...this.STATES.FRONT[0]];
      const tempRight = [...this.STATES.RIGHT[0]];
      const tempLeft = [...this.STATES.LEFT[0]];
      const tempBack = [...this.STATES.BACK[0]];

      this.STATES.FRONT[0] = [...tempRight];
      this.STATES.LEFT[0] = [...tempFront];
      this.STATES.BACK[0] = [...tempLeft];
      this.STATES.RIGHT[0] = [...tempBack];
    } else {
      this.STATES.UPPER = this.switchMatrix(this.STATES.UPPER, false);

      const tempFront = [...this.STATES.FRONT[0]];
      const tempRight = [...this.STATES.RIGHT[0]];
      const tempLeft = [...this.STATES.LEFT[0]];
      const tempBack = [...this.STATES.BACK[0]];

      this.STATES.FRONT[0] = [...tempLeft];
      this.STATES.LEFT[0] = [...tempBack];
      this.STATES.BACK[0] = [...tempRight];
      this.STATES.RIGHT[0] = [...tempFront];
    }
  }

  rotateF(clockwise = true) {
    if (clockwise) {
      this.rotateX(true);
      this.rotateU(true);
      this.rotateX(false);
    } else {
      this.rotateX(true);
      this.rotateU(false);
      this.rotateX(false);
    }
  }

  rotateB(clockwise = true) {
    this.rotateY(true);
    this.rotateY(true);
    if (clockwise) {
      this.rotateF(true);
    } else {
      this.rotateF(false);
    }
    this.rotateY(false);
    this.rotateY(false);
  }

  rotateR(clockwise = true) {
    if (clockwise) {
      this.rotateY(true);
      this.rotateX(true);
      this.rotateU(true);
      this.rotateX(false);
      this.rotateY(false);
    } else {
      this.rotateY(true);
      this.rotateX(true);
      this.rotateU(false);
      this.rotateX(false);
      this.rotateY(false);
    }
  }

  rotateL(clockwise = true) {
    if (clockwise) {
      this.rotateY(false);
      this.rotateX(true);
      this.rotateU(true);
      this.rotateX(false);
      this.rotateY(true);
    } else {
      this.rotateY(false);
      this.rotateX(true);
      this.rotateU(false);
      this.rotateX(false);
      this.rotateY(true);
    }
  }

  rotateD(clockwise = true) {
    if (clockwise) {
      this.rotateX(true);
      this.rotateF(true);
      this.rotateX(false);
    } else {
      this.rotateX(true);
      this.rotateF(false);
      this.rotateX(false);
    }
  }

  rotateDw(clockwise = true) {
    if (this.size === 2) return;
    if (clockwise) {
      this.rotateY(false);
      this.rotateU(true);
    } else {
      this.rotateY(true);
      this.rotateU(false);
    }
  }

  rotateUw(clockwise = true) {
    if (this.size === 2) return;
    if (clockwise) {
      this.rotateY(true);
      this.rotateD(true);
    } else {
      this.rotateY(false);
      this.rotateD(false);
    }
  }

  rotateRw(clockwise = true) {
    if (this.size === 2) return;
    if (clockwise) {
      this.rotateX(true);
      this.rotateL(true);
    } else {
      this.rotateX(false);
      this.rotateL(false);
    }
  }

  rotateLw(clockwise = true) {
    if (this.size === 2) return;
    if (clockwise) {
      this.rotateX(false);
      this.rotateR(true);
    } else {
      this.rotateX(true);
      this.rotateR(false);
    }
  }

  rotateM(clockwise = true) {
    if (this.size === 2) return;
    if (clockwise) {
      this.rotateLw(true);
      this.rotateL(false);
    } else {
      this.rotateLw(false);
      this.rotateL(true);
    }
  }

  rotateE(clockwise = true) {
    if (this.size === 2) return;
    if (clockwise) {
      this.rotateDw(true);
      this.rotateD(false);
    } else {
      this.rotateDw(false);
      this.rotateD(true);
    }
  }

  rotateFw(clockwise = true) {
    if (this.size === 2) return;
    if (clockwise) {
      this.rotateZ(true);
      this.rotateB(true);
    } else {
      this.rotateZ(false);
      this.rotateB(false);
    }
  }

  rotateS(clockwise = true) {
    if (this.size === 2) return;
    if (clockwise) {
      this.rotateFw(true);
      this.rotateF(false);
    } else {
      this.rotateFw(false);
      this.rotateF(true);
    }
  }

  rotateX(clockwise = true) {
    const tempFront = structuredClone(this.STATES.FRONT);
    const tempDown = structuredClone(this.STATES.DOWN);
    const tempUpper = structuredClone(this.STATES.UPPER);
    const tempBack = structuredClone(this.STATES.BACK);
    const tempLeft = structuredClone(this.STATES.LEFT);
    const tempRight = structuredClone(this.STATES.RIGHT);

    if (clockwise) {
      this.STATES.LEFT = this.switchMatrix(tempLeft, false);
      this.STATES.RIGHT = this.switchMatrix(tempRight, true);

      this.STATES.FRONT = [...tempDown];
      this.STATES.UPPER = [...tempFront];

      this.STATES.BACK = this.specialFlip(tempUpper);
      this.STATES.DOWN = this.specialFlip(tempBack);
    } else {
      this.STATES.LEFT = this.switchMatrix(tempLeft, true);
      this.STATES.RIGHT = this.switchMatrix(tempRight, false);

      this.STATES.FRONT = [...tempUpper];
      this.STATES.DOWN = [...tempFront];

      this.STATES.BACK = this.specialFlip(tempDown);
      this.STATES.UPPER = this.specialFlip(tempBack);
    }
  }

  rotateZ(clockwise = true) {
    const tempUpper = structuredClone(this.STATES.UPPER);
    const tempRight = structuredClone(this.STATES.RIGHT);
    const tempDown = structuredClone(this.STATES.DOWN);
    const tempLeft = structuredClone(this.STATES.LEFT);
    const tempFront = structuredClone(this.STATES.FRONT);
    const tempBack = structuredClone(this.STATES.BACK);

    if (clockwise) {
      this.STATES.FRONT = this.switchMatrix(tempFront, true);
      this.STATES.BACK = this.switchMatrix(tempBack, false);

      this.STATES.RIGHT = this.switchMatrix(tempUpper, true);
      this.STATES.DOWN = this.switchMatrix(tempRight, true);
      this.STATES.LEFT = this.switchMatrix(tempDown, true);
      this.STATES.UPPER = this.switchMatrix(tempLeft, true);
    } else {
      this.STATES.FRONT = this.switchMatrix(tempFront, false);
      this.STATES.BACK = this.switchMatrix(tempBack, true);

      this.STATES.RIGHT = this.switchMatrix(tempDown, false);
      this.STATES.DOWN = this.switchMatrix(tempLeft, false);
      this.STATES.LEFT = this.switchMatrix(tempUpper, false);
      this.STATES.UPPER = this.switchMatrix(tempRight, false);
    }
  }

  rotateY(clockwise = true) {
    const tempFront = structuredClone(this.STATES.FRONT);
    const tempRight = structuredClone(this.STATES.RIGHT);
    const tempBack = structuredClone(this.STATES.BACK);
    const tempLeft = structuredClone(this.STATES.LEFT);

    if (clockwise) {
      this.STATES.UPPER = this.switchMatrix(this.STATES.UPPER, true);
      this.STATES.DOWN = this.switchMatrix(this.STATES.DOWN, false);

      this.STATES.FRONT = [...tempRight];
      this.STATES.RIGHT = [...tempBack];
      this.STATES.LEFT = [...tempFront];
      this.STATES.BACK = [...tempLeft];
    } else {
      this.STATES.UPPER = this.switchMatrix(this.STATES.UPPER, false);
      this.STATES.DOWN = this.switchMatrix(this.STATES.DOWN, true);

      this.STATES.FRONT = [...tempLeft];
      this.STATES.RIGHT = [...tempFront];
      this.STATES.LEFT = [...tempBack];
      this.STATES.BACK = [...tempRight];
    }
  }
}

// Build a single move's permutation by applying it to a tagged oracle cube.
function buildPerm(size, fnName, clockwise) {
  const oracle = new _OracleCube(size);
  oracle[fnName](clockwise);
  return oracle.flatten();
}

// Build (and cache) the full clockwise/counterclockwise permutation set for a size.
function getPerms(size) {
  if (PERM_CACHE.has(size)) return PERM_CACHE.get(size);
  const perms = {};
  for (const key of Object.keys(MOVE_FNS)) {
    perms[key] = {
      cw: buildPerm(size, MOVE_FNS[key], true),
      ccw: buildPerm(size, MOVE_FNS[key], false),
    };
  }
  PERM_CACHE.set(size, perms);
  return perms;
}

/**
 * Exposes the (cached) permutation tables for a given cube size.
 *
 * Each entry maps a move key to `{ cw, ccw }` permutation arrays such that
 * `newState[i] = oldState[perm[i]]`. This is primarily an advanced/introspection
 * helper: the solution analyzer uses it to derive the cube's sticker adjacency
 * (which stickers form each edge/corner) without hardcoding any geometry.
 *
 * @param {number} size - 2 or 3 (defaults to 3).
 * @returns {Object<string, {cw: number[], ccw: number[]}>}
 */
export function getMovePermutations(size = 3) {
  const allowedSizes = [2, 3];
  return getPerms(allowedSizes.includes(size) ? size : 3);
}

export class CubeEngine {
  MOVES = [];
  size = 3;
  #stickers = [];
  #perms = null;

  constructor(initialScramble = "", options = { size: 3 }) {
    const allowedSizes = [2, 3];
    this.size = allowedSizes.includes(options.size) ? options.size : 3;
    this.#perms = getPerms(this.size);

    this.#initializeState();

    // If an initial scramble string is provided, apply it without recording moves
    if (typeof initialScramble === "string" && initialScramble.trim().length > 0) {
      this.#applyMovesFromString(initialScramble, false);
      this.MOVES = [];
    }
  }

  #initializeState() {
    const per = this.size * this.size;
    const stickers = new Array(FACE_COLORS.length * per);
    for (let f = 0; f < FACE_COLORS.length; f++) {
      const color = FACE_COLORS[f];
      const base = f * per;
      for (let i = 0; i < per; i++) {
        stickers[base + i] = color;
      }
    }
    this.#stickers = stickers;
  }

  // Apply a precomputed permutation: newState[i] = oldState[perm[i]].
  #applyPerm(perm) {
    const current = this.#stickers;
    const next = new Array(current.length);
    for (let i = 0; i < current.length; i++) {
      next[i] = current[perm[i]];
    }
    this.#stickers = next;
  }

  // Core move dispatch. dir is "cw" or "ccw"; record controls history logging.
  #apply(key, dir, record) {
    if (this.size === 2 && NOOP_SIZE2.has(key)) return;
    this.#applyPerm(this.#perms[key][dir]);
    if (record) this.MOVES.push(dir === "ccw" ? key + "'" : key);
  }

  // Build a single face matrix from the flat sticker array.
  #faceMatrix(faceIndex) {
    const size = this.size;
    const base = faceIndex * size * size;
    const matrix = [];
    for (let r = 0; r < size; r++) {
      const row = [];
      for (let c = 0; c < size; c++) {
        row.push(this.#stickers[base + r * size + c]);
      }
      matrix.push(row);
    }
    return matrix;
  }

  /**
   * Rotates the (UPPER) layer clockwise or counterclockwise.
   */
  rotateU(clockwise = true) {
    this.#apply("U", clockwise ? "cw" : "ccw", true);
  }

  /**
   * Rotates the (FRONT) layer clockwise or counterclockwise.
   */
  rotateF(clockwise = true) {
    this.#apply("F", clockwise ? "cw" : "ccw", true);
  }

  /**
   * Rotates the (BACK) layer clockwise or counterclockwise.
   */
  rotateB(clockwise = true) {
    this.#apply("B", clockwise ? "cw" : "ccw", true);
  }

  /**
   * Rotates the (RIGHT) layer clockwise or counterclockwise.
   */
  rotateR(clockwise = true) {
    this.#apply("R", clockwise ? "cw" : "ccw", true);
  }

  /**
   * Rotates the (LEFT) layer clockwise or counterclockwise.
   */
  rotateL(clockwise = true) {
    this.#apply("L", clockwise ? "cw" : "ccw", true);
  }

  /**
   * Rotates the (DOWN) layer clockwise or counterclockwise.
   */
  rotateD(clockwise = true) {
    this.#apply("D", clockwise ? "cw" : "ccw", true);
  }

  /**
   * Rotates the wide (DOWN two layers) clockwise or counterclockwise.
   */
  rotateDw(clockwise = true) {
    this.#apply("Dw", clockwise ? "cw" : "ccw", true);
  }

  /**
   * Rotates the wide (UPPER two layers) clockwise or counterclockwise.
   */
  rotateUw(clockwise = true) {
    this.#apply("Uw", clockwise ? "cw" : "ccw", true);
  }

  /**
   * Rotates the wide (RIGHT two layers) clockwise or counterclockwise.
   */
  rotateRw(clockwise = true) {
    this.#apply("Rw", clockwise ? "cw" : "ccw", true);
  }

  /**
   * Rotates the wide (LEFT two layers) clockwise or counterclockwise.
   */
  rotateLw(clockwise = true) {
    this.#apply("Lw", clockwise ? "cw" : "ccw", true);
  }

  /**
   * Rotates the middle slice (M) parallel to L/R. Clockwise corresponds to Lw followed by L'.
   */
  rotateM(clockwise = true) {
    this.#apply("M", clockwise ? "cw" : "ccw", true);
  }

  /**
   * Rotates the equatorial slice (E) parallel to U/D. Clockwise follows the D direction (E = Dw D').
   */
  rotateE(clockwise = true) {
    this.#apply("E", clockwise ? "cw" : "ccw", true);
  }

  /**
   * Rotates the wide (FRONT two layers) clockwise or counterclockwise. Equivalent to z B.
   */
  rotateFw(clockwise = true) {
    this.#apply("Fw", clockwise ? "cw" : "ccw", true);
  }

  /**
   * Rotates the standing slice (S) parallel to F/B. Clockwise follows the F direction (S = Fw F').
   */
  rotateS(clockwise = true) {
    this.#apply("S", clockwise ? "cw" : "ccw", true);
  }

  /**
   * Rotates the (x) axis clockwise or counterclockwise.
   */
  rotateX(clockwise = true) {
    this.#apply("x", clockwise ? "cw" : "ccw", true);
  }

  /**
   * Rotates the (z) axis clockwise or counterclockwise.
   */
  rotateZ(clockwise = true) {
    this.#apply("z", clockwise ? "cw" : "ccw", true);
  }

  /**
   * Rotates the (y) axis clockwise or counterclockwise.
   */
  rotateY(clockwise = true) {
    this.#apply("y", clockwise ? "cw" : "ccw", true);
  }

  /**
   * Logs the current state of the cube.
   */
  state() {
    return {
      UPPER: this.#faceMatrix(0),
      LEFT: this.#faceMatrix(1),
      FRONT: this.#faceMatrix(2),
      RIGHT: this.#faceMatrix(3),
      BACK: this.#faceMatrix(4),
      DOWN: this.#faceMatrix(5),
    };
  }

  /**
   * Indicates if the cube is solve or not in all layers.
   */
  isSolved() {
    const per = this.size * this.size;
    // 2x2 has no center, so use the first sticker; 3x3 uses the center (index 4).
    const centerOffset = this.size === 2 ? 0 : 4;
    for (let f = 0; f < FACE_COLORS.length; f++) {
      const base = f * per;
      const centerColor = this.#stickers[base + centerOffset];
      for (let i = 0; i < per; i++) {
        if (this.#stickers[base + i] !== centerColor) return false;
      }
    }
    return true;
  }

  /**
   * Returns the history of all movements made.
   *
   * @param {boolean} asString - If true, returns the history as a string; otherwise, returns it as an array.
   * @returns {string|array} The history of movements as an array or string.
   */
  getMoves(asString = true) {
    return asString ? this.MOVES.join(" ") : this.MOVES;
  }

  /**
   * Resets the cube to the solved state and clears the move history.
   */
  reset() {
    this.#initializeState();
    this.MOVES = [];
  }

  /**
   * Applies a sequence of moves provided as a string.
   * Supports: U, D, L, R, F, B, x, y, z; slice moves: M, E, S; and wide moves: Dw, Uw, Rw, Lw, Fw with optional ' for counterclockwise and 2 for double turns.
   * @param {string} sequence - e.g. "R U' F R2 D Dw Uw Rw Rw' Lw Lw2 M M' M2 E E' S S2 Fw"
   * @param {object} options - { record: boolean } whether to record moves in history (default true)
   */
  applyMoves(sequence, options = { record: false }) {
    const record = options?.record !== false;
    this.#applyMovesFromString(sequence, record);
  }

  // Internal: parses and applies moves, optionally recording them in history.
  #applyMovesFromString(sequence, record = true) {
    if (typeof sequence !== "string") return;
    const tokens = sequence
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    for (const token of tokens) {
      const base = token[0];
      const rest = token.slice(1);
      const isDouble = rest.includes("2");
      const isPrime = rest.includes("'");
      const isWide = /w/i.test(rest);

      let key;
      switch (base) {
        case "U":
          key = isWide ? "Uw" : "U";
          break;
        case "D":
          key = isWide ? "Dw" : "D";
          break;
        case "L":
          key = isWide ? "Lw" : "L";
          break;
        case "R":
          key = isWide ? "Rw" : "R";
          break;
        case "F":
          key = isWide ? "Fw" : "F";
          break;
        case "B":
          key = "B";
          break;
        case "x":
          key = "x";
          break;
        case "y":
          key = "y";
          break;
        case "z":
          key = "z";
          break;
        case "M":
          key = "M";
          break;
        case "E":
          key = "E";
          break;
        case "S":
          key = "S";
          break;
        default:
          // Unsupported token. Ignore silently for now.
          continue;
      }

      if (isDouble) {
        this.#apply(key, "cw", record);
        this.#apply(key, "cw", record);
      } else if (isPrime) {
        this.#apply(key, "ccw", record);
      } else {
        this.#apply(key, "cw", record);
      }
    }
  }
}

export const COLOR = {
  W: ["W", "W", "W", "W", "W", "W", "W", "W", "W"],
  G: ["G", "G", "G", "G", "G", "G", "G", "G", "G"],
  R: ["R", "R", "R", "R", "R", "R", "R", "R", "R"],
  B: ["B", "B", "B", "B", "B", "B", "B", "B", "B"],
  O: ["O", "O", "O", "O", "O", "O", "O", "O", "O"],
  Y: ["Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y"],
};

// Solution analysis utilities (cross / F2L / OLL / PLL timing, CFOP detection).
export { analyzeSolution, invertSequence } from "./analyzer.js";

// Move-sequence simplifier (joins identical quarter turns into doubles).
export { simplifyMoves } from "./simplify.js";

// Reusable state predicates + derived geometry. These accept a CubeEngine, a
// state() object, or a flat sticker array, and power goal detection in trainers
// (last-layer orientation, F2L, cross, solved, ...) as well as the analyzer.
export {
  getCubeGeometry,
  isLastLayerOriented,
  areLastLayerCornersSolved,
  isCrossComplete,
  isF2LComplete,
  isCubeSolved,
  matchesGoal,
  // Low-level flat-state helpers (advanced/introspection use).
  buildGeometry,
  flattenState,
  centersOf,
  slotCorrect,
  isSolvedFlat,
  crossDone,
  f2lSlotStates,
  ollDone,
  faceUniform,
  cornersSolvedOnFace,
} from "./predicates.js";
