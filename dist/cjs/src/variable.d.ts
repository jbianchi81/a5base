import { baseModel, ModelField } from './baseModel';
import { Interval, IntervalDict } from './timeSteps';
export interface VariableFields {
    id?: number;
    var?: string;
    nombre?: string;
    abrev?: string;
    type?: string;
    datatype?: string;
    valuetype?: string;
    GeneralCategory?: string;
    VariableName?: string;
    SampleMedium?: string;
    def_unit_id?: string;
    timeSupport?: Interval;
    def_hora_corte?: Interval;
}
export default class Variable extends baseModel {
    id: number | undefined;
    var: string | undefined;
    nombre?: string | undefined;
    abrev?: string | undefined;
    type?: string | undefined;
    datatype?: string | undefined;
    valuetype?: string | undefined;
    GeneralCategory?: string | undefined;
    VariableName?: string | undefined;
    SampleMedium?: string | undefined;
    def_unit_id?: string | undefined;
    timeSupport?: IntervalDict | undefined;
    def_hora_corte?: IntervalDict | undefined;
    static _table_name: string;
    constructor(args: VariableFields);
    getId(): Promise<void>;
    toString(): string;
    toCSV(): string;
    static _fields: {
        [x: string]: ModelField;
    };
    toCSVless(): string;
    toJSON(): {
        id: number | undefined;
        var: string | undefined;
        nombre: string | undefined;
        abrev: string | undefined;
        type: string | undefined;
        datatype: string | undefined;
        valuetype: string | undefined;
        GeneralCategory: string | undefined;
        VariableName: string | undefined;
        SampleMedium: string | undefined;
        def_unit_id: string | undefined;
        timeSupport: IntervalDict | undefined;
        def_hora_corte: IntervalDict | undefined;
    };
    static upsertVarQuery(variable: Variable): string;
    create(): Promise<this>;
    static read(filter: object, options?: object): Promise<Variable[]>;
    static read(id: number, options?: object): Promise<Variable | undefined>;
    find(): Promise<Variable | undefined>;
    update(changes?: {}): Promise<this>;
    static delete(filter?: {}, options?: {}): Promise<Variable[]>;
    delete(): Promise<Variable | undefined>;
}
