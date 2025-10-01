"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Interval = void 0;
exports.intervalFromString = intervalFromString;
exports.createInterval = createInterval;
exports.interval2epochSync = interval2epochSync;
exports.interval2string = interval2string;
// import parsePGinterval from 'postgres-interval'
const postgres_interval_1 = __importDefault(require("postgres-interval"));
// type IntervalObject = ReturnType<typeof interval>;
function isJson(str) {
    try {
        JSON.parse(str);
    }
    catch (e) {
        return false;
    }
    return true;
}
const interval_key_map = {
    milliseconds: "milliseconds",
    millisecond: "milliseconds",
    seconds: "seconds",
    second: "seconds",
    minutes: "minutes",
    minute: "minutes",
    hours: "hours",
    hour: "hours",
    days: "days",
    day: "days",
    months: "months",
    month: "months",
    mon: "months",
    years: "years",
    year: "years"
};
function intervalFromString(interval_string) {
    const kvp = interval_string.split(/\s+/);
    if (kvp.length > 1) {
        var interval = (0, postgres_interval_1.default)("");
        const dict = {};
        for (var i = 0; i < kvp.length - 1; i = i + 2) {
            var key = interval_key_map[kvp[i + 1].toLowerCase()];
            if (!key) {
                throw ("Invalid interval key " + kvp[i + 1].toLowerCase());
            }
            dict[key] = parseInt(kvp[i]);
            // if(key != "toPostgres") {
            // 	interval[key] = parseInt(kvp[i]!) as number
            // }
        }
        interval.years = dict.years || 0;
        interval.months = dict.months || 0;
        interval.days = dict.days || 0;
        interval.hours = dict.hours || 0;
        interval.minutes = dict.minutes || 0;
        interval.seconds = dict.seconds || 0;
        interval.milliseconds = dict.milliseconds || 0;
    }
    else {
        var interval = (0, postgres_interval_1.default)(interval_string);
    }
    // Object.assign(interval,JSON.parse(value))
    return interval;
}
function createInterval(value) {
    if (!value) {
        return; //  parsePGinterval()
    }
    if (value.constructor && value.constructor.name == 'PostgresInterval') {
        var interval = (0, postgres_interval_1.default)("");
        Object.assign(interval, value);
        return interval;
    }
    if (value instanceof Object) {
        var interval = (0, postgres_interval_1.default)("");
        Object.keys(value).map(k => {
            switch (k) {
                case "milliseconds":
                case "millisecond":
                    interval.milliseconds = value[k];
                    break;
                case "seconds":
                case "second":
                    interval.seconds = value[k];
                    break;
                case "minutes":
                case "minute":
                    interval.minutes = value[k];
                    break;
                case "hours":
                case "hour":
                    interval.hours = value[k];
                    break;
                case "days":
                case "day":
                    interval.days = value[k];
                    break;
                case "months":
                case "month":
                case "mon":
                    interval.months = value[k];
                    break;
                case "years":
                case "year":
                    interval.years = value[k];
                    break;
                default:
                    break;
            }
        });
        return interval;
    }
    if (typeof value == 'string') {
        if (isJson(value)) {
            var interval = (0, postgres_interval_1.default)("");
            Object.assign(interval, JSON.parse(value));
            return interval;
        }
        else {
            return intervalFromString(value);
            // return parsePGinterval(value)
        }
    }
    else {
        console.error("timeSteps.createInterval: Invalid value");
        return;
    }
}
function interval2epochSync(interval) {
    if (!interval) {
        return 0;
    }
    if (!interval instanceof Object) {
        console.error("interval must be an postgresInterval object");
        return;
    }
    var seconds = 0;
    Object.keys(interval).map(k => {
        switch (k) {
            case "milliseconds":
            case "millisecond":
                seconds = seconds + interval[k] * 0.001;
                break;
            case "seconds":
            case "second":
                seconds = seconds + interval[k];
                break;
            case "minutes":
            case "minute":
                seconds = seconds + interval[k] * 60;
                break;
            case "hours":
            case "hour":
                seconds = seconds + interval[k] * 3600;
                break;
            case "days":
            case "day":
                seconds = seconds + interval[k] * 86400;
                break;
            case "weeks":
            case "week":
                seconds = seconds + interval[k] * 86400 * 7;
                break;
            case "months":
            case "month":
            case "mon":
                seconds = seconds + interval[k] * 86400 * 31;
                break;
            case "years":
            case "year":
                seconds = seconds + interval[k] * 86400 * 365;
                break;
            default:
                break;
        }
    });
    return seconds;
}
class Interval {
    constructor(intervalstr) {
        this.interval = (0, postgres_interval_1.default)(intervalstr);
        const values = createInterval(intervalstr);
        Object.assign(this.interval, values);
    }
    get years() { return this.interval.years; }
    get months() { return this.interval.months; }
    get days() { return this.interval.days; }
    get hours() { return this.interval.hours; }
    get minutes() { return this.interval.minutes; }
    get seconds() { return this.interval.seconds; }
    get milliseconds() { return this.interval.milliseconds; }
    set years(v) { this.interval.years = v; }
    set months(v) { this.interval.months = v; }
    set days(v) { this.interval.days = v; }
    set hours(v) { this.interval.hours = v; }
    set minutes(v) { this.interval.minutes = v; }
    set seconds(v) { this.interval.seconds = v; }
    set milliseconds(v) { this.interval.milliseconds = v; }
    toPostgres() {
        return this.interval.toPostgres();
    }
    toEpoch() {
        return interval2epochSync(this);
    }
    getKey() {
        for (var key of Object.keys(this.interval)) {
            if (key == "toPostgres") {
                continue;
            }
            const k = key;
            if (this.interval[k] && this.interval[k] > 0) {
                return key;
            }
        }
    }
    getValue() {
        const key = this.getKey();
        if (key) {
            const k = key;
            return this.interval[k];
        }
    }
}
exports.Interval = Interval;
function interval2string(interval) {
    if (!interval) {
        return "00:00:00";
    }
    if (interval instanceof Object) {
        if (Object.keys(interval).length == 0) {
            return "00:00:00";
        }
        else {
            var string = "";
            Object.keys(interval).forEach(key => {
                const k = key;
                string += interval[k] + " " + key + " ";
            });
            return string.replace(/\s$/, "");
        }
    }
    else {
        return interval.toString();
    }
}
