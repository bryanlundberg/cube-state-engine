// The public predicate API.
//
// Every function accepts a `CubeEngine`, a `state()` object, or a flat sticker
// array, so a caller passes whichever it already holds. In a trainer the last
// layer is usually a FIXED face (the cube starts solved and the smartcube
// tracks from there), so `face` defaults to 'U' and no color search is needed.

import type {
  Color,
  CubeState,
  FaceIndex,
  FaceLetter,
  FlatState,
  Geometry,
  GoalName,
  GoalSpec,
  PredicateInput,
} from "../types.js";
import type { CubeEngine } from "../core/engine.js";
import { getCubeGeometry } from "../geometry/geometry.js";
import { faceIndex } from "../geometry/faces.js";
import { centersOf, faceUniform, flattenState, isSolvedFlat } from "./flat.js";
import { cornersSolvedOnFace, crossDone, f2lSlotStates } from "./stages.js";

function isEngine(input: PredicateInput): input is CubeEngine {
  return typeof (input as CubeEngine)?.state === "function";
}

function isCubeState(input: PredicateInput): input is CubeState {
  return (input as CubeState)?.UPPER != null;
}

/** Normalizes any accepted input into a flat sticker array. */
function toFlat(input: PredicateInput): FlatState {
  if (Array.isArray(input)) return input;
  if (isEngine(input)) return flattenState(input.state());
  if (isCubeState(input)) return flattenState(input);
  throw new TypeError(
    "Expected a CubeEngine, a state() object, or a flat sticker array"
  );
}

/** Flat array + matching geometry for the input's inferred size. */
function context(input: PredicateInput): { flat: FlatState; geo: Geometry } {
  const flat = toFlat(input);
  const per = flat.length / 6;
  const size = Math.round(Math.sqrt(per));
  return { flat, geo: getCubeGeometry(size) };
}

/**
 * Whether the given face shows a single uniform color (last layer oriented).
 * @param opts - Face to check (default 'U').
 */
export function isLastLayerOriented(
  input: PredicateInput,
  { face = "U" }: { face?: FaceLetter | FaceIndex } = {}
): boolean {
  const { flat, geo } = context(input);
  return faceUniform(flat, geo, faceIndex(face));
}

/**
 * Whether the four corners of the given face are fully solved (their side
 * stickers match the neighboring centers).
 * @param opts - Face to check (default 'U').
 */
export function areLastLayerCornersSolved(
  input: PredicateInput,
  { face = "U" }: { face?: FaceLetter | FaceIndex } = {}
): boolean {
  const { flat, geo } = context(input);
  return cornersSolvedOnFace(flat, geo, faceIndex(face));
}

/**
 * Whether the cross of a given color is complete. Defaults to the color
 * currently on the DOWN center (the usual CFOP cross face).
 */
export function isCrossComplete(
  input: PredicateInput,
  { color }: { color?: Color } = {}
): boolean {
  const { flat, geo } = context(input);
  const c = color ?? centersOf(flat, geo)[5];
  return crossDone(flat, geo, c);
}

/**
 * Whether the first two layers are complete for a given cross color: the cross
 * itself plus all four F2L pairs solved. Defaults to the DOWN center color.
 */
export function isF2LComplete(
  input: PredicateInput,
  { cross }: { cross?: Color } = {}
): boolean {
  const { flat, geo } = context(input);
  const color = cross ?? centersOf(flat, geo)[5];
  if (!crossDone(flat, geo, color)) return false;
  const slots = Object.values(f2lSlotStates(flat, geo, color));
  return slots.length === 4 && slots.every(Boolean);
}

/** Whether the whole cube is solved (every face uniform). */
export function isCubeSolved(input: PredicateInput): boolean {
  const { flat, geo } = context(input);
  return isSolvedFlat(flat, geo.per);
}

/**
 * Dispatcher a trainer calls after each move to test a configurable goal.
 *
 * `goalSpec` may be:
 *   - a function `(input) => boolean` — a custom predicate (escape hatch);
 *   - a string goal name: 'full' | 'solved' | 'oll' | 'oll+cp' | 'f2l' | 'cross';
 *   - an object `{ goal, face, color, cross, custom }` where `custom` (a
 *     function) takes precedence and the rest parameterize the named goal.
 */
export function matchesGoal(
  input: PredicateInput,
  goalSpec: GoalName | GoalSpec | ((input: PredicateInput) => boolean) = "full"
): boolean {
  if (typeof goalSpec === "function") return !!goalSpec(input);
  const spec: GoalSpec =
    typeof goalSpec === "string" ? { goal: goalSpec } : goalSpec || {};
  if (typeof spec.custom === "function") return !!spec.custom(input);

  const goal = String(spec.goal ?? "full").toLowerCase();
  const face = spec.face ?? "U";
  switch (goal) {
    case "full":
    case "solved":
      return isCubeSolved(input);
    case "oll":
      return isLastLayerOriented(input, { face });
    case "oll+cp":
    case "ollcp":
    case "oll_cp":
      return (
        isLastLayerOriented(input, { face }) &&
        areLastLayerCornersSolved(input, { face })
      );
    case "f2l":
      return isF2LComplete(input, { cross: spec.cross ?? spec.color });
    case "cross":
      return isCrossComplete(input, { color: spec.color });
    default:
      throw new Error(`Unknown goal: ${spec.goal}`);
  }
}
