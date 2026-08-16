// Public entry point. Everything below is re-exported from a module that owns
// it; this file only decides what the package surface is.

// --- Core -----------------------------------------------------------------

export { CubeEngine } from "./core/engine.js";
export type { CubeEngineOptions, ApplyMovesOptions } from "./core/engine.js";
export { getMovePermutations } from "./core/permutations.js";
export { COLOR, FACE_COLORS, FACE_NAMES } from "./core/constants.js";

// --- Geometry -------------------------------------------------------------

export { getCubeGeometry, buildGeometry } from "./geometry/geometry.js";
export { FACE_LETTERS, FACE_MOVE_TO_INDEX } from "./geometry/faces.js";

// --- Notation -------------------------------------------------------------

export { simplifyMoves } from "./notation/simplify.js";
export { invertSequence, invertToken, normalizeToken } from "./notation/tokens.js";

// --- Predicates -----------------------------------------------------------
//
// These accept a CubeEngine, a state() object, or a flat sticker array, and
// power goal detection in trainers (last-layer orientation, F2L, cross,
// solved, ...) as well as the analyzer.

export {
  areLastLayerCornersSolved,
  isCrossComplete,
  isCubeSolved,
  isF2LComplete,
  isLastLayerOriented,
  matchesGoal,
} from "./predicates/goals.js";

// Low-level flat-state helpers (advanced/introspection use).
export {
  centersOf,
  faceUniform,
  flattenState,
  isSolvedFlat,
  slotCorrect,
} from "./predicates/flat.js";
export {
  cornersSolvedOnFace,
  crossDone,
  f2lSlotStates,
  ollDone,
} from "./predicates/stages.js";

// --- Analysis -------------------------------------------------------------

export { analyzeSolution } from "./analysis/analyzer.js";
export { buildReplay } from "./analysis/replay.js";
export { completionIndex, firstIndexAfter, toStages } from "./analysis/milestones.js";

// Staging strategies. `registerMethod` is the extension point: a method reports
// where its own milestones completed, and the analyzer picks the one that fits.
export { registerMethod, listMethods, cfop, roux } from "./analysis/methods/index.js";

// --- Types ----------------------------------------------------------------

export type {
  BlockRecord,
  Color,
  CrossRecord,
  CrossTime,
  CubeSize,
  CubeState,
  CubieSlot,
  F2LRecord,
  FaceIndex,
  FaceLetter,
  FaceName,
  FlatState,
  Geometry,
  GoalName,
  GoalSpec,
  Milestone,
  MoveKey,
  MovePermutations,
  ParsedMove,
  Permutation,
  PredicateInput,
  ReplayContext,
  SolveAnalysis,
  SolveMethod,
  Stage,
  StageMeta,
  StageRecord,
  StagingContext,
  Staging,
  StartFace,
  TimedMove,
  TurnDirection,
} from "./types.js";
