"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const timeSteps = __importStar(require("../src/timeSteps"));
assert_1.default.equal(timeSteps.intervalFromString("1 days").days, 1);
assert_1.default.equal(timeSteps.createInterval("03:00:00").hours, 3);
assert_1.default.equal(new timeSteps.Interval("345 years 9 months 30 days").months, 9);
assert_1.default.equal(new timeSteps.Interval("345 years 9 months 30 days").toPostgres(), "345 years 9 months 30 days");
assert_1.default.equal(new timeSteps.Interval("14:09:30").toPostgres(), "14 hours 9 minutes 30 seconds");
const i = new timeSteps.Interval("345 years 9 months 30 days 14 hours 9 minutes 30 seconds");
assert_1.default.equal(i.toPostgres(), "345 years 9 months 30 days 14 hours 9 minutes 30 seconds");
assert_1.default.equal(i.years, 345);
assert_1.default.equal(i.months, 9);
assert_1.default.equal(i.days, 30);
assert_1.default.equal(i.hours, 14);
assert_1.default.equal(i.minutes, 9);
assert_1.default.equal(i.seconds, 30);
console.log("✅ All tests passed!");
// run with:  
// npx tsx test/timeSteps-tests.ts
