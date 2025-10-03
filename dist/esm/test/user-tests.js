import assert from "assert";
import { User } from '../src/userAdmin';
const u = new User({ name: "user", role: "reader" });
assert.equal(u.name, "user");
assert.equal(u.role, "reader");
console.log("✅ All tests passed!");
// npx tsx --trace-uncaught test/user-tests.ts
