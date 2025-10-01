import PostgresInterval from 'postgres-interval';
export interface IntervalDict {
    years?: number;
    months?: number;
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
    milliseconds?: number;
}
export declare function intervalFromString(interval_string: string): PostgresInterval.IPostgresInterval;
export declare function createInterval(value: any): PostgresInterval.IPostgresInterval | undefined;
export declare function interval2epochSync(interval?: any): number | undefined;
export declare class Interval {
    private interval;
    constructor(intervalstr: string);
    get years(): number;
    get months(): number;
    get days(): number;
    get hours(): number;
    get minutes(): number;
    get seconds(): number;
    get milliseconds(): number;
    set years(v: number);
    set months(v: number);
    set days(v: number);
    set hours(v: number);
    set minutes(v: number);
    set seconds(v: number);
    set milliseconds(v: number);
    toPostgres(): string;
    toEpoch(): number | undefined;
    getKey(): string | undefined;
    getValue(): number | undefined;
}
export declare function interval2string(interval?: IntervalDict | string): string;
