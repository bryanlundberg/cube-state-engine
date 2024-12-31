# CUBE STATE ENGINE

A core state manager designed to integrate with custom 3D cube models. This engine makes it easy to track and update the cube's state after every move, providing contextual information such as whether the cube is solved.

---

## Methods

| Method                        | Description                                                                | Return Type |
| ----------------------------- | -------------------------------------------------------------------------- | ----------- |
| `isSolved()`                  | Checks if the cube is solved.                                              | `boolean`   |
| `state()`                     | Returns the current state of the cube as an object representing each face. | `object`    |
| `getMoves(asString: boolean)` | Returns the history of all movements made.                                 | `string`    |
| `rotateU(clockwise: boolean)` | Rotates the **Upper** face clockwise or counterclockwise.                  | `void`      |
| `rotateF(clockwise: boolean)` | Rotates the **Front** face clockwise or counterclockwise.                  | `void`      |
| `rotateD(clockwise: boolean)` | Rotates the **Down** face clockwise or counterclockwise.                   | `void`      |
| `rotateX(clockwise: boolean)` | Rotates the cube along the **X-axis** clockwise or counterclockwise.       | `void`      |
| `rotateY(clockwise: boolean)` | Rotates the cube along the **Y-axis** clockwise or counterclockwise.       | `void`      |
| `rotateL(clockwise: boolean)` | Rotates the **Left** face clockwise or counterclockwise.                   | `void`      |
| `rotateR(clockwise: boolean)` | Rotates the **Right** face clockwise or counterclockwise.                  | `void`      |

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

// Initialize the engine
const cube = new CubeEngine();

// Check if the cube is solved
console.log(cube.isSolved()); // true

// Rotate the upper face clockwise
cube.rotateU(true);

// Get the current cube state
console.log(cube.state());

// Rotate the cube along the Y-axis
cube.rotateY(false);
```
