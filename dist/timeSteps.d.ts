import { IntervalObject } from 'postgres-interval';
export declare function intervalFromString(interval_string: string): IntervalObject;
export declare function createInterval(value: any): IntervalObject | undefined;
export declare function interval2epochSync(interval?: any): number | undefined;
export declare class Interval {
    private interval;
    constructor(intervalstr: string);
    get years(): number | undefined;
    get months(): number | undefined;
    get days(): number | undefined;
    get hours(): number | undefined;
    get minutes(): number | undefined;
    get seconds(): number | undefined;
    get milliseconds(): number | undefined;
    toEpoch(): number | undefined;
    getKey(): string | undefined;
    getValue(): number | (() => string) | undefined;
}
