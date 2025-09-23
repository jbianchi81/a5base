import * as utils from '../src/utils';
import assert from "assert";
assert.strictEqual(utils.control_filter2({ nombre: { type: "string" } }, { nombre: "josé" }, "t"), `  AND "t"."nombre"='josé'`);
assert(utils.isIterable([1, 2, 3, 4]));
assert(!utils.isIterable(1.234));
console.log("✅ All tests passed!");
// run with:  
// npx tsx test/utils-tests.ts 
