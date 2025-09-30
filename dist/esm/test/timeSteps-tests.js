import assert from "assert";
import * as timeSteps from '../src/timeSteps';
assert.equal(timeSteps.intervalFromString("1 days").days, 1);
assert.equal(timeSteps.createInterval("03:00:00").hours, 3);
assert.equal(new timeSteps.Interval("345 years 9 months 30 days").months, 9);
assert.equal(new timeSteps.Interval("345 years 9 months 30 days").toPostgres(), "345 years 9 months 30 days");
assert.equal(new timeSteps.Interval("14:09:30").toPostgres(), "14 hours 9 minutes 30 seconds");
const i = new timeSteps.Interval("345 years 9 months 30 days 14 hours 9 minutes 30 seconds");
assert.equal(i.toPostgres(), "345 years 9 months 30 days 14 hours 9 minutes 30 seconds");
assert.equal(i.years, 345);
assert.equal(i.months, 9);
assert.equal(i.days, 30);
assert.equal(i.hours, 14);
assert.equal(i.minutes, 9);
assert.equal(i.seconds, 30);
console.log("✅ All tests passed!");
// run with:  
// npx tsx test/timeSteps-tests.ts
