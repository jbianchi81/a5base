export declare function delay(t: number, val?: unknown): Promise<unknown>;
export declare function isIterable<T>(obj: any): obj is Iterable<T>;
export declare function control_filter2(valid_filters: {
    [x: string]: {
        expression?: string;
        required?: boolean;
        table?: string;
        column?: string;
        type?: string;
        case_insensitive?: boolean;
        trunc?: string;
    };
}, filter: {
    [x: string]: any;
}, default_table?: string, crud?: any, throw_on_error?: boolean): string | null;
