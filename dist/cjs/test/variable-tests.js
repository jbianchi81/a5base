"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const test = require('node:test');
const variable_1 = __importDefault(require("../src/variable"));
assert_1.default.equal(Object.keys(variable_1.default._fields).length, 13);
const variable = new variable_1.default({ nombre: "aaa" });
assert_1.default.equal(variable.nombre, "aaa");
//this.setOne(key, (this.constructor as typeof baseModel).sanitizeValue(key_value_pairs[key] as string | number | any[] | Date | null,(this.constructor as typeof baseModel)._fields[key]))
test('setOne', async (t) => {
    const variable = new variable_1.default({ nombre: "aaa" });
    // should not throw
    variable.setOne("timeSupport", { days: 1 });
});
test('setTSOneFromString', async (t) => {
    const variable = new variable_1.default({ nombre: "aaa" });
    const sanitized = variable_1.default.sanitizeValue("1 day", variable_1.default._fields["timeSupport"]);
    // should not throw    
    variable.setOne("timeSupport", sanitized);
    (0, assert_1.default)("days" in variable.timeSupport);
    assert_1.default.equal(variable.timeSupport["days"], 1);
});
test('setTSFromString', async (t) => {
    const variable = new variable_1.default({ nombre: "aaa" });
    // should not throw    
    variable.set({ timeSupport: "3 years 9 months 1 day" });
    (0, assert_1.default)("years" in variable.timeSupport);
    assert_1.default.equal(variable.timeSupport["years"], 3);
    (0, assert_1.default)("months" in variable.timeSupport);
    assert_1.default.equal(variable.timeSupport["months"], 9);
    (0, assert_1.default)("days" in variable.timeSupport);
    assert_1.default.equal(variable.timeSupport["days"], 1);
});
test('sanitize', async (t) => {
    const variable = new variable_1.default({ nombre: "aaa" });
    const sanitized = variable_1.default.sanitizeValue({ days: 1 }, variable_1.default._fields["timeSupport"]);
    (0, assert_1.default)("days" in sanitized);
    // should not throw
    variable.setOne("timeSupport", sanitized);
    (0, assert_1.default)("days" in variable.timeSupport);
    assert_1.default.equal(variable.timeSupport["days"], 1);
});
test('set', async (t) => {
    const variable = new variable_1.default({ nombre: "aaa" });
    // should not throw
    variable.set({ id: 1 });
    variable.set({ timeSupport: { days: 1 } });
    (0, assert_1.default)("days" in variable.timeSupport);
    assert_1.default.equal(variable.timeSupport["days"], 1);
});
test('variable read', async (t) => {
    const variables = await variable_1.default.read({}, {});
    (0, assert_1.default)(variables.length > 0);
    console.log("✅ All tests passed!");
});
// run with:  
// npx tsx test/variable-tests.ts
