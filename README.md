# CUBE STATE ENGINE

A core state manager designed to integrate with custom 3D cube models. This engine makes it easy to track and update the cube's state after every move, providing contextual information such as whether the cube is solved.

---

## Installation

    npm install cube-state-engine

---

## Methods

| Method                                           | Description                                                                                              | Return Type         |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |---------------------|
| `constructor(initialScramble?: string)`          | Optionally initialize the cube with a scramble string (not recorded in history).                         | `CubeEngine`        |
| `isSolved()`                                     | Checks if the cube is solved.                                                                            | `boolean`           |
| `state()`                                        | Returns the current state of the cube as an object representing each face.                               | `object`            |
| `getMoves(asString?: boolean)`                   | Returns the history of all movements; as string if `true` (default), or as array if `false`.             | `string / string[]` |
| `reset()`                                        | Resets the cube to the solved state and clears the move history.                                         | `void`              |
| `applyMoves(sequence: string, options?: {record?: boolean})` | Applies a sequence of moves (supports U, D, L, R, F, x, y, z, M, Dw, Uw, Rw, Lw with ', 2). | `void`              |
| `rotateU(clockwise?: boolean)`                   | Rotates the **Upper** layer clockwise or counterclockwise.                                               | `void`              |
| `rotateD(clockwise?: boolean)`                   | Rotates the **Down** layer clockwise or counterclockwise.                                                | `void`              |
| `rotateL(clockwise?: boolean)`                   | Rotates the **Left** layer clockwise or counterclockwise.                                                | `void`              |
| `rotateR(clockwise?: boolean)`                   | Rotates the **Right** layer clockwise or counterclockwise.                                               | `void`              |
| `rotateF(clockwise?: boolean)`                   | Rotates the **Front** layer clockwise or counterclockwise.                                               | `void`              |
| `rotateX(clockwise?: boolean)`                   | Rotates the cube along the **X-axis** clockwise or counterclockwise.                                     | `void`              |
| `rotateY(clockwise?: boolean)`                   | Rotates the cube along the **Y-axis** clockwise or counterclockwise.                                     | `void`              |
| `rotateZ(clockwise?: boolean)`                   | Rotates the cube along the **Z-axis** clockwise or counterclockwise.                                     | `void`              |
| `rotateDw(clockwise?: boolean)`                  | Rotates the wide **Down** two layers.                                                                     | `void`              |
| `rotateUw(clockwise?: boolean)`                  | Rotates the wide **Upper** two layers.                                                                    | `void`              |
| `rotateRw(clockwise?: boolean)`                  | Rotates the wide **Right** two layers.                                                                    | `void`              |
| `rotateLw(clockwise?: boolean)`                  | Rotates the wide **Left** two layers.                                                                     | `void`              |
| `rotateM(clockwise?: boolean)`                   | Rotates the middle slice parallel to L/R.                                                                 | `void`              |

---

## Cube State Structure

The `state()` method returns the current state of the cube as an object with six properties, each representing a face:

| Face    | Description                  | Structure    |
| ------- | ---------------------------- | ------------ |
| `UPPER` | The top face of the cube.    | `string[][]` |
| `LEFT`  | The left face of the cube.   | `string[][]` |
| `FRONT` | The front face of the cube.  | `string[][]` |
| `RIGHT` | The right face of the cube.  | `string[][]` |
| `BACK`  | The back face of the cube.   | `string[][]` |
| `DOWN`  | The bottom face of the cube. | `string[][]` |

---

## Example Usage

```javascript
import { CubeEngine } from "cube-state-engine";

// Initialize the engine (optionally with a scramble)
const cube = new CubeEngine("R U' F R2 D");

// Check if the cube is solved
console.log(cube.isSolved());

// Rotate the upper face clockwise
cube.rotateU(true);

// Apply an algorithm and record moves
cube.applyMoves("Dw Dw' M2", { record: true });

// Get the current cube state
console.log(cube.state());

// Get history as string or array
console.log(cube.getMoves(true));  // "U Dw Dw' M2 ..."
console.log(cube.getMoves(false)); // ["U", "Dw", "Dw'", "M", "M"]

// Reset the cube to solved state and clear history
cube.reset();
console.log(cube.isSolved());      // true
console.log(cube.getMoves(false)); // []

// Rotate the cube along the Y-axis
cube.rotateY(false);
```
