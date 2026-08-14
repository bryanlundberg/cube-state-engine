<div align="center">

# Cube State Engine

**A tiny, dependency-free engine that tracks a Rubik's cube state, move by move.**

[![npm](https://img.shields.io/npm/v/cube-state-engine)](https://www.npmjs.com/package/cube-state-engine)
[![dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](#-zero-dependencies)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

Powers the solve tracking and analytics core of **[NexusTimer](https://github.com/bryanlundberg/NexusTimer)** 
</div>

---

## What it does

Give it moves, and it tells you what the cube looks like and what just got solved.

```javascript
import { CubeEngine } from "cube-state-engine";

const cube = new CubeEngine("R U' F R2 D"); // start from a scramble
cube.applyMoves("R U R' U'", { record: true });

cube.isSolved();   // false
cube.state();      // { UPPER: [[...]], LEFT: [[...]], ... }
cube.getMoves();   // "R U R' U'"
```

It handles the whole standard notation set (faces, wide moves, slices, rotations), works on **3x3 and 2x2**, and ships with higher-level tools built on top: state predicates, a move simplifier, and a full solve analyzer that breaks a solve into CFOP or Roux stages.

---

## Installation

```bash
pnpm install cube-state-engine
```

Ships CJS + ESM + TypeScript types. Works in Node and in the browser.

---

## Zero dependencies

**Not one runtime dependency.** Nothing to audit, nothing to break, nothing bloating your bundle. The whole engine is plain JavaScript.


---

## Core: `CubeEngine`

```javascript
import { CubeEngine } from "cube-state-engine";

const cube = new CubeEngine();                    // solved 3x3
const scrambled = new CubeEngine("R U R' U'");    // start from a scramble
const pocket = new CubeEngine("", { size: 2 });   // 2x2
```

### Applying moves

The friendliest way to drive the cube is a notation string:

```javascript
cube.applyMoves("R U2 R' D' Rw M' x y2", { record: true });
```

Supported notation:

| Kind | Tokens |
| --- | --- |
| **Faces** | `U` `D` `L` `R` `F` `B` |
| **Wide** | `Uw` `Dw` `Lw` `Rw` `Fw` |
| **Slices** | `M` `E` `S` |
| **Rotations** | `x` `y` `z` |

> **On `record`:** `applyMoves(seq)` on its own does **not** record into history handy for setting up a position. Pass `{ record: true }` when you want the moves logged. Unknown tokens are skipped silently.

Every move also has a direct method, all of which record by default:

```javascript
cube.rotateU(true);   // U
cube.rotateR(false);  // R'
cube.rotateY(false);  // y'
```

<details>
<summary><b>Full method list</b></summary>

| Method | Description | Returns |
| --- | --- | --- |
| `constructor(scramble?, { size? })` | New cube, optionally scrambled (not recorded). `size` is `2` or `3` (default `3`). | `CubeEngine` |
| `applyMoves(sequence, { record? })` | Apply a notation string. Not recorded unless `record: true`. | `void` |
| `state()` | Current state as six face matrices. | `object` |
| `isSolved()` | Whether every face is a single color. | `boolean` |
| `getMoves(asString?)` | Move history — string (default) or array. | `string \| string[]` |
| `reset()` | Back to solved, history cleared. | `void` |
| `rotateU/D/L/R/F/B(cw?)` | Turn a face layer. | `void` |
| `rotateUw/Dw/Lw/Rw/Fw(cw?)` | Turn two layers (wide). | `void` |
| `rotateM/E/S(cw?)` | Turn a middle slice. | `void` |
| `rotateX/Y/Z(cw?)` | Rotate the whole cube. | `void` |

On a 2x2, wide and slice moves are no-ops they have no inner layer to turn.

</details>

### The state shape

`state()` returns six faces, each a `size × size` matrix of color letters (`W` `O` `G` `R` `B` `Y`):

```javascript
{
  UPPER: [["W","W","W"], ["W","W","W"], ["W","W","W"]],
  LEFT:  [[...]], FRONT: [[...]], RIGHT: [[...]], BACK: [[...]], DOWN: [[...]]
}
```

Perfect for driving a 3D model map each sticker straight onto your mesh.

---

## Predicates: "is this solved yet?"

Ready-made checks for the milestones people actually train. Every one accepts a `CubeEngine`, a `state()` object, or a flat sticker array pass whichever you already have.

```javascript
import { isCrossComplete, isF2LComplete, isLastLayerOriented, matchesGoal } from "cube-state-engine";

isCrossComplete(cube);        // cross done (defaults to the DOWN color)
isF2LComplete(cube);          // cross + all four pairs
isLastLayerOriented(cube);    // OLL done on the U face
matchesGoal(cube, "oll+cp");  // OLL + corners permuted
```

`matchesGoal` is the flexible one great for building trainers:

```javascript
matchesGoal(cube, "full");                        // fully solved
matchesGoal(cube, "cross");                       // cross only
matchesGoal(cube, { goal: "oll", face: "D" });    // OLL, but on a different face
matchesGoal(cube, (c) => c.isSolved());           // or your own predicate
```

Goal names: `full` / `solved`, `oll`, `oll+cp`, `f2l`, `cross`.

> 🧭 Every check compares stickers against the **current center** of their face, so it stays correct through `x`/`y`/`z` rotations, wide moves, and AUF exactly what real speedsolves are full of.

---

## Move simplifier

The engine records `U2` as two separate `U` turns. `simplifyMoves` joins them back up:

```javascript
import { simplifyMoves } from "cube-state-engine";

simplifyMoves("U R R D R' B");      // "U R2 D R' B"
simplifyMoves(["y'", "y'", "L"]);   // ["y2", "L"]
simplifyMoves("F F'");              // "F F'"  ← unchanged, no cancellation
```

It only ever merges two identical quarter turns into their double. It will **not** cancel opposites or fold net rotations, so your move count stays honest. Accepts a string, a token array, or timed moves (`[{ m, t }]`) and returns the same shape.

---

## Solve analyzer

Hand it a timed solve and it reconstructs the whole thing: the scramble (derived as the inverse of the solution), the method used, and when each stage finished.

```javascript
import { analyzeSolution } from "cube-state-engine";

const result = analyzeSolution([
  { m: "U", t: 0 },
  { m: "R", t: 210 },
  // ... `t` is cumulative elapsed ms
]);
```

```javascript
{
  method: "CFOP",
  solved: true,
  total: 14371,
  tps: 5.08,
  cross: { color: "W", at: 2340, duration: 2340, moveIndex: 14, move: "U'" },
  f2l: [
    { slot: "G-O", at: 3660, duration: 1320, moveIndex: 19, move: "F"  },
    { slot: "B-O", at: 5160, duration: 1500, moveIndex: 23, move: "B'" },
    { slot: "B-R", at: 8460, duration: 3300, moveIndex: 35, move: "B"  },
    { slot: "G-R", at: 9871, duration: 1411, moveIndex: 48, move: "F'" }
  ],
  oll: { at: 12540, duration: 2669, moveIndex: 63, move: "R'" },
  pll: { at: 14371, duration: 1831, moveIndex: 81, move: "D'" }
}
```

- **Detects CFOP and Roux automatically.** Roux solves come back with `firstBlock`, `secondBlock`, `cmll` and `lse` instead (each block noting the `side` color it was built on). When neither staging fits, `method` is `"unknown"` and the timing fields are `null`.
- **`allCrosses`** reports when the cross completed on *every* face color, not just the one you used.
- **`unsupported`** lists any move tokens it couldn't parse, so bad timings never pass silently.

Also exported: `invertSequence(tokens)`, which reverses and inverts a move list.

---

## Advanced

For anyone building on the internals:

```javascript
import { getMovePermutations, getCubeGeometry } from "cube-state-engine";

getMovePermutations(3);  // { U: { cw: [...], ccw: [...] }, ... }
getCubeGeometry(3);      // derived edges, corners, neighbors, opposites
```

The geometry is **derived, not hardcoded** a sticker is displaced by a face turn only if it physically belongs to that face, so grouping stickers by which turns move them reconstructs every edge and corner slot on its own.


---

## License

MIT © [Bryan Lundberg](https://github.com/bryanlundberg)
