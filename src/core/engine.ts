// The cube itself: a flat sticker array plus precomputed permutation tables.
// A move is one array remap, so tracking a solve never allocates matrices.

import type {
  Color,
  CubeSize,
  CubeState,
  MoveKey,
  MovePermutations,
  Permutation,
  TurnDirection,
} from "../types.js";
import { FACE_COLORS, NOOP_SIZE2, normalizeSize } from "./constants.js";
import { getPerms } from "./permutations.js";

/** Notation token -> move key, resolving wide variants. */
const TOKEN_TO_KEY: Record<string, { plain: MoveKey; wide?: MoveKey }> = {
  U: { plain: "U", wide: "Uw" },
  D: { plain: "D", wide: "Dw" },
  L: { plain: "L", wide: "Lw" },
  R: { plain: "R", wide: "Rw" },
  F: { plain: "F", wide: "Fw" },
  B: { plain: "B" },
  x: { plain: "x" },
  y: { plain: "y" },
  z: { plain: "z" },
  M: { plain: "M" },
  E: { plain: "E" },
  S: { plain: "S" },
};

export interface CubeEngineOptions {
  size?: CubeSize;
}

export interface ApplyMovesOptions {
  record?: boolean;
}

export class CubeEngine {
  MOVES: string[] = [];
  size: CubeSize = 3;
  #stickers: Color[] = [];
  #perms: MovePermutations;

  constructor(
    initialScramble: string = "",
    options: CubeEngineOptions = { size: 3 }
  ) {
    this.size = normalizeSize(options?.size);
    this.#perms = getPerms(this.size);

    this.#initializeState();

    // If an initial scramble string is provided, apply it without recording moves
    if (typeof initialScramble === "string" && initialScramble.trim().length > 0) {
      this.#applyMovesFromString(initialScramble, false);
      this.MOVES = [];
    }
  }

  #initializeState(): void {
    const per = this.size * this.size;
    const stickers = new Array<Color>(FACE_COLORS.length * per);
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
  #applyPerm(perm: Permutation): void {
    const current = this.#stickers;
    const next = new Array<Color>(current.length);
    for (let i = 0; i < current.length; i++) {
      next[i] = current[perm[i]];
    }
    this.#stickers = next;
  }

  // Core move dispatch. dir is "cw" or "ccw"; record controls history logging.
  #apply(key: MoveKey, dir: TurnDirection, record: boolean): void {
    if (this.size === 2 && NOOP_SIZE2.has(key)) return;
    this.#applyPerm(this.#perms[key][dir]);
    if (record) this.MOVES.push(dir === "ccw" ? key + "'" : key);
  }

  // Build a single face matrix from the flat sticker array.
  #faceMatrix(faceIndex: number): Color[][] {
    const size = this.size;
    const base = faceIndex * size * size;
    const matrix: Color[][] = [];
    for (let r = 0; r < size; r++) {
      const row: Color[] = [];
      for (let c = 0; c < size; c++) {
        row.push(this.#stickers[base + r * size + c]);
      }
      matrix.push(row);
    }
    return matrix;
  }

  /** Rotates the (UPPER) layer clockwise or counterclockwise. */
  rotateU(clockwise = true): void {
    this.#apply("U", clockwise ? "cw" : "ccw", true);
  }

  /** Rotates the (FRONT) layer clockwise or counterclockwise. */
  rotateF(clockwise = true): void {
    this.#apply("F", clockwise ? "cw" : "ccw", true);
  }

  /** Rotates the (BACK) layer clockwise or counterclockwise. */
  rotateB(clockwise = true): void {
    this.#apply("B", clockwise ? "cw" : "ccw", true);
  }

  /** Rotates the (RIGHT) layer clockwise or counterclockwise. */
  rotateR(clockwise = true): void {
    this.#apply("R", clockwise ? "cw" : "ccw", true);
  }

  /** Rotates the (LEFT) layer clockwise or counterclockwise. */
  rotateL(clockwise = true): void {
    this.#apply("L", clockwise ? "cw" : "ccw", true);
  }

  /** Rotates the (DOWN) layer clockwise or counterclockwise. */
  rotateD(clockwise = true): void {
    this.#apply("D", clockwise ? "cw" : "ccw", true);
  }

  /** Rotates the wide (DOWN two layers) clockwise or counterclockwise. */
  rotateDw(clockwise = true): void {
    this.#apply("Dw", clockwise ? "cw" : "ccw", true);
  }

  /** Rotates the wide (UPPER two layers) clockwise or counterclockwise. */
  rotateUw(clockwise = true): void {
    this.#apply("Uw", clockwise ? "cw" : "ccw", true);
  }

  /** Rotates the wide (RIGHT two layers) clockwise or counterclockwise. */
  rotateRw(clockwise = true): void {
    this.#apply("Rw", clockwise ? "cw" : "ccw", true);
  }

  /** Rotates the wide (LEFT two layers) clockwise or counterclockwise. */
  rotateLw(clockwise = true): void {
    this.#apply("Lw", clockwise ? "cw" : "ccw", true);
  }

  /**
   * Rotates the middle slice (M) parallel to L/R. Clockwise corresponds to Lw
   * followed by L'.
   */
  rotateM(clockwise = true): void {
    this.#apply("M", clockwise ? "cw" : "ccw", true);
  }

  /**
   * Rotates the equatorial slice (E) parallel to U/D. Clockwise follows the D
   * direction (E = Dw D').
   */
  rotateE(clockwise = true): void {
    this.#apply("E", clockwise ? "cw" : "ccw", true);
  }

  /**
   * Rotates the wide (FRONT two layers) clockwise or counterclockwise.
   * Equivalent to z B.
   */
  rotateFw(clockwise = true): void {
    this.#apply("Fw", clockwise ? "cw" : "ccw", true);
  }

  /**
   * Rotates the standing slice (S) parallel to F/B. Clockwise follows the F
   * direction (S = Fw F').
   */
  rotateS(clockwise = true): void {
    this.#apply("S", clockwise ? "cw" : "ccw", true);
  }

  /** Rotates the (x) axis clockwise or counterclockwise. */
  rotateX(clockwise = true): void {
    this.#apply("x", clockwise ? "cw" : "ccw", true);
  }

  /** Rotates the (z) axis clockwise or counterclockwise. */
  rotateZ(clockwise = true): void {
    this.#apply("z", clockwise ? "cw" : "ccw", true);
  }

  /** Rotates the (y) axis clockwise or counterclockwise. */
  rotateY(clockwise = true): void {
    this.#apply("y", clockwise ? "cw" : "ccw", true);
  }

  /** The current state of the cube, one matrix per face. */
  state(): CubeState {
    return {
      UPPER: this.#faceMatrix(0),
      LEFT: this.#faceMatrix(1),
      FRONT: this.#faceMatrix(2),
      RIGHT: this.#faceMatrix(3),
      BACK: this.#faceMatrix(4),
      DOWN: this.#faceMatrix(5),
    };
  }

  /** Whether every layer of the cube is solved. */
  isSolved(): boolean {
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
   * The history of all movements made.
   * @param asString - If true (default), returns the history as a string;
   *   otherwise as an array of tokens.
   */
  getMoves(asString?: true): string;
  getMoves(asString: false): string[];
  getMoves(asString: boolean = true): string | string[] {
    return asString ? this.MOVES.join(" ") : this.MOVES;
  }

  /** Resets the cube to the solved state and clears the move history. */
  reset(): void {
    this.#initializeState();
    this.MOVES = [];
  }

  /**
   * Applies a sequence of moves provided as a string.
   *
   * Supports U, D, L, R, F, B; rotations x, y, z; slices M, E, S; and wide
   * moves Dw, Uw, Rw, Lw, Fw, with optional `'` for counterclockwise and `2`
   * for double turns.
   *
   * @param sequence - e.g. "R U' F R2 D Dw Uw Rw Lw2 M' E S2 Fw"
   * @param options - `{ record }` controls history logging.
   */
  applyMoves(
    sequence: string,
    options: ApplyMovesOptions = { record: false }
  ): void {
    const record = options?.record !== false;
    this.#applyMovesFromString(sequence, record);
  }

  // Internal: parses and applies moves, optionally recording them in history.
  #applyMovesFromString(sequence: string, record = true): void {
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

      const entry = TOKEN_TO_KEY[base];
      // Unsupported token. Ignore silently for now.
      if (!entry) continue;
      const key = isWide && entry.wide ? entry.wide : entry.plain;

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
