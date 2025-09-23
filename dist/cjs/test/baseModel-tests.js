"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const baseModel_1 = require("../src/baseModel");
assert_1.default.equal(Object.keys(baseModel_1.baseModel._fields).length, 0);
const myBaseModel = new baseModel_1.baseModel();
assert_1.default.equal(myBaseModel.toCSV(), "");
console.log("✅ All tests passed!");
// run with:  
// npx tsx test/baseModel-tests.ts
