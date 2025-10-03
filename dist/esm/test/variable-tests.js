import assert from "assert";
import test from 'node:test';
import { Variable } from '../src/variable';
assert.equal(Object.keys(Variable._fields).length, 13);
const variable = new Variable({ nombre: "aaa" });
assert.equal(variable.nombre, "aaa");
//this.setOne(key, (this.constructor as typeof baseModel).sanitizeValue(key_value_pairs[key] as string | number | any[] | Date | null,(this.constructor as typeof baseModel)._fields[key]))
test('setOne', async (t) => {
    const variable = new Variable({ nombre: "aaa" });
    // should not throw
    variable.setOne("timeSupport", { days: 1 });
});
test('setTSOneFromString', async (t) => {
    const variable = new Variable({ nombre: "aaa" });
    const sanitized = Variable.sanitizeValue("1 day", Variable._fields["timeSupport"]);
    // should not throw    
    variable.setOne("timeSupport", sanitized);
    assert("days" in variable.timeSupport);
    assert.equal(variable.timeSupport["days"], 1);
});
test('setTSFromString', async (t) => {
    const variable = new Variable({ nombre: "aaa" });
    // should not throw    
    variable.set({ timeSupport: "3 years 9 months 1 day" });
    assert("years" in variable.timeSupport);
    assert.equal(variable.timeSupport["years"], 3);
    assert("months" in variable.timeSupport);
    assert.equal(variable.timeSupport["months"], 9);
    assert("days" in variable.timeSupport);
    assert.equal(variable.timeSupport["days"], 1);
});
test('sanitize', async (t) => {
    const variable = new Variable({ nombre: "aaa" });
    const sanitized = Variable.sanitizeValue({ days: 1 }, Variable._fields["timeSupport"]);
    assert("days" in sanitized);
    // should not throw
    variable.setOne("timeSupport", sanitized);
    assert("days" in variable.timeSupport);
    assert.equal(variable.timeSupport["days"], 1);
});
test('set', async (t) => {
    const variable = new Variable({ nombre: "aaa" });
    // should not throw
    variable.set({ id: 1 });
    variable.set({ timeSupport: { days: 1 } });
    assert("days" in variable.timeSupport);
    assert.equal(variable.timeSupport["days"], 1);
});
test('variable read', async (t) => {
    const variables = await Variable.read({}, {});
    assert(variables.length > 0);
});
test('variable read by id', async (t) => {
    const variable = await Variable.read(1);
    assert.equal(variable.id, 1);
});
test('variable read nonexistent id', async (t) => {
    const variable = await Variable.read(145657);
    assert.equal(typeof variable, "undefined");
    console.log("✅ All tests passed!");
});
// run with:  
// npx tsx test/variable-tests.ts
