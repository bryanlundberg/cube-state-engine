export class CubeEngine {
  CATEGORY = "3x3";

  // History of movements
  MOVES = [];

  // Cube layers (face names)
  TOP = "W"; // White
  FRONT = "G"; // Green
  BOTTOM = "Y"; // Yellow
  RIGHT = "R"; // Red
  LEFT = "O"; // Orange
  BACK = "B"; // Blue

  // Initial states of the cube faces
  G = [
    "🟢(1,1)",
    "🟢(1,2)",
    "🟢(1,3)",
    "🟢(2,1)",
    "🟢(2,2)",
    "🟢(2,3)",
    "🟢(3,1)",
    "🟢(3,2)",
    "🟢(3,3)",
  ]; // Green face
  W = [
    "⚪(1,1)",
    "⚪(1,2)",
    "⚪(1,3)",
    "⚪(2,1)",
    "⚪(2,2)",
    "⚪(2,3)",
    "⚪(3,1)",
    "⚪(3,2)",
    "⚪(3,3)",
  ]; // White face
  R = [
    "🔴(1,1)",
    "🔴(1,2)",
    "🔴(1,3)",
    "🔴(2,1)",
    "🔴(2,2)",
    "🔴(2,3)",
    "🔴(3,1)",
    "🔴(3,2)",
    "🔴(3,3)",
  ]; // Red face
  O = [
    "🟠(1,1)",
    "🟠(1,2)",
    "🟠(1,3)",
    "🟠(2,1)",
    "🟠(2,2)",
    "🟠(2,3)",
    "🟠(3,1)",
    "🟠(3,2)",
    "🟠(3,3)",
  ]; // Orange face
  B = [
    "🔵(1,1)",
    "🔵(1,2)",
    "🔵(1,3)",
    "🔵(2,1)",
    "🔵(2,2)",
    "🔵(2,3)",
    "🔵(3,1)",
    "🔵(3,2)",
    "🔵(3,3)",
  ]; // Blue face
  Y = [
    "🟡(1,1)",
    "🟡(1,2)",
    "🟡(1,3)",
    "🟡(2,1)",
    "🟡(2,2)",
    "🟡(2,3)",
    "🟡(3,1)",
    "🟡(3,2)",
    "🟡(3,3)",
  ]; // Yellow face

  /**
   * Rotates the top (U) layer clockwise or counterclockwise.
   */
  rotateU(clockwise = true) {
    if (clockwise) {
      this.MOVES.push("U");
      // Rotate the top layer clockwise
      this.W = [
        this.W[6],
        this.W[3],
        this.W[0],
        this.W[7],
        this.W[4],
        this.W[1],
        this.W[8],
        this.W[5],
        this.W[2],
      ];

      // Shift the sides affected by the U move
      const temp = this.G.slice(0, 3);
      this.G.splice(0, 3, ...this.R.slice(0, 3));
      this.R.splice(0, 3, ...this.B.slice(0, 3));
      this.B.splice(0, 3, ...this.O.slice(0, 3));
      this.O.splice(0, 3, ...temp);
    } else {
      this.MOVES.push("U'");
      // Rotate the top layer counterclockwise
      this.W = [
        this.W[2],
        this.W[5],
        this.W[8],
        this.W[1],
        this.W[4],
        this.W[7],
        this.W[0],
        this.W[3],
        this.W[6],
      ];

      // Shift the sides affected by the U' move
      const temp = this.G.slice(0, 3);
      this.G.splice(0, 3, ...this.O.slice(0, 3));
      this.O.splice(0, 3, ...this.B.slice(0, 3));
      this.B.splice(0, 3, ...this.R.slice(0, 3));
      this.R.splice(0, 3, ...temp);
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
   * Logs the current state of the cube.
   */
  state() {
    const formatFace = (face) =>
      `${face[0]} ${face[1]} ${face[2]}\n${face[3]} ${face[4]} ${face[5]}\n${face[6]} ${face[7]} ${face[8]}`;

    console.clear();
    console.log("TOP:\n" + formatFace(this.W));
    console.log("FRONT:\n" + formatFace(this.G));
    console.log("BOTTOM:\n" + formatFace(this.Y));
    console.log("RIGHT:\n" + formatFace(this.R));
    console.log("LEFT:\n" + formatFace(this.O));
    console.log("BACK:\n" + formatFace(this.B));
    console.log("\nMove history: " + this.MOVES.join(" "));
  }
}
