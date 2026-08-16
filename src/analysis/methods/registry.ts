// Registry of solving methods. A method is a staging strategy: it reads the
// replay context and reports where its own milestones completed, so adding a
// method never means editing the analyzer.
//
// Registration order is the tie-break order. When two methods stage the same
// solve equally early, the one registered first wins -- which is why the
// built-ins are registered before anything a caller adds.

import type { SolveMethod } from "../../types.js";

const METHODS: SolveMethod[] = [];

/**
 * Registers a staging strategy. Appended last, so built-in methods keep
 * priority on ties.
 */
export function registerMethod(method: SolveMethod): void {
  if (!method || typeof method.stage !== "function" || !method.name) {
    throw new TypeError("A method needs a `name` and a `stage(ctx)` function");
  }
  METHODS.push(method);
}

/** Every registered method, in registration order. */
export function listMethods(): SolveMethod[] {
  return METHODS.slice();
}
