export class CubeEngine {
  CATEGORY = "3x3";

  // History of movements
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
   * Rotates the top (U) layer clockwise or counterclockwise.
   */
  rotateU(clockwise = true) {
    if (clockwise) {
      this.MOVES.push("U");

      // Rotate the top layer (UPPER) clockwise

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
      this.MOVES.push("U'");

      // Rotate the top layer (UPPER) counterclockwise
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
   * Rotates the front (F) layer clockwise or counterclockwise.
   */
  rotateF(clockwise = true) {
    if (clockwise) {
      this.MOVES.push("F");
      // Rotate the front layer clockwise
      this.G = [
        this.G[6],
        this.G[3],
        this.G[0],
        this.G[7],
        this.G[4],
        this.G[1],
        this.G[8],
        this.G[5],
        this.G[2],
      ];

      // Rotate edges affected by the F move
      const temp = [this.W[6], this.W[7], this.W[8]];
      this.W[6] = this.O[8];
      this.W[7] = this.O[5];
      this.W[8] = this.O[2];

      this.O[2] = this.Y[0];
      this.O[5] = this.Y[1];
      this.O[8] = this.Y[2];

      this.Y[0] = this.R[6];
      this.Y[1] = this.R[3];
      this.Y[2] = this.R[0];

      this.R[0] = temp[2];
      this.R[3] = temp[1];
      this.R[6] = temp[0];
    } else {
      this.MOVES.push("F'");
      // Rotate the front layer counterclockwise
      this.G = [
        this.G[2],
        this.G[5],
        this.G[8],
        this.G[1],
        this.G[4],
        this.G[7],
        this.G[0],
        this.G[3],
        this.G[6],
      ];

      // Rotate edges affected by the F' move
      const temp = [this.W[6], this.W[7], this.W[8]];
      this.W[6] = this.R[0];
      this.W[7] = this.R[3];
      this.W[8] = this.R[6];

      this.R[0] = this.Y[2];
      this.R[3] = this.Y[1];
      this.R[6] = this.Y[0];

      this.Y[0] = this.O[2];
      this.Y[1] = this.O[5];
      this.Y[2] = this.O[8];

      this.O[2] = temp[0];
      this.O[5] = temp[1];
      this.O[8] = temp[2];
    }
  }

  /**
   * Rotates the front (R) layer clockwise or counterclockwise.
   */
  rotateR(clockwise = true) {
    if (clockwise) {
      this.MOVES.push("R");

      // Rotate the right layer counterclockwise
      this.R = [
        this.R[6],
        this.R[3],
        this.R[0],
        this.R[7],
        this.R[4],
        this.R[1],
        this.R[8],
        this.R[5],
        this.R[2],
      ];

      // Affects adjacent layers (front, top, bottom, back)
      // Temporary to not overwrite values ​​while modifying layers

      const tempFront = [this.G[2], this.G[5], this.G[8]];
      const tempTop = [this.W[2], this.W[5], this.W[8]];
      const tempBottom = [this.Y[2], this.Y[5], this.Y[8]];
      const tempBack = [this.B[6], this.B[3], this.B[0]];

      // Ajustamos las capas adyacentes
      this.G[2] = tempBottom[0];
      this.G[5] = tempBottom[1];
      this.G[8] = tempBottom[2];

      this.W[2] = tempFront[0];
      this.W[5] = tempFront[1];
      this.W[8] = tempFront[2];

      this.B[6] = tempTop[0];
      this.B[3] = tempTop[1];
      this.B[0] = tempTop[2];

      this.Y[2] = tempBack[0];
      this.Y[5] = tempBack[1];
      this.Y[8] = tempBack[2];
    } else {
      this.MOVES.push("R'");

      // Rotate the right face (R) counterclockwise
      this.R = [
        this.R[2],
        this.R[5],
        this.R[8],
        this.R[1],
        this.R[4],
        this.R[7],
        this.R[0],
        this.R[3],
        this.R[6],
      ];

      // Affects adjacent layers (front, top, bottom, back)
      const tempFront = [this.G[2], this.G[5], this.G[8]];
      const tempTop = [this.W[2], this.W[5], this.W[8]];
      const tempBottom = [this.Y[2], this.Y[5], this.Y[8]];
      const tempBack = [this.B[6], this.B[3], this.B[0]];

      // Adjust the adjacent layers
      this.G[2] = tempTop[0];
      this.G[5] = tempTop[1];
      this.G[8] = tempTop[2];

      this.W[2] = tempBack[0];
      this.W[5] = tempBack[1];
      this.W[8] = tempBack[2];

      this.B[6] = tempBottom[0];
      this.B[3] = tempBottom[1];
      this.B[0] = tempBottom[2];

      this.Y[2] = tempFront[0];
      this.Y[5] = tempFront[1];
      this.Y[8] = tempFront[2];
    }
  }

  /**
   * Rotates the left (L) layer clockwise or counterclockwise.
   */
  rotateL(clockwise = true) {
    if (clockwise) {
      this.MOVES.push("L");

      // Rotate the left face (O) clockwise
      this.O = [
        this.O[6],
        this.O[3],
        this.O[0],
        this.O[7],
        this.O[4],
        this.O[1],
        this.O[8],
        this.O[5],
        this.O[2],
      ];

      // Save adjacent pieces for swapping
      const tempTop = [this.W[0], this.W[3], this.W[6]];
      const tempFront = [this.G[0], this.G[3], this.G[6]];
      const tempBottom = [this.Y[0], this.Y[3], this.Y[6]];
      const tempBack = [this.B[8], this.B[5], this.B[2]]; // Inverted order when interacting with the left face

      // Update affected pieces
      this.W[0] = tempBack[0];
      this.W[3] = tempBack[1];
      this.W[6] = tempBack[2];

      this.G[0] = tempTop[0];
      this.G[3] = tempTop[1];
      this.G[6] = tempTop[2];

      this.Y[0] = tempFront[0];
      this.Y[3] = tempFront[1];
      this.Y[6] = tempFront[2];

      this.B[2] = tempBottom[2];
      this.B[5] = tempBottom[1];
      this.B[8] = tempBottom[0];
    } else {
      this.MOVES.push("L'");

      // Rotate the left face (O) counterclockwise
      this.O = [
        this.O[2],
        this.O[5],
        this.O[8],
        this.O[1],
        this.O[4],
        this.O[7],
        this.O[0],
        this.O[3],
        this.O[6],
      ];

      // Save adjacent pieces for swapping
      const tempTop = [this.W[0], this.W[3], this.W[6]];
      const tempFront = [this.G[0], this.G[3], this.G[6]];
      const tempBottom = [this.Y[0], this.Y[3], this.Y[6]];
      const tempBack = [this.B[8], this.B[5], this.B[2]]; // Inverted order when interacting with the left face

      // Update affected pieces
      this.W[0] = tempFront[0];
      this.W[3] = tempFront[1];
      this.W[6] = tempFront[2];

      this.G[0] = tempBottom[0];
      this.G[3] = tempBottom[1];
      this.G[6] = tempBottom[2];

      this.Y[0] = tempBack[0];
      this.Y[3] = tempBack[1];
      this.Y[6] = tempBack[2];

      this.B[2] = tempTop[2];
      this.B[5] = tempTop[1];
      this.B[8] = tempTop[0];
    }
  }

  /**
   * Rotates the (x) axis clockwise or counterclockwise.
   */
  rotateX(clockwise = true) {
    const tempRight = [
      ...this.STATES.RIGHT[0],
      ...this.STATES.RIGHT[1],
      ...this.STATES.RIGHT[2],
    ];

    const tempLeft = [
      ...this.STATES.LEFT[0],
      ...this.STATES.LEFT[1],
      ...this.STATES.LEFT[2],
    ];

    const tempUpper = [...this.STATES.UPPER];
    const tempFront = [...this.STATES.FRONT];
    const tempDown = [...this.STATES.DOWN];
    const tempBack = [...this.STATES.BACK];

    if (clockwise) {
      // Rotate the RIGHT and LEFT layers
      this.STATES.RIGHT = [
        [tempRight[6], tempRight[3], tempRight[0]],
        [tempRight[7], tempRight[4], tempRight[1]],
        [tempRight[8], tempRight[5], tempRight[2]],
      ];

      this.STATES.LEFT = [
        [tempLeft[2], tempLeft[5], tempLeft[8]],
        [tempLeft[1], tempLeft[4], tempLeft[7]],
        [tempLeft[0], tempLeft[3], tempLeft[6]],
      ];

      // Rotation X axis
      this.STATES.FRONT = [...tempDown];
      this.STATES.UPPER = [...tempFront];
      this.STATES.DOWN = [...tempBack];
      this.STATES.BACK = [...tempUpper];
    } else {
      // Rotate the RIGHT and LEFT layers
      this.STATES.RIGHT = [
        [tempRight[2], tempRight[5], tempRight[8]],
        [tempRight[1], tempRight[4], tempRight[7]],
        [tempRight[0], tempRight[3], tempRight[6]],
      ];

      this.STATES.LEFT = [
        [tempLeft[6], tempLeft[3], tempLeft[0]],
        [tempLeft[7], tempLeft[4], tempLeft[1]],
        [tempLeft[8], tempLeft[5], tempLeft[2]],
      ];

      // Rotation X axis
      this.STATES.FRONT = [...tempUpper];
      this.STATES.UPPER = [...tempBack];
      this.STATES.DOWN = [...tempFront];
      this.STATES.BACK = [...tempDown];
    }
  }

  /**
   * Rotates the (y) axis clockwise or counterclockwise.
   */
  rotateY(clockwise = true) {
    const tempFront = [...this.STATES.FRONT];
    const tempRight = [...this.STATES.RIGHT];
    const tempBack = [...this.STATES.BACK];
    const tempLeft = [...this.STATES.LEFT];

    if (clockwise) {
      this.STATES.UPPER = this.#switchMatrix(this.STATES.UPPER, true);
      this.STATES.DOWN = this.#switchMatrix(this.STATES.DOWN, false);

      // Rotation X axis
      this.STATES.FRONT = [...tempRight];
      this.STATES.RIGHT = [...tempBack];
      this.STATES.LEFT = [...tempFront];
      this.STATES.BACK = [...tempLeft];
    } else {
      this.STATES.UPPER = this.#switchMatrix(this.STATES.UPPER, false);
      this.STATES.DOWN = this.#switchMatrix(this.STATES.DOWN, true);

      // Rotation X axis
      this.STATES.FRONT = [...tempLeft];
      this.STATES.RIGHT = [...tempFront];
      this.STATES.LEFT = [...tempBack];
      this.STATES.BACK = [...tempRight];
    }
  }

  /*
   * Rotate the entire face in the direction set
   */
  #switchMatrix(matrix, clockwise = true) {
    const tempMatrix = [...matrix[0], ...matrix[1], ...matrix[2]];

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

  /**
   * Logs the current state of the cube.
   */
  state() {
    console.clear();
    console.log(
      "TOP:\n" +
        this.STATES.UPPER[0] +
        "\n" +
        this.STATES.UPPER[1] +
        "\n" +
        this.STATES.UPPER[2]
    );

    console.log(
      "FRONT:\n" +
        this.STATES.FRONT[0] +
        "\n" +
        this.STATES.FRONT[1] +
        "\n" +
        this.STATES.FRONT[2]
    );

    console.log(
      "DOWN:\n" +
        this.STATES.DOWN[0] +
        "\n" +
        this.STATES.DOWN[1] +
        "\n" +
        this.STATES.DOWN[2]
    );

    console.log(
      "RIGHT:\n" +
        this.STATES.RIGHT[0] +
        "\n" +
        this.STATES.RIGHT[1] +
        "\n" +
        this.STATES.RIGHT[2]
    );

    console.log(
      "LEFT:\n" +
        this.STATES.LEFT[0] +
        "\n" +
        this.STATES.LEFT[1] +
        "\n" +
        this.STATES.LEFT[2]
    );

    console.log(
      "BACK:\n" +
        this.STATES.BACK[0] +
        "\n" +
        this.STATES.BACK[1] +
        "\n" +
        this.STATES.BACK[2]
    );

    console.log("\nMove history: " + this.MOVES.join(" "));

    return {
      ...this.STATES,
    };
  }
}

export const COLOR = {
  W: [
    "⚪(1,1)",
    "⚪(1,2)",
    "⚪(1,3)",
    "⚪(2,1)",
    "⚪(2,2)",
    "⚪(2,3)",
    "⚪(3,1)",
    "⚪(3,2)",
    "⚪(3,3)",
  ],
  G: [
    "🟢(1,1)",
    "🟢(1,2)",
    "🟢(1,3)",
    "🟢(2,1)",
    "🟢(2,2)",
    "🟢(2,3)",
    "🟢(3,1)",
    "🟢(3,2)",
    "🟢(3,3)",
  ],
  R: [
    "🔴(1,1)",
    "🔴(1,2)",
    "🔴(1,3)",
    "🔴(2,1)",
    "🔴(2,2)",
    "🔴(2,3)",
    "🔴(3,1)",
    "🔴(3,2)",
    "🔴(3,3)",
  ],
  B: [
    "🔵(1,1)",
    "🔵(1,2)",
    "🔵(1,3)",
    "🔵(2,1)",
    "🔵(2,2)",
    "🔵(2,3)",
    "🔵(3,1)",
    "🔵(3,2)",
    "🔵(3,3)",
  ],
  O: [
    "🟠(1,1)",
    "🟠(1,2)",
    "🟠(1,3)",
    "🟠(2,1)",
    "🟠(2,2)",
    "🟠(2,3)",
    "🟠(3,1)",
    "🟠(3,2)",
    "🟠(3,3)",
  ],
  Y: [
    "🟡(1,1)",
    "🟡(1,2)",
    "🟡(1,3)",
    "🟡(2,1)",
    "🟡(2,2)",
    "🟡(2,3)",
    "🟡(3,1)",
    "🟡(3,2)",
    "🟡(3,3)",
  ],
};
