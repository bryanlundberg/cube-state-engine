export class CubeEngine {
  MOVES = [];

  // States object for the rotation
  STATES = {
    UPPER: [
      // (White)
      [COLOR.W[0], COLOR.W[1], COLOR.W[2]],
      [COLOR.W[3], COLOR.W[4], COLOR.W[5]],
      [COLOR.W[6], COLOR.W[7], COLOR.W[8]],
    ],
    LEFT: [
      // (Orange)
      [COLOR.O[0], COLOR.O[1], COLOR.O[2]],
      [COLOR.O[3], COLOR.O[4], COLOR.O[5]],
      [COLOR.O[6], COLOR.O[7], COLOR.O[8]],
    ],
    FRONT: [
      // (Green)
      [COLOR.G[0], COLOR.G[1], COLOR.G[2]],
      [COLOR.G[3], COLOR.G[4], COLOR.G[5]],
      [COLOR.G[6], COLOR.G[7], COLOR.G[8]],
    ],
    RIGHT: [
      // (Red)
      [COLOR.R[0], COLOR.R[1], COLOR.R[2]],
      [COLOR.R[3], COLOR.R[4], COLOR.R[5]],
      [COLOR.R[6], COLOR.R[7], COLOR.R[8]],
    ],
    BACK: [
      // (Blue)
      [COLOR.B[0], COLOR.B[1], COLOR.B[2]],
      [COLOR.B[3], COLOR.B[4], COLOR.B[5]],
      [COLOR.B[6], COLOR.B[7], COLOR.B[8]],
    ],
    DOWN: [
      // (Yellow)
      [COLOR.Y[0], COLOR.Y[1], COLOR.Y[2]],
      [COLOR.Y[3], COLOR.Y[4], COLOR.Y[5]],
      [COLOR.Y[6], COLOR.Y[7], COLOR.Y[8]],
    ],
  };

  /**
   * Rotates the (UPPER) layer clockwise or counterclockwise.
   */
  rotateU(clockwise = true) {
    if (clockwise) {
      this.#rotateU(true);
      this.MOVES.push("U");
    } else {
      this.#rotateU(false);
      this.MOVES.push("U'");
    }
  }

  #rotateU(clockwise = true) {
    if (clockwise) {
      this.STATES.UPPER = this.#switchMatrix(this.STATES.UPPER, true);

      const tempFront = [...this.STATES.FRONT[0]];
      const tempRight = [...this.STATES.RIGHT[0]];
      const tempLeft = [...this.STATES.LEFT[0]];
      const tempBack = [...this.STATES.BACK[0]];

      this.STATES.FRONT[0] = [...tempRight];
      this.STATES.LEFT[0] = [...tempFront];
      this.STATES.BACK[0] = [...tempLeft];
      this.STATES.RIGHT[0] = [...tempBack];
    } else {
      this.STATES.UPPER = this.#switchMatrix(this.STATES.UPPER, false);

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

  /**
   * Rotates the (FRONT) layer clockwise or counterclockwise.
   */
  rotateF(clockwise = true) {
    if (clockwise) {
      this.#rotateF(true);
      this.MOVES.push("F");
    } else {
      this.#rotateF(false);
      this.MOVES.push("F'");
    }
  }

  #rotateF(clockwise = true) {
    if (clockwise) {
      this.#rotateX(true);
      this.#rotateU(true);
      this.#rotateX(false);
    } else {
      this.#rotateX(true);
      this.#rotateU(false);
      this.#rotateX(false);
    }
  }

  /**
   * Rotates the (RIGHT) layer clockwise or counterclockwise.
   */
  rotateR(clockwise = true) {
    if (clockwise) {
      this.#rotateR(true);
      this.MOVES.push("R");
    } else {
      this.#rotateR(false);
      this.MOVES.push("R'");
    }
  }

  #rotateR(clockwise = true) {
    if (clockwise) {
      this.#rotateY(true);
      this.#rotateX(true);
      this.#rotateU(true);
      this.#rotateX(false);
      this.#rotateY(false);
    } else {
      this.#rotateY(true);
      this.#rotateX(true);
      this.#rotateU(false);
      this.#rotateX(false);
      this.#rotateY(false);
    }
  }

  /**
   * Rotates the (LEFT) layer clockwise or counterclockwise.
   */
  rotateL(clockwise = true) {
    if (clockwise) {
      this.#rotateL(true);
      this.MOVES.push("L");
    } else {
      this.#rotateL(false);
      this.MOVES.push("L'");
    }
  }

  #rotateL(clockwise = true) {
    if (clockwise) {
      this.#rotateY(false);
      this.#rotateX(true);
      this.#rotateU(true);
      this.#rotateX(false);
      this.#rotateY(true);
    } else {
      this.#rotateY(false);
      this.#rotateX(true);
      this.#rotateU(false);
      this.#rotateX(false);
      this.#rotateY(true);
    }
  }

  /**
   * Rotates the (DOWN) layer clockwise or counterclockwise.
   */
  rotateD(clockwise = true) {
    if (clockwise) {
      this.#rotateD(true);
      this.MOVES.push("D");
    } else {
      this.#rotateD(false);
      this.MOVES.push("D'");
    }
  }

  #rotateD(clockwise = true) {
    if (clockwise) {
      this.#rotateX(true);
      this.#rotateF(true);
      this.#rotateX(false);
    } else {
      this.#rotateX(true);
      this.#rotateF(false);
      this.#rotateX(false);
    }
  }

  /**
   * Rotates the (x) axis clockwise or counterclockwise.
   */
  rotateX(clockwise = true) {
    if (clockwise) {
      this.#rotateX(true);
      this.MOVES.push("x");
    } else {
      this.#rotateX(false);
      this.MOVES.push("x'");
    }
  }

  #rotateX(clockwise = true) {
    const tempFront = structuredClone(this.STATES.FRONT);
    const tempDown = structuredClone(this.STATES.DOWN);
    const tempUpper = structuredClone(this.STATES.UPPER);
    const tempBack = structuredClone(this.STATES.BACK);
    const tempLeft = structuredClone(this.STATES.LEFT);
    const tempRight = structuredClone(this.STATES.RIGHT);

    if (clockwise) {
      // Balance the rotation
      this.STATES.LEFT = this.#switchMatrix(tempLeft, false);
      this.STATES.RIGHT = this.#switchMatrix(tempRight, true);

      // Rotate mid X axis
      this.STATES.FRONT = [...tempDown];
      this.STATES.UPPER = [...tempFront];

      // Special permutation (BACK view elements)
      this.STATES.BACK = this.#specialFlip(tempUpper);
      this.STATES.DOWN = this.#specialFlip(tempBack);
    } else {
      this.STATES.LEFT = this.#switchMatrix(tempLeft, true);
      this.STATES.RIGHT = this.#switchMatrix(tempRight, false);

      this.STATES.FRONT = [...tempUpper];
      this.STATES.DOWN = [...tempFront];

      this.STATES.BACK = this.#specialFlip(tempDown);
      this.STATES.UPPER = this.#specialFlip(tempBack);
    }
  }

  /**
   * Rotates the (y) axis clockwise or counterclockwise.
   */
  rotateY(clockwise = true) {
    if (clockwise) {
      this.#rotateY(true);
      this.MOVES.push("y");
    } else {
      this.#rotateY(false);
      this.MOVES.push("y'");
    }
  }

  #rotateY(clockwise = true) {
    const tempFront = structuredClone(this.STATES.FRONT);
    const tempRight = structuredClone(this.STATES.RIGHT);
    const tempBack = structuredClone(this.STATES.BACK);
    const tempLeft = structuredClone(this.STATES.LEFT);

    if (clockwise) {
      this.STATES.UPPER = this.#switchMatrix(this.STATES.UPPER, true);
      this.STATES.DOWN = this.#switchMatrix(this.STATES.DOWN, false);

      this.STATES.FRONT = [...tempRight];
      this.STATES.RIGHT = [...tempBack];
      this.STATES.LEFT = [...tempFront];
      this.STATES.BACK = [...tempLeft];
    } else {
      this.STATES.UPPER = this.#switchMatrix(this.STATES.UPPER, false);
      this.STATES.DOWN = this.#switchMatrix(this.STATES.DOWN, true);

      this.STATES.FRONT = [...tempLeft];
      this.STATES.RIGHT = [...tempFront];
      this.STATES.LEFT = [...tempBack];
      this.STATES.BACK = [...tempRight];
    }
  }

  /**
   * Rotate the entire face in the direction set
   */
  #switchMatrix(matrix, clockwise = true) {
    const clone = structuredClone(matrix);

    const tempMatrix = [...clone[0], ...clone[1], ...clone[2]];

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

  #specialFlip(matrix) {
    return structuredClone(matrix)
      .reverse()
      .map((row) => [...row].reverse());
  }

  /**
   * Logs the current state of the cube.
   */
  state() {
    return {
      ...this.STATES,
    };
  }

  /**
   * Indicates if the cube is solve or not in all layers.
   */
  isSolved() {
    const temp = {
      ...this.STATES,
    };

    const layersSolved = Object.keys(temp).map((layer) => {
      const mixedMatrix = [
        ...temp[layer][0],
        ...temp[layer][1],
        ...temp[layer][2],
      ];

      const centerColor = mixedMatrix[4];

      return mixedMatrix.every((currentColor) => currentColor === centerColor);
    });

    return layersSolved.every((isLayerSolved) => isLayerSolved);
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
}

export const COLOR = {
  W: ["W", "W", "W", "W", "W", "W", "W", "W", "W"],
  G: ["G", "G", "G", "G", "G", "G", "G", "G", "G"],
  R: ["R", "R", "R", "R", "R", "R", "R", "R", "R"],
  B: ["B", "B", "B", "B", "B", "B", "B", "B", "B"],
  O: ["O", "O", "O", "O", "O", "O", "O", "O", "O"],
  Y: ["Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y"],
};
