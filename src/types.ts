// The shared type vocabulary of the library. Every module speaks these names,
// and they are re-exported from the package entry point so consumers can too.

import type { CubeEngine } from "./core/engine.js";

// --- Cube basics ----------------------------------------------------------

/** Cube sizes the engine supports. */
export type CubeSize = 2 | 3;

/** Face names in the flat layout order: 0=UPPER 1=LEFT 2=FRONT 3=RIGHT 4=BACK 5=DOWN. */
export type FaceName = "UPPER" | "LEFT" | "FRONT" | "RIGHT" | "BACK" | "DOWN";

/** Face letters as used in move notation. */
export type FaceLetter = "U" | "L" | "F" | "R" | "B" | "D";

/** A face position in the flat layout: 0..5, in `FaceName` order. */
export type FaceIndex = number;

/** Sticker colors: white, orange, green, red, blue, yellow. */
export type Color = "W" | "O" | "G" | "R" | "B" | "Y";

/** Every sticker of the cube, face by face, row-major within each face. */
export type FlatState = Color[];

/** The cube as one matrix per face. */
export type CubeState = Record<FaceName, Color[][]>;

// --- Moves ----------------------------------------------------------------

/** Move keys the engine can apply (after notation is normalized). */
export type MoveKey =
  | "U" | "D" | "L" | "R" | "F" | "B"
  | "x" | "y" | "z"
  | "M" | "E" | "S"
  | "Uw" | "Dw" | "Rw" | "Lw" | "Fw";

export type TurnDirection = "cw" | "ccw";

/** `newState[i] = oldState[perm[i]]`. */
export type Permutation = number[];

export type MovePermutations = Record<MoveKey, Record<TurnDirection, Permutation>>;

/** One recorded move: token plus CUMULATIVE elapsed ms up to that move. */
export interface TimedMove {
  m: string;
  t: number;
}

// --- Geometry -------------------------------------------------------------

/** An edge or corner slot: the faces it touches and its sticker indices. */
export interface CubieSlot {
  faces: FaceIndex[];
  indices: number[];
}

/** Sticker adjacency derived from the engine's permutation tables. */
export interface Geometry {
  size: CubeSize;
  /** Stickers per face (size * size). */
  per: number;
  centerIndex(face: FaceIndex): number;
  edges: CubieSlot[];
  corners: CubieSlot[];
  neighbors: Set<FaceIndex>[];
  opposite: FaceIndex[];
  edgesByFace(face: FaceIndex): CubieSlot[];
  cornersByFace(face: FaceIndex): CubieSlot[];
  edgeByPair(a: FaceIndex, b: FaceIndex): CubieSlot | undefined;
}

// --- Predicates -----------------------------------------------------------

/** Anything the predicates accept: an engine, a state object, or a flat array. */
export type PredicateInput = CubeEngine | CubeState | FlatState;

export type GoalName =
  | "full" | "solved"
  | "oll"
  | "oll+cp" | "ollcp" | "oll_cp"
  | "f2l"
  | "cross";

export interface GoalSpec {
  goal?: GoalName;
  face?: FaceLetter | FaceIndex;
  color?: Color;
  cross?: Color;
  custom?: (input: PredicateInput) => boolean;
}

// --- Analysis -------------------------------------------------------------

/** A parsed move: original token, engine-normalized token, cumulative time. */
export interface ParsedMove extends TimedMove {
  /** Normalized token, or "" when the engine cannot apply it. */
  mm: string;
}

/** Extra info a stage carries, depending on which milestone it is. */
export interface StageMeta {
  /** Cross color (CFOP). */
  color?: Color;
  /** F2L slot key, e.g. "G-O". */
  slot?: string;
  /** Center color of the face a Roux block was built on. */
  side?: Color;
  [key: string]: unknown;
}

/** What a method reports: a stage name and the move index that completed it. */
export interface Milestone {
  key: string;
  label: string;
  idx: number | null;
  meta?: StageMeta;
}

/** A milestone once it has been timed and its duration chained. */
export interface Stage {
  key: string;
  label: string;
  /** Cumulative ms at which the stage completed. */
  at: number;
  /** Ms since the previous stage. */
  duration: number;
  moveIndex: number;
  move: string;
  meta: StageMeta;
}

/** Everything derived from the recorded solution before any staging happens. */
export interface ReplayContext {
  size: CubeSize;
  seq: ParsedMove[];
  n: number;
  geo: Geometry;
  /** Flat cube state after each move. */
  snapshots: FlatState[];
  finalCenters: Color[];
  solved: boolean;
  simplifiedMoves: TimedMove[];
  unsupported: string[];
}

/** The replay plus the shared "cube is solved" milestone. */
export interface StagingContext extends ReplayContext {
  solvedIdx: number | null;
}

/** A method's reading of one solve. */
export interface Staging {
  /** Whether the solve genuinely follows this method. */
  valid: boolean;
  /** Move index of the first milestone; arbitrates between methods. */
  firstIdx: number | null;
  /** Face the solve was started from, or null if never reached. */
  startFace: FaceIndex | null;
  milestones: Milestone[];
}

/** A staging strategy. Register one with `registerMethod`. */
export interface SolveMethod {
  name: string;
  stage(ctx: StagingContext): Staging | null;
}

// --- Analysis output ------------------------------------------------------

export interface StageRecord {
  at: number;
  duration: number;
  moveIndex: number;
  move: string;
}

export interface CrossRecord extends StageRecord {
  color: Color;
}

export interface F2LRecord extends StageRecord {
  slot: string;
}

export interface BlockRecord extends StageRecord {
  /** Center color of the face the block was built on. */
  side: Color;
}

export interface CrossTime {
  at: number;
  moveIndex: number;
  move: string;
}

/** The face a solve was started from, whatever the method. */
export interface StartFace {
  face: FaceLetter;
  color: Color;
}

export interface SolveAnalysis {
  size: CubeSize;
  /** "CFOP", "Roux", any registered method's name, or "unknown". */
  method: string;
  solved: boolean;
  /** Total elapsed ms. */
  total: number;
  /** Turns per second, over the simplified move count. */
  tps: number;
  moves: TimedMove[];
  /** The breakdown of whichever method was detected. */
  stages: Stage[];
  startFace: StartFace | null;
  /** When the cross completed on each face color, method-independent. */
  allCrosses: Record<string, CrossTime | null>;
  /** Move tokens that could not be parsed. */
  unsupported: string[];

  // --- Deprecated: per-method projections of `stages` ---------------------
  //
  // These are the v1.x fields, rebuilt from `stages` so they can never
  // disagree with it. They only cover the built-in CFOP and Roux vocabulary:
  // a registered method reporting its own milestones leaves all of them null.
  // Read `stages` instead — it is the same data for every method. Scheduled
  // for removal in 2.0.

  /** @deprecated Use `stages` (the entry with `key: "cross"`; color in `meta.color`). Removed in 2.0. */
  cross: CrossRecord | null;
  /** @deprecated Use `stages` (the entries with `key: "f2l"`; slot in `meta.slot`). Removed in 2.0. */
  f2l: F2LRecord[];
  /** @deprecated Use `stages` (the entry with `key: "oll"`). Removed in 2.0. */
  oll: StageRecord | null;
  /** @deprecated Use `stages` (the entry with `key: "pll"`). Removed in 2.0. */
  pll: StageRecord | null;
  /** @deprecated Use `stages` (the entry with `key: "firstBlock"`; side in `meta.side`). Removed in 2.0. */
  firstBlock: BlockRecord | null;
  /** @deprecated Use `stages` (the entry with `key: "secondBlock"`; side in `meta.side`). Removed in 2.0. */
  secondBlock: BlockRecord | null;
  /** @deprecated Use `stages` (the entry with `key: "cmll"`). Removed in 2.0. */
  cmll: StageRecord | null;
  /** @deprecated Use `stages` (the entry with `key: "lse"`). Removed in 2.0. */
  lse: StageRecord | null;
}
