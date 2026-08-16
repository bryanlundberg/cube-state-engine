// Reference (matrix-based) cube used ONLY to derive permutation tables.
//
// It reproduces the exact rotation algorithm the engine has always used, but
// operates on integer sticker tags (the flat index each sticker starts at).
// Applying a move and flattening the result yields a permutation array `perm`
// such that `newState[i] = oldState[perm[i]]`. This runs a handful of times per
// size at module load and is then cached, so the runtime hot path never touches
// matrices or move composition.

import type { CubeSize, FaceName, MoveKey } from "../types.js";
import { FACE_NAMES } from "./constants.js";

type Matrix = number[][];

/** Deep copy of a face matrix (rows are plain number arrays). */
function clone2d(matrix: Matrix): Matrix {
  return matrix.map((row) => [...row]);
}

export class OracleCube {
  readonly size: CubeSize;
  STATES: Record<FaceName, Matrix>;

  constructor(size: CubeSize) {
    this.size = size;
    this.STATES = {} as Record<FaceName, Matrix>;
    for (let f = 0; f < FACE_NAMES.length; f++) {
      const face: Matrix = [];
      for (let r = 0; r < size; r++) {
        const row: number[] = [];
        for (let c = 0; c < size; c++) {
          row.push(f * size * size + r * size + c);
        }
        face.push(row);
      }
      this.STATES[FACE_NAMES[f]] = face;
    }
  }

  /** Concatenate every face row-major into a single flat array of tags. */
  flatten(): number[] {
    const out: number[] = [];
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

  switchMatrix(matrix: Matrix, clockwise = true): Matrix {
    const clone = clone2d(matrix);
    const size = this.size;

    let tempMatrix: number[] = [];
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

  specialFlip(matrix: Matrix): Matrix {
    return clone2d(matrix)
      .reverse()
      .map((row) => [...row].reverse());
  }

  rotateU(clockwise = true): void {
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

  rotateF(clockwise = true): void {
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

  rotateB(clockwise = true): void {
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

  rotateR(clockwise = true): void {
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

  rotateL(clockwise = true): void {
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

  rotateD(clockwise = true): void {
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

  rotateDw(clockwise = true): void {
    if (this.size === 2) return;
    if (clockwise) {
      this.rotateY(false);
      this.rotateU(true);
    } else {
      this.rotateY(true);
      this.rotateU(false);
    }
  }

  rotateUw(clockwise = true): void {
    if (this.size === 2) return;
    if (clockwise) {
      this.rotateY(true);
      this.rotateD(true);
    } else {
      this.rotateY(false);
      this.rotateD(false);
    }
  }

  rotateRw(clockwise = true): void {
    if (this.size === 2) return;
    if (clockwise) {
      this.rotateX(true);
      this.rotateL(true);
    } else {
      this.rotateX(false);
      this.rotateL(false);
    }
  }

  rotateLw(clockwise = true): void {
    if (this.size === 2) return;
    if (clockwise) {
      this.rotateX(false);
      this.rotateR(true);
    } else {
      this.rotateX(true);
      this.rotateR(false);
    }
  }

  rotateM(clockwise = true): void {
    if (this.size === 2) return;
    if (clockwise) {
      this.rotateLw(true);
      this.rotateL(false);
    } else {
      this.rotateLw(false);
      this.rotateL(true);
    }
  }

  rotateE(clockwise = true): void {
    if (this.size === 2) return;
    if (clockwise) {
      this.rotateDw(true);
      this.rotateD(false);
    } else {
      this.rotateDw(false);
      this.rotateD(true);
    }
  }

  rotateFw(clockwise = true): void {
    if (this.size === 2) return;
    if (clockwise) {
      this.rotateZ(true);
      this.rotateB(true);
    } else {
      this.rotateZ(false);
      this.rotateB(false);
    }
  }

  rotateS(clockwise = true): void {
    if (this.size === 2) return;
    if (clockwise) {
      this.rotateFw(true);
      this.rotateF(false);
    } else {
      this.rotateFw(false);
      this.rotateF(true);
    }
  }

  rotateX(clockwise = true): void {
    const tempFront = clone2d(this.STATES.FRONT);
    const tempDown = clone2d(this.STATES.DOWN);
    const tempUpper = clone2d(this.STATES.UPPER);
    const tempBack = clone2d(this.STATES.BACK);
    const tempLeft = clone2d(this.STATES.LEFT);
    const tempRight = clone2d(this.STATES.RIGHT);

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

  rotateZ(clockwise = true): void {
    const tempUpper = clone2d(this.STATES.UPPER);
    const tempRight = clone2d(this.STATES.RIGHT);
    const tempDown = clone2d(this.STATES.DOWN);
    const tempLeft = clone2d(this.STATES.LEFT);
    const tempFront = clone2d(this.STATES.FRONT);
    const tempBack = clone2d(this.STATES.BACK);

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

  rotateY(clockwise = true): void {
    const tempFront = clone2d(this.STATES.FRONT);
    const tempRight = clone2d(this.STATES.RIGHT);
    const tempBack = clone2d(this.STATES.BACK);
    const tempLeft = clone2d(this.STATES.LEFT);

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

/** Every rotation method name on the oracle. */
export type OracleRotation = Extract<keyof OracleCube, `rotate${string}`>;

/** Maps each move key to the oracle method that performs it. */
export const MOVE_FNS: Record<MoveKey, OracleRotation> = {
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
