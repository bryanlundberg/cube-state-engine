class CubeEngine {
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
  G = ["G", "G", "G", "G", "G", "G", "G", "G", "G"]; // Green face
  W = ["W", "W", "W", "W", "W", "W", "W", "W", "W"]; // White face
  R = ["R", "R", "R", "R", "R", "R", "R", "R", "R"]; // Red face
  O = ["O", "O", "O", "O", "O", "O", "O", "O", "O"]; // Orange face
  B = ["B", "B", "B", "B", "B", "B", "B", "B", "B"]; // Blue face
  Y = ["Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y"]; // Yellow face

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

const v = new CubeEngine();

/**
 * Key listener for cube movements.
 */
addEventListener("keyup", (e) => {
  const movesMap = {
    f: () => v.rotateU(false), // F -> U'
    j: () => v.rotateU(true), // J -> U
    g: () => v.rotateF(false), // G -> F'
    h: () => v.rotateF(true), // H -> F
  };

  const move = movesMap[e.key.toLowerCase()];
  if (move) {
    move();
    v.state();
  }
});
