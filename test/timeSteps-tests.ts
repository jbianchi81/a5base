import assert from "assert";
import * as timeSteps from '../src/timeSteps'

assert(timeSteps.intervalFromString("1 days").days == 1)

console.log("✅ All tests passed!");

// run with:  
// npx tsx test/timeSteps-tests.ts