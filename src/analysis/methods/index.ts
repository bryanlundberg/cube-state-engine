// Built-in staging strategies. Registration order doubles as tie-break order,
// so CFOP is registered first: when a solve stages equally well as both, the
// CFOP reading wins.

import { listMethods, registerMethod } from "./registry.js";
import { cfop } from "./cfop.js";
import { roux } from "./roux.js";

registerMethod(cfop);
registerMethod(roux);

export { registerMethod, listMethods, cfop, roux };
