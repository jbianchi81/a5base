"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const node_test_1 = __importDefault(require("node:test"));
const variable_1 = require("../src/variable");
assert_1.default.equal(Object.keys(variable_1.Variable._fields).length, 13);
const variable = new variable_1.Variable({ nombre: "aaa" });
assert_1.default.equal(variable.nombre, "aaa");
//this.setOne(key, (this.constructor as typeof baseModel).sanitizeValue(key_value_pairs[key] as string | number | any[] | Date | null,(this.constructor as typeof baseModel)._fields[key]))
(0, node_test_1.default)('setOne', async (t) => {
    const variable = new variable_1.Variable({ nombre: "aaa" });
    // should not throw
    variable.setOne("timeSupport", { days: 1 });
});
(0, node_test_1.default)('setTSOneFromString', async (t) => {
    const variable = new variable_1.Variable({ nombre: "aaa" });
    const sanitized = variable_1.Variable.sanitizeValue("1 day", variable_1.Variable._fields["timeSupport"]);
    // should not throw    
    variable.setOne("timeSupport", sanitized);
    (0, assert_1.default)("days" in variable.timeSupport);
    assert_1.default.equal(variable.timeSupport["days"], 1);
});
(0, node_test_1.default)('setTSFromString', async (t) => {
    const variable = new variable_1.Variable({ nombre: "aaa" });
    // should not throw    
    variable.set({ timeSupport: "3 years 9 months 1 day" });
    (0, assert_1.default)("years" in variable.timeSupport);
    assert_1.default.equal(variable.timeSupport["years"], 3);
    (0, assert_1.default)("months" in variable.timeSupport);
    assert_1.default.equal(variable.timeSupport["months"], 9);
    (0, assert_1.default)("days" in variable.timeSupport);
    assert_1.default.equal(variable.timeSupport["days"], 1);
});
(0, node_test_1.default)('sanitize', async (t) => {
    const variable = new variable_1.Variable({ nombre: "aaa" });
    const sanitized = variable_1.Variable.sanitizeValue({ days: 1 }, variable_1.Variable._fields["timeSupport"]);
    (0, assert_1.default)("days" in sanitized);
    // should not throw
    variable.setOne("timeSupport", sanitized);
    (0, assert_1.default)("days" in variable.timeSupport);
    assert_1.default.equal(variable.timeSupport["days"], 1);
});
(0, node_test_1.default)('set', async (t) => {
    const variable = new variable_1.Variable({ nombre: "aaa" });
    // should not throw
    variable.set({ id: 1 });
    variable.set({ timeSupport: { days: 1 } });
    (0, assert_1.default)("days" in variable.timeSupport);
    assert_1.default.equal(variable.timeSupport["days"], 1);
});
(0, node_test_1.default)('variable read', async (t) => {
    const variables = await variable_1.Variable.read({}, {});
    (0, assert_1.default)(variables.length > 0);
});
(0, node_test_1.default)('variable read by id', async (t) => {
    const variable = await variable_1.Variable.read(1);
    assert_1.default.equal(variable.id, 1);
});
(0, node_test_1.default)('variable read nonexistent id', async (t) => {
    const variable = await variable_1.Variable.read(145657);
    assert_1.default.equal(typeof variable, "undefined");
    console.log("✅ All tests passed!");
});
// run with:  
// npx tsx test/variable-tests.ts
