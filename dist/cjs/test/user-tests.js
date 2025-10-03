"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const userAdmin_1 = require("../src/userAdmin");
const u = new userAdmin_1.User({ name: "user", role: "reader" });
assert_1.default.equal(u.name, "user");
assert_1.default.equal(u.role, "reader");
console.log("✅ All tests passed!");
// npx tsx --trace-uncaught test/user-tests.ts
