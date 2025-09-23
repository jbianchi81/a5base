import assert from "assert";
import {baseModel} from '../src/baseModel'

assert.equal(Object.keys(baseModel._fields).length,0)

const myBaseModel = new baseModel()

assert.equal(myBaseModel.toCSV(),"")

console.log("✅ All tests passed!");

// run with:  
// npx tsx test/baseModel-tests.ts