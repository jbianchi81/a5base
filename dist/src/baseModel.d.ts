/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import fs from 'promise-fs';
declare type AnyClass = {
    toCSV?(): string;
    valor?: string | Uint8Array | Buffer | number | number[];
    prototype?: string | string[];
    create(): Promise<AnyClass | AnyClass[]>;
};
interface WriteableModel {
    toCSV?(): string;
    valor?: string | Uint8Array | Buffer | number | number[];
    prototype?: string | string[];
}
interface ModelField {
    child?: any;
    class?: new () => void;
    foreign_key?: boolean | {
        [x: string]: string;
    };
    type: "string" | "object" | "number" | "boolean" | "geometry" | "integer" | "timestamp" | "date";
    table?: string;
    column?: string;
    primary_key?: boolean;
}
export declare function writeModelToFile(model: WriteableModel, output_file: string, output_format: string): Promise<void>;
declare type AnyModel<T = AnyClass> = {
    new (...args: any[]): T;
    fromCSV?(csv: string, separator?: string, header?: string[]): T;
    fromRaster?(rast: unknown): T;
    fromGeoJSON?(geojson: unknown, nombre_property?: string, id_property?: string): T;
};
interface ReadFileOptions {
    separator?: string;
    property_name?: string;
    header?: boolean;
    nombre_property?: string;
    id_property?: string;
}
export declare function readModelFromFile(model_class: AnyModel, input_file: string, input_format: string, options?: ReadFileOptions): AnyClass | AnyClass[];
export default class baseModel {
    writeFile(output_file: string, output_format: string): Promise<void>;
    static readFile(input_file: string, input_format: string, options: ReadFileOptions): AnyClass | AnyClass[];
    static createFromFile(input_file: any, input_format: any, options: any): Promise<AnyClass | (AnyClass | AnyClass[])[]>;
    /**
     * Reads list of tuples from yml or json or csv. IF csv, the header must contain the field names. Tuples must include all primary keys and at least one non-primary key field. If the primary keys match a database record, it is updated. Else the tuple is skipped (For record insertion use .createFromFile)
     * @param {string} input_file
     * @param {string} input_format
     * @param {*} options
     */
    static updateFromFile(input_file: fs.PathOrFileDescriptor, input_format?: string, options?: {
        property_name?: string;
    }): Promise<baseModel[]>;
    constructor(fields?: {});
    static sanitizeValue(value: string | number | any[] | Date | null, definition?: {
        class?: any;
        type?: any;
        items?: any;
    }): any;
    static getForeignKeyFields(): any;
    static getPrimaryKeyFields(): any;
    getPrimaryKeyValues(): any;
    setParents(): Promise<void>;
    getParentFields(field: {
        foreign_key: {
            [x: string]: string | number;
        };
        column: string;
    }, key_value_pairs: {
        [x: string]: any;
    }): any;
    setOne<K extends keyof this>(prop: K, value: this[K]): void;
    set<K extends keyof this>(key_value_pairs?: Partial<Pick<this, K>>): void;
    /**
     *
     * @param {object[]} data - list of instances of this class (or objects parseable into it)
     * @param {*} options
     * @param {boolean} options.header - include csv header
     * @param {string[]} options.columns - print only this columns
     * @returns
     */
    static toCSV(data: any, options?: {
        header?: boolean;
        columns?: any;
    }): string;
    /**
     *
     * @param {object} options - options
     * @param {boolean} options.header - add header line with column names
     * @param {string[]} options.columns - print only this columns
     * @returns {string} csv encoded string
     */
    toCSV(options?: {
        header?: boolean;
        columns?: string[];
    }): string;
    getOne<K extends keyof this>(key: K): this[K];
    /**
     *
     * @returns {string[]} column names
     */
    static getCSVHeader(columns: string | string[]): string[];
    /**
     *
     * @param {string} row_csv_string - delimited string
     * @param {string[]} [columns] - ordered field names to assign to parsed csv line
     * @returns {object} an instance of this class
     */
    static fromCSV(row_csv_string: string, separator: string | undefined, columns: string[]): baseModel;
    build_insert_statement(): {
        string: string;
        params: any[];
    };
    static getColumns(add_table_name?: boolean): (string | undefined)[];
    checkPK(): void;
    create(): Promise<this>;
    static build_read_statement(filter?: {}): string;
    /**
     *
     * @param {Object} filter
     * @param {Object} options
     * @returns
     */
    static read(filter?: object, options?: any): Promise<baseModel[]>;
    build_update_query<T = Partial<this>>(update_keys?: (keyof T)[]): {
        string: string;
        params: T[keyof T][];
    } | undefined;
    /**
     * Updates each row matching given primary keys with given non-primary key field values
     * @param {object[]} updates - List of tuples. Each tuple must contain table primary key values and at least one non-primary key field with a new value
     */
    static update(this: typeof baseModel, updates?: {
        [x: string]: any;
    }[]): Promise<baseModel[]>;
    update(changes?: {}): Promise<this>;
    static delete(filter?: {}): Promise<baseModel[]>;
    partial(columns?: (keyof this)[]): baseModel;
    static _table_name: undefined;
    static _fields: {
        [x: string]: ModelField;
    };
    static _additional_filters: {};
}
export declare class BaseArray<Type> extends Array {
    create(): Promise<Type[]>;
    writeFile(output_file: any, output_format: any): Promise<void>;
    static readFile(input_file: any, input_format: any, options: any): AnyClass | AnyClass[];
}
export {};
