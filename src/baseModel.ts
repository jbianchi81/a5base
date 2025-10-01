'use strict'

import fs from 'promise-fs';
import YAML from 'yaml';
import {parse, stringify} from 'csv-string';
import {isIterable, delay, control_filter2} from './utils';
import { createInterval, Interval, interval2string, IntervalDict } from './timeSteps';
import Geometry from './geometry';
import { Comma } from 'csv-string/dist/types';
import setGlobal, {A5Config} from './setGlobal'
import { Pool, PoolClient } from 'pg';

const g = setGlobal()

type KeyValueTuple = [key: string, value: unknown];

type AnyClass = {
    toCSV?(): string
    valor?: string | Uint8Array | Buffer | number | number[]
    prototype?: string | string[]
    create(): Promise<AnyClass|AnyClass[]>
};

interface WriteableModel {
    toCSV?(): string
    valor?: string | Uint8Array | Buffer | number | number[]
    prototype?: string | string[]
};


export interface ModelField {
	child?: any;
	class?: new () => void;
    foreign_key?: boolean | {[x: string]: string}
    type: "string" | "object" | "number" | "boolean" | "geometry" | "integer" | "timestamp" | "date" | "buffer" | "any" | "interval"
    table?: string
    column?: string
    primary_key?: boolean
}

interface ClassModelField {
	class: new () => void;
	foreign_key: {[x: string]: any}
	column: string
}

type Coercible<T> =
  T extends Date ? Date | string :
  T extends number ? number | string :
  T extends boolean ? boolean | string :
  T extends IntervalDict ? IntervalDict | string : 
  T;


export async function writeModelToFile(model: WriteableModel, output_file : string, output_format : string) {
	if(!model) {
		throw("missing model")
	}
	if(!output_file) {
		throw("Missing output_file")
	}
	output_format = (output_format) ? output_format : "json"
	if(output_format=="json") {
		await fs.writeFile(output_file,JSON.stringify(model))
	} else if(output_format=="csv") {
		if(!model.toCSV) {
			throw("toCSV() not defined for this class")
		}
		await fs.writeFile(output_file,model.toCSV())
	} else if(output_format=="raster") {
        if(!model.valor) {
            throw new Error("Missing valor")
        }
        if(!model.valor  as any instanceof Buffer) {
            throw new Error("Invalid valor. Must be buffer")
        }
        if (typeof model.valor === "string") {
            await fs.writeFile(output_file, Buffer.from(model.valor, "utf8")); // string case
        } else if (Array.isArray(model.valor) && model.valor.every(n => typeof n === "number")) {
            await fs.writeFile(output_file, Buffer.from(model.valor)); // number array case
        } else if (model.valor instanceof Buffer) {
            await fs.writeFile(output_file, Buffer.from(model.valor)); // copy buffer case
        } else if (model.valor instanceof Uint8Array) {
            await fs.writeFile(output_file, Buffer.from(model.valor)); // typed array case
        } else {
            throw new Error("Invalid argument for Buffer.from");
        }
	} else {
		throw("Invalid format")
	}
	await delay(500) 
}

type AnyModel<T = AnyClass> = {
    new (...args: any[]): T;
    fromCSV?(csv: string, separator?: string, header?: string[]): T;
    fromRaster?(rast: unknown): T;
    fromGeoJSON?(geojson: unknown, nombre_property? : string, id_property?: string): T;
}

interface ReadFileOptions {
    separator?: string
    property_name?: string
    header?: boolean
    nombre_property?: string
    id_property?: string
}

export function readModelFromFile(
	model_class : AnyModel,
	input_file : string,
	input_format : string, 
	options : ReadFileOptions = {}) {
	const separator = options.separator ?? ","
	if(!model_class) {
		throw("missing model_class")
	}
	if(!input_file) {
		throw("Missing input_file")
	}
	input_format = (input_format) ? input_format : "json"
	if(input_format=="json" || input_format=="yml") {
		var content = fs.readFileSync(input_file,'utf-8')
		var parsed_content = YAML.parse(content) // JSON.parse(content)
		if(options.property_name != null) {
			if(!parsed_content.hasOwnProperty(options.property_name)) {
				throw(`Property ${options.property_name} not found in json file`)
			}
			parsed_content = parsed_content[options.property_name]
		}
		if(model_class.prototype instanceof Array) {
			return new model_class(parsed_content)
		} else if(Array.isArray(parsed_content)) {
			return parsed_content.map(r=>new model_class(r))
		} else {
			return new model_class(parsed_content)
		}			
	} else if(input_format=="csv") {
		if(!model_class.fromCSV) {
			throw("fromCSV() not defined for this class")
		}
		var content = fs.readFileSync(input_file,'utf-8')
		if(model_class.prototype instanceof Array) {
			return model_class.fromCSV(content, separator)
		} else {
			// if(Array.isArray(parsed_content)) {
			const parsed_content = content.split("\n").filter(x => !/^\s*$/.test(x))
			if(options.header) {
				const columns = parsed_content.shift()
                if(!columns) {
                    throw new Error("No content found in csv file.")
                }
				const columns_arr = columns.split(separator)
				// console.debug("columns: " + columns.join(" - ") + ". rows: " + parsed_content.length)
				return parsed_content.map(r=>model_class.fromCSV!(r,separator,columns_arr))
			} else {
				return parsed_content.map(r=>model_class.fromCSV!(r,separator))
			}
		} 
	} else if(input_format=="raster") {
		if(!model_class.fromRaster) {
			throw("fromRaster() not defined for this class")
		}
		// var content = fs.readFileSync(input_file)
		return model_class.fromRaster(input_file) // content)
	} else if(input_format=="geojson") {
		if(!model_class.fromGeoJSON) {
			throw("fromGeoJSON() not defined for this class")
		}
		return model_class.fromGeoJSON(input_file,options.nombre_property,options.id_property)
	} else {
		throw("Invalid format")
	}
}

export class baseModel {

	static _config : A5Config | undefined = g.config
	static _pool : Pool | undefined = g.pool

	async writeFile(output_file : string, output_format : string) {
		return writeModelToFile(this,output_file,output_format)
    }
	static readFile(input_file: string,input_format: string,options: ReadFileOptions) {
		return readModelFromFile(this,input_file,input_format,options)
	}
	static async createFromFile(input_file: any,input_format: any,options: any) {
		const read_result = this.readFile(input_file,input_format,options)
		if(Array.isArray(read_result)) {
			const result = []
			for(var row of read_result) {
				result.push(await row.create())
			}
			return result
		} else if(typeof read_result.create === 'function') {
			return read_result.create()
		} else {
			throw(new Error("Missing create() method for this class"))
		}
	}
	/**
	 * Reads list of tuples from yml or json or csv. IF csv, the header must contain the field names. Tuples must include all primary keys and at least one non-primary key field. If the primary keys match a database record, it is updated. Else the tuple is skipped (For record insertion use .createFromFile) 
	 * @param {string} input_file 
	 * @param {string} input_format 
	 * @param {*} options 
	 */
	static async updateFromFile(input_file: fs.PathOrFileDescriptor,input_format : string="yml",options : {property_name?: string}={}) {
		var parsed_content
		if(input_format=="csv") {
			var content = fs.readFileSync(input_file,'utf-8')
			parsed_content = parse(content,{output: "objects"})
		} else {
			var content = fs.readFileSync(input_file,'utf-8')
			parsed_content = YAML.parse(content)
			if(options.property_name) {
				if(!parsed_content[options.property_name]) {
					throw(new Error("property " + options.property_name + " not found in file " + input_file))
				}
				parsed_content = parsed_content[options.property_name]
			}
			if(!Array.isArray(parsed_content)) {
				throw(new Error("file content must be an array"))
			}	
		}
		return this.update(parsed_content)
	}
	constructor(fields={}) {
        const empty_fields : any = {}
		for(var key of Object.keys((this.constructor as typeof baseModel)._fields)) {
			empty_fields[key] = undefined
		}
        this.set(empty_fields)
		this.set(fields)
	}
	static sanitizeValue(
		value: string | number | any[] | Date | IntervalDict | null,
		definition : {
        	class?: any;type?: any, items?: any 
		}={}) 
		{
		if(value == null) {
			return value	
		} else {
			if(definition.type) {
				if(definition.type instanceof Function) {
					// prueba si es construible
					try {
						var obj_value = new definition.type(value)
						return obj_value
					} catch(e) {
						console.warn("type is not constructable, trying call")
						return definition.type(value)
					}
				} else if(definition.type == "string") {
					return value.toString()
				} else if (definition.type == "integer") {
					if(parseInt(value.toString()).toString() == "NaN") {
						throw(new Error("integer field sanitization error: value: '"+ value + "' can't be parsed as integer"))
					}
					return parseInt(value.toString())
				} else if (definition.type == "numeric" || definition.type == "real" || definition.type == "number"  || definition.type == "float") {
					if(parseFloat(value.toString()).toString() == "NaN") {
						throw(new Error("integer field sanitization error: value: '"+ value + "' can't be parsed as float"))
					}
					return parseFloat(value.toString())
				} else if (definition.type == "interval") {
					return createInterval(value)
				} else if (definition.type == "object") {
					if(typeof value == "string" && value.length) {
						try {
							return JSON.parse(value)
						} catch(e) {
                            if(e instanceof Error) {
    							throw(new Error("json field sanitization error: string: '"+ value + "'. Error: " + e.toString()) )
                            } else {
                                console.error("Unknown error:", e);                                
                                throw new Error("Unknown error")
                            }
						}
					} else {
						return new Object(value)
					}
				} else if (definition.type == "geometry") {
					var obj
					if(typeof value == "string" && value.length) {
						try {
							obj = JSON.parse(value)
						} catch(e) {
                            if(e instanceof Error) {
    							throw(new Error("json field sanitization error: string: '"+ value + "'. Error: " + e.toString()) )
                            } else {
                                console.error("Unknown error:", e);
                                throw new Error("Unknown error")
                            }
						}
					} else {
						obj = value
					}
					return new Geometry(obj)
					
				} else if (definition.type == "timestamp") {
					return new Date(value.toString())
				} else if (definition.type == "array") {
					if(isIterable(value) && typeof value !== "string") {
						if(definition.items) {
							return value.map((item: any) : any => {
								return this.sanitizeValue(item,definition.items)
							})
						} else {
							return value.map((item: any)=>item)
						}
					} else {
						throw("Invalid value, not iterable")
					}
				} else {
					return value
				}
			} else if (definition.class) {
				if(value instanceof definition.class) {
					// console.log("Value is instance of class, returning as is")
					return value
				} else if (typeof value == "string") {
					// console.log("value is string, parsing")
					try {
						var parsed = JSON.parse(value)
					} catch(e) {
                        if(e instanceof Error) {
    						throw(new Error("json field sanitization error: string: '"+ value + "'. Error: " + e.toString() ))
                        } else {
                            console.error("Unknown error", e)
                            throw(new Error("Unknown error"))
                        }
					}
					return new definition.class(parsed)
				} else {
					// console.log("value is else, instantiating class")
					return new definition.class(value)
				}
			} else {
				// console.log("else, returning value as is")
				return value
			}
		}
	}

	static getForeignKeyFields() {
		const foreign_keys : any = {}
		for(var key in this._fields) {
			if(this._fields[key]!.foreign_key) {
				foreign_keys[key] = this._fields[key]
			}
		}
		return foreign_keys
	}

	static getPrimaryKeyFields() {
		const primary_key_fields : any = {}
		for(var key in this._fields) {
			if(this._fields[key]!.primary_key) {
				primary_key_fields[key] = this._fields[key]
			}
		}
		return primary_key_fields
	}

	getPrimaryKeyValues() {
		const primary_key_fields = (this.constructor as typeof baseModel).getPrimaryKeyFields()
		const primary_key_values : any = {}
		for(var key in primary_key_fields) {
			primary_key_values[key] = (this as any)[key]
		}
		return primary_key_values
	}

	async setParents() {
		const foreign_key_fields = (this.constructor as typeof baseModel).getForeignKeyFields()
		for(var key in foreign_key_fields) {
            const k = key as keyof baseModel
			const parent = await foreign_key_fields[key].class.read((this[k] as any).getPrimaryKeyValues())
			if(!parent.length) {
				console.error("Couldn't find parent row in table " + foreign_key_fields[key].class._table_name)
				continue
			}
			(this as any)[k] = parent[0]
		}
	}

	getParentFields(field: { foreign_key: { [x: string]: string | number; }; column: string; }, key_value_pairs: { [x: string]: any; }) {
		const parent_fields : any = {}
		for(var fk in field.foreign_key) {
            const fkey = fk as keyof baseModel
            const parent_key = field.foreign_key[fk]!
			if(key_value_pairs && fk == field.column) {
				parent_fields[parent_key] = key_value_pairs[fk]
			} else {
				parent_fields[parent_key] = (key_value_pairs && key_value_pairs[fk]) ? key_value_pairs[fk] : this[fkey]
			}
		}
		return parent_fields
	}

    setOne<K extends Extract<keyof this,string>>(prop: K, value: Coercible<this[K]>) {
    // setOne<K extends keyof this>(prop: K, value: this[K]) {
        (this as any)[prop] = value;
    }
	set<T extends this>(
		key_value_pairs : Partial<{ [K in keyof T]: Coercible<T[K]>}>={}) {
	// }
	// set<K extends keyof this>(key_value_pairs : Partial<Pick<this,K>>={}) {
		const foreign_key_fields : any = (this.constructor as typeof baseModel).getForeignKeyFields()
		const foreign_key_columns = Object.keys(foreign_key_fields).map(k=>foreign_key_fields[k].column)
		for(const key in key_value_pairs) {
            if (key_value_pairs[key] !== undefined) {
                // console.log("KEY:" + key)
                if(Object.keys((this.constructor as typeof baseModel)._fields).indexOf(key) < 0) {
                    if(foreign_key_columns.indexOf(key) < 0) {
                        // console.log(key_value_pairs)
                        throw(new Error("Invalid field key: " + key + ". table name: " + (this.constructor as typeof baseModel)._table_name))
                    }
                    for(const k in foreign_key_fields) {
                        if(foreign_key_fields[k].column == key) {
                            // this.setOne(key, new foreign_key_fields[k].class(fk_fields))
							(this as any)[key] = new foreign_key_fields[k].class(this.getParentFields(foreign_key_fields[k],key_value_pairs))
                            break
                        }
                    }
                } else {
                    try { 
                        (this as any)[key] = (this.constructor as typeof baseModel).sanitizeValue(key_value_pairs[key],(this.constructor as typeof baseModel)._fields[key])
                    } catch(e) {
                        throw(new Error("Can't set property '" + key + "'. " + (e as string).toString()))
                    }
                }
            }
		}
	}
	/**
	 * 
	 * @param {object[]} data - list of instances of this class (or objects parseable into it) 
	 * @param {*} options
	 * @param {boolean} options.header - include csv header 
	 * @param {string[]} options.columns - print only this columns
	 * @returns 
	 */
	static toCSV(data: any,options:{header?: boolean, columns?:any}={}) {
		const rows = []
		if(options.header) {
            rows.push(this.getCSVHeader(options.columns))
        }
		for(var row of data) {
			if(!row as any instanceof this) {
				row = new this(row)
			}
			for(const key of Object.keys(this._fields).filter(key=>(options.columns) ? options.columns.indexOf(key) >= 0 : true)) {
				if(this._fields[key]!.type && (this._fields[key]!.type == "timestamp" || this._fields[key]!.type == "date")) {
					rows.push((row[key]) ? row[key].toISOString() : "")
				} else {
					rows.push(row[key])
				}
			}
		}
		return stringify(rows).replace(/\r\n$/,"")
	}
	/**
	 * 
	 * @param {object} options - options
	 * @param {boolean} options.header - add header line with column names 
	 * @param {string[]} options.columns - print only this columns
	 * @returns {string} csv encoded string
	 */
	toCSV(options: { header?: boolean; columns?: string[]; }={}): string {
		const rows = []
		if(options.header && options.columns) {
            rows.push((this.constructor as typeof baseModel).getCSVHeader(options.columns))
        }
		const row = [] 
		for(const key of Object.keys((this.constructor as typeof baseModel)._fields).filter(key=>(options.columns) ? options.columns.indexOf(key) >= 0 : true)) {
			if(key in this) {
				const k = key as keyof this
				const value = this.getOne(k)
				if(value instanceof Date) {
					row.push(value.toISOString() as string)
				} else {
					row.push(value as string)
				}
			} else {
				throw new Error("_fields property " + key + " not defined in class")
			}
		}
		rows.push(row)
		return stringify(rows).replace(/\r\n$/,"")
	}
	getOne<K extends keyof this>(key: K) : this[K] {
		return this[key]
	}
	/**
	 * 
	 * @returns {string[]} column names
	 */
	static getCSVHeader(columns: string | string[]) {
		if(!this._fields) {
			return [] // ""
		}
		if(columns) {
			return Object.keys(this._fields).filter(key=>columns.indexOf(key)>=0)	
		}
		return Object.keys(this._fields) // CSV.stringify(Object.keys(this._fields)).replace(/\r\n$/,"")
	}
	/**
	 * 
	 * @param {string} row_csv_string - delimited string
	 * @param {string[]} [columns] - ordered field names to assign to parsed csv line 
	 * @returns {object} an instance of this class
	 */
	static fromCSV(row_csv_string: string,separator : string=",", columns: string[]) {
		if(!this._fields) {
			throw("Missing constructor._fields for class " + this.name)
		}
		const columns_arr = (columns) ? columns : Object.keys(this._fields)
		const rows = parse(row_csv_string, separator as Comma)
        if(!rows.length) {
            throw new Error("No content found in CSV file")
        }
        const row = rows[0]!.map(c=> (!c.length) ? undefined : c)
		const result : any = {}
        var i = 0
		for(const k of columns_arr) {
			if(Object.keys(this._fields).indexOf(k) < 0) {
				console.error("Bad column name: " + k + ", skipping")
				continue
			}
			result[k] = row[i]
            i = i + 1
		}
		return new this(result)
	}

	build_insert_statement() : {
		string: string;
		params: any[];
	}{
		if(!(this.constructor as typeof baseModel)._table_name) {
			throw("Missing constructor._table_name")
		}
		var columns = [] 
		var values = []
		var on_conflict_columns = []
		var on_conflict_action = []
		var params = []
		var index=0
		for(var key in (this.constructor as typeof baseModel)._fields) {
			if(key in this) {
				const  k = key as keyof this
				index = index + 1
				columns.push(`"${key}"`)
				values.push(((this.constructor as typeof baseModel)._fields[key]!.type && (this.constructor as typeof baseModel)._fields[key]!.type == "geometry") ? `ST_GeomFromGeoJSON($${index})` : `$${index}`)
				if((this.constructor as typeof baseModel)._fields[key]!.primary_key) {
					on_conflict_columns.push(`"${key}"`)
				} else {
					on_conflict_action.push(`"${key}"=COALESCE(excluded."${key}","${(this.constructor as typeof baseModel)._table_name}"."${key}")`)
				}
				if ((this.constructor as typeof baseModel)._fields[key]!.type) {
					if(["geometry","object"].indexOf((this.constructor as typeof baseModel)._fields[key]!.type) >= 0) {
						params.push(JSON.stringify(this[k]))
					} else if (["interval"].indexOf((this.constructor as typeof baseModel)._fields[key]!.type) >= 0) {
						params.push(interval2string(this[k] as {[x : string] : number } | string))
					} else {
						params.push(this[k])
					}
				} else if((this.constructor as typeof baseModel)._fields[key]!.class) {
					params.push(JSON.stringify(this[k]))
				} else {
					params.push(this[k])
				}
			} else {
				throw new Error("_fields property " + key + " not defined in class")
			}
		}
		var on_conflict_clause = (on_conflict_columns.length) ? (on_conflict_action) ? `ON CONFLICT (${on_conflict_columns.join(",")}) DO UPDATE SET ${on_conflict_action.join(",")}` : `ON CONFLICT (${on_conflict_columns.join(",")}) DO NOTHING` : `ON CONFLICT DO NOTHING`
		return {
			string: `INSERT INTO "${(this.constructor as typeof baseModel)._table_name}" (${columns.join(",")}) VALUES (${values.join(",")}) ${on_conflict_clause} RETURNING ${columns.join(",")}`,
			params: params
		}
	}
	static getColumns(add_table_name=false) {
		return Object.keys(this._fields).map(key=>{
			if(this._fields[key]!.child) {
				return
			} else {
				var table_name = (add_table_name) ? (this._fields[key]!.table) ? this._fields[key]!.table : this._table_name : undefined 
				table_name = (table_name) ? `"${table_name}".` : ""
				if(this._fields[key]!.column) {
					return `${table_name}"${this._fields[key]!.column}"`
				} else if(this._fields[key]!.type && this._fields[key]!.type == "geometry") {
					return `ST_AsGeoJSON(${table_name}"${key}") AS "${key}"`
				} else {
					return `${table_name}"${key}"`
				}
			}
		}).filter(c=>c)
	}
	checkPK() {
		for(var key of Object.keys((this.constructor as typeof baseModel)._fields).filter(key=>(this.constructor as typeof baseModel)._fields[key]!.primary_key)) {
			const k = key as keyof this
			if(this[k] == null) {
				throw(new Error("Missing primary key field " + key + ". Insert attempt on table " + (this.constructor as typeof baseModel)._table_name))
			}
		} 
	}
	async create() {
		this.checkPK()
		const statement = this.build_insert_statement()
		// console.log(statement.string)
		// console.log(statement.params)
		const result = await this.pool.query(statement.string,statement.params)
		if(!result.rows.length) {
			throw("nothing inserted")
		}
		this.set(result.rows[0])
		return this
	}
	static build_read_statement(filter={}) {
		const columns = this.getColumns()
		// const joins = this.getJoins(filter)
		const filters = control_filter2({...this._fields,...this._additional_filters},filter)
		const query_string = `SELECT ${columns.join(",")} FROM "${this._table_name}" WHERE 1=1 ${filters}`
		return query_string
	}
	/**
	 * 
	 * @param {Object} filter 
	 * @param {Object} options
	 * @returns 
	 */
	static async read(
		filter: object={},
		options: any={}
	) {
		var statement = this.build_read_statement(filter)
		const result = await this.pool.query(statement)
		return result.rows.map((r: {} | undefined)=>new this(r))
	}

	build_update_query<T = Partial<this>>(update_keys : (keyof T)[]=[]) : {
		string: string;
		params: T[keyof T][];
	} | undefined{
		if(!(this.constructor as typeof baseModel)._table_name) {
			throw("Missing constructor._table_name. Can't build update query")
		}
		const primary_keys = []
		const valid_update_fields : {[x : string] : ModelField} = {}
		for(var key of Object.keys((this.constructor as typeof baseModel)._fields)) {
			if((this.constructor as typeof baseModel)._fields[key]!.primary_key) {
				primary_keys.push(key)
			} else {
				valid_update_fields[key] = (this.constructor as typeof baseModel)._fields[key] as ModelField
			}
		}
		const filters = primary_keys.map((key,i)=>`"${key}"=$${i+1}`)
		const params : (string | this[keyof this])[] = [...primary_keys.map(key=>{
			if(key in this) {
				return this[key as keyof this]
			} else {
				throw("Key " + key + " not defined in class")
			}
		})]
		var update_clause = []
		for(var key of Object.keys(valid_update_fields)) {
			const k = key as keyof T
			if(!(k in this)) {
				throw new Error("Property key " + key + " not defined in class")
			}
			if(update_keys.indexOf(k) < 0 || typeof this[k as keyof this] == 'undefined') {
				// if value is null it will update to NULL, if undefined it will not update
				continue
			} else if (this[k as keyof this] == null) {
				params.push(this[k as keyof this])
				update_clause.push(`"${key}"=$${params.length}`)
			} else if (valid_update_fields[key]!.class) {
				const parentclass = valid_update_fields[key]!.class
				const classfield = valid_update_fields[key]! as ClassModelField
				if(!("column" in classfield)) {
					throw new Error("Missing column in field key " + key)
				}
				const parentfield = this[k as  keyof this] as typeof parentclass 
				const foreignfieldkey = classfield.foreign_key[classfield.column] as keyof (typeof parentclass) 
				if(!parentfield) {
					throw new Error("Parent field " + key + " is undefined")
				}
				params.push(parentfield[foreignfieldkey])
				update_clause.push(`"${classfield.column}"=$${params.length}`)			
			} else if(valid_update_fields[key]!.type.toLowerCase() == "string") {
				const rawValue = this[key as keyof this]
				if(typeof rawValue !== "string" ) {
					throw new Error("Value of key " + key + " must be string")
				}
				const value = rawValue as string
				params.push(value.toString())
				update_clause.push(`"${key}"=$${params.length}`) 
			} else if(valid_update_fields[key]!.type.toLowerCase() == "geometry") {
				params.push(JSON.stringify(this[key as keyof this]))
				update_clause.push(`"${key}"=ST_GeomFromGeoJSON($${params.length})`)
			} else if(["timestamp","timestamptz","date"].indexOf(valid_update_fields[key]!.type.toLowerCase()) >= 0) {
				const value = this[key as keyof this] as Date
				if(!(value instanceof Date)) {
					throw new Error("Date expected for key " + key)
				}
				params.push(value.toISOString())
				update_clause.push(`"${key}"=$${params.length}::timestamptz`)
			} else if(["json","jsonb"].indexOf(valid_update_fields[key]!.type.toLowerCase()) >= 0) {
				params.push(JSON.stringify(this[key as keyof this]))
				update_clause.push(`"${key}"=$${params.length}`)
			} else {
				params.push(this[key as keyof this])
				update_clause.push(`"${key}"=$${params.length}`)
			}
		}
		if(!update_clause.length) {
			console.error("Nothing set to update")
			return
		}
		const returning = (this.constructor as typeof baseModel).getColumns()
		return {
			string: `UPDATE "${(this.constructor as typeof baseModel)._table_name}" SET ${update_clause.join(", ")} WHERE ${filters.join(" AND ")} RETURNING ${returning.join(",")}`,
			params: params as T[keyof T][]
		}
	}

	/**
	 * Updates each row matching given primary keys with given non-primary key field values
	 * @param {object[]} updates - List of tuples. Each tuple must contain table primary key values and at least one non-primary key field with a new value
	 */
	static async update(this : typeof baseModel, updates : {[x: string] : any}[]=[]) {
		if(!this._fields) {
			throw(new Error("Can't use update method on this class: constructor._fields not defined"))
		}
		const primary_key_fields = Object.keys(this._fields).filter(key=>this._fields[key]!.primary_key)
		if(!primary_key_fields.length) {
			throw(new Error("Can't use update method on this class: missing primary key fields on constructor._fields"))
		}
		const result = []
		tuple_loop:
		for(var update_tuple of updates) {
			const read_filter : any = {}
			const changes : any = {}
			for(var key of Object.keys(this._fields)) { 
				if(primary_key_fields.indexOf(key) >= 0) {
					if(!update_tuple[key]) {
						console.error("Missing primary key " + key + ". Skipping")
						continue tuple_loop
					}
					read_filter[key] = update_tuple[key]
				} else {
					if(typeof update_tuple[key] != 'undefined') {
						changes[key] = update_tuple[key]
					}
				}
			}
			if(!Object.keys(changes).length) {
				console.error("Nothing set to change")
				continue tuple_loop
			}
			const read_result = await this.read(read_filter)
			if(!read_result.length) {
				console.error("No rows matched for update. Consider using .create")
				continue tuple_loop
			}
			if(!read_result.length) {
				throw new Error("No rows to update")
			}
			result.push(await read_result[0]!.update(changes))			
		}
		return result
	}

	async update(changes={}) {
		this.set(changes)
		const statement = this.build_update_query(Object.keys(changes))
		if(!statement) {
			// console.error("Nothing set to update")
			return this
		}
		try {
			var result = await this.pool.query(statement.string,statement.params)
		} catch(e) {
			throw(e)
		}
		if(!result.rows.length) {
			console.error("Nothing updated")
		}
		this.set(result.rows[0])
		await this.setParents()
		return this// new this.constructor(result.rows[0])
	}

	static async delete(filter={}) {
		if(!this._table_name) {
			throw("Missing constructor._table_name. Can't build update query")
		}
		var filter_string = control_filter2(this._fields,filter)
		if(filter_string || (filter_string && !filter_string.length)) {
			throw new Error("At least one filter required for delete action")
		}
		const returning = this.getColumns()
		var result = await this.pool.query(`DELETE FROM "${this._table_name}" WHERE 1=1 ${filter_string} RETURNING ${returning.join(",")}`)
		return result.rows.map((r: {} | undefined)=>new this(r))
	}

	partial(columns : (keyof this)[] = []) {
		const partial : Partial<this> = {} // new internal.baseModel()
		for(const key of columns) {
			partial[key] = this[key]
		}
		const ctor = this.constructor as { new (init?: Partial<baseModel>): baseModel };
		return new ctor(partial)
	}

	static _table_name : string
	static _fields : { [x : string]: ModelField }= {}
	static _additional_filters = {}

	get pool(): Pool {
		if(!baseModel._pool) {
			throw new Error("Database connection not established")
		}
		return baseModel._pool
	}

	static get pool(): Pool {
		if(!this._pool) {
			throw new Error("Database connection not established")
		}
		return this._pool
	}

	async interval2epoch(interval : IntervalDict | string | undefined) {
		if(interval instanceof Object) {
			interval = interval2string(interval)
		}
		if(!interval) {
			return 0
		} 
		return this.pool.query("SELECT extract(epoch from $1::interval) AS epoch",[interval.toString()])
		.then(result=>{
			return result.rows[0].epoch
		})
	}

	/**
	 * execute pg query
	 * @param {string} query_string 
	 * @param {Array|undefined} query_args 
	 * @param {Client|undefined} client 
	 * @param {Boolean} [release_client=false] - if true, when the query fails it releases the provided client before throwing error
	 * @returns {Promise<Object[]>} promise to an array representing the query result rows
	 */
	static async executeQueryReturnRows(
		query_string : string,
		query_args? : any[],
		client? : PoolClient,
		release_client? : boolean) : Promise<{[x : string]: any}[]>{
		if(!query_string) {
			throw new Error("missing query string")
		}
		if(client)  {
			if(query_args) {
				try {
					var result = await client.query(query_string,query_args)
				} catch(e) {
					if(release_client) {
						client.query("ROLLBACK")
						client.release()
					}
					throw(e)
				}
			} else {
				try {
					var result = await client.query(query_string)
				} catch(e) {
					if(release_client) {
						client.query("ROLLBACK")
						client.release()
					}
					throw(e)
				}
			}
			// if(release_client) {
			// 	client.release()
			// }
		} else {
			if(query_args) {
				var result = await this.pool.query(query_string,query_args)
			} else {
				var result = await this.pool.query(query_string)
			}
		}
		return result.rows
	}


}

export class BaseArray<Type> extends Array {
	async create() : Promise<Type[]> {
		const created : Type[] = []
		for(const item of this) {
			created.push(await item.create()) 
		}
		return created
	}
	async writeFile(output_file: any,output_format: any) {
		return writeModelToFile({ valor: this},output_file,output_format)
    }
	static readFile(input_file: any,input_format: any,options: any) {
		return readModelFromFile(BaseArray,input_file,input_format,options)
	}

}
