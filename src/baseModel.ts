'use strict'

import fs from 'promise-fs';
import YAML from 'yaml';
import CSV from 'csv-string';
import {isIterable, delay} from './utils';
import { Interval } from './timeSteps';
import Geometry from './geometry';
import { Comma } from 'csv-string/dist/types';

type KeyValueTuple = [key: string, value: unknown];

type AnyClass = {
    toCSV?(): string
    valor?: string | Uint8Array | Buffer | number | number[]
    prototype?: string | string[]
    create(): Promise<AnyClass>
};

interface ModelField {
    foreign_key?: boolean
    type: "string" | "object" | "number" | "boolean" | "geometry" | "integer"
    table?: string
    column?: string
    primary_key?: boolean
}

export async function writeModelToFile(model: AnyClass, output_file : string, output_format : string) {
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

export function readModelFromFile(model_class : AnyModel,input_file : string,input_format : string, options : ReadFileOptions = {}) {
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

export default class baseModel {
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
			parsed_content = CSV.parse(content,{output: "objects"})
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
	static sanitizeValue(value: string | number | any[] | Date | null,definition : {
        class?: any;type?: any, items?: any }={}) {
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
					return new Interval(value.toString())
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
			this.setOne(k,  parent[0])
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

    setOne<K extends keyof this>(prop: K, value: this[K]) {
        this[prop] = value;
    }

	set<K extends keyof this>(key_value_pairs : Partial<Pick<this,K>>={}) {
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
                            const fk_fields = this.getParentFields(foreign_key_fields[k],key_value_pairs)
                            this.setOne(key, new foreign_key_fields[k].class(fk_fields))
                            break
                        }
                    }
                } else {
                    try { 
                        this.setOne(key, (this.constructor as typeof baseModel).sanitizeValue(key_value_pairs[key] as string | number | any[] | Date | null,(this.constructor as typeof baseModel)._fields[key]))
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
			rows.push(Object.keys(this._fields).filter(key=>(options.columns) ? options.columns.indexOf(key) >= 0 : true).map(key=>{
				if(this._fields[key].type && (this._fields[key].type == "timestamp" || this._fields[key].type == "date")) {
					return (row[key]) ? row[key].toISOString() : ""
				} else {
					return row[key]
				}
			}))
		}
		return CSV.stringify(rows).replace(/\r\n$/,"")
	}
	/**
	 * 
	 * @param {object} options - options
	 * @param {boolean} options.header - add header line with column names 
	 * @param {string[]} options.columns - print only this columns
	 * @returns {string} csv encoded string
	 */
	toCSV(options={}) {
		const rows = []
		if(options.header) {
            rows.push((this.constructor as typeof baseModel).getCSVHeader(options.columns))
        } 
		rows.push(Object.keys((this.constructor as typeof baseModel)._fields).filter(key=>(options.columns) ? options.columns.indexOf(key) >= 0 : true).map(key=>{
			if((this.constructor as typeof baseModel)._fields[key].type && ((this.constructor as typeof baseModel)._fields[key].type == "timestamp" || (this.constructor as typeof baseModel)._fields[key].type == "date")) {
				return this[key].toISOString()
			} else {
				return this[key]
			}
		}))
		return CSV.stringify(rows).replace(/\r\n$/,"")
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
		const rows = CSV.parse(row_csv_string, separator as Comma)
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

	build_insert_statement() {
		if(!(this.constructor as typeof baseModel)._table_name) {
			throw("Missing constructor._table_name")
		}
		var columns = [] 
		var values = []
		var on_conflict_columns = []
		var on_conflict_action = []
		var params = []
		var index=0
		for(var key of Object.keys((this.constructor as typeof baseModel)._fields)) {
			index = index + 1
			columns.push(`"${key}"`)
			values.push(((this.constructor as typeof baseModel)._fields[key].type && (this.constructor as typeof baseModel)._fields[key].type == "geometry") ? `ST_GeomFromGeoJSON($${index})` : `$${index}`)
			if((this.constructor as typeof baseModel)._fields[key].primary_key) {
				on_conflict_columns.push(`"${key}"`)
			} else {
				on_conflict_action.push(`"${key}"=COALESCE(excluded."${key}","${(this.constructor as typeof baseModel)._table_name}"."${key}")`)
			}
			if ((this.constructor as typeof baseModel)._fields[key].type) {
				if(["geometry","object"].indexOf((this.constructor as typeof baseModel)._fields[key].type) >= 0) {
					params.push(JSON.stringify(this[key]))
				} else if (["interval"].indexOf((this.constructor as typeof baseModel)._fields[key].type) >= 0) {
					params.push(interval2string(this[key]))
				} else {
					params.push(this[key])
				}
			} else if((this.constructor as typeof baseModel)._fields[key].class) {
				params.push(JSON.stringify(this[key]))
			} else {
				params.push(this[key])
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
			if(this._fields[key].child) {
				return
			} else {
				var table_name = (add_table_name) ? (this._fields[key].table) ? this._fields[key].table : this._table_name : undefined 
				table_name = (table_name) ? `"${table_name}".` : ""
				if(this._fields[key].column) {
					return `${table_name}"${this._fields[key].column}"`
				} else if(this._fields[key].type && this._fields[key].type == "geometry") {
					return `ST_AsGeoJSON(${table_name}"${key}") AS "${key}"`
				} else {
					return `${table_name}"${key}"`
				}
			}
		}).filter(c=>c)
	}
	checkPK() {
		for(var key of Object.keys((this.constructor as typeof baseModel)._fields).filter(key=>(this.constructor as typeof baseModel)._fields[key].primary_key)) {
			if(this[key] == null) {
				throw(new Error("Missing primary key field " + key + ". Insert attempt on table " + (this.constructor as typeof baseModel)._table_name))
			}
		} 
	}
	async create() {
		this.checkPK()
		const statement = this.build_insert_statement()
		// console.log(statement.string)
		// console.log(statement.params)
		const result = await global.pool.query(statement.string,statement.params)
		if(!result.rows.length) {
			throw("nothing inserted")
		}
		this.set(result.rows[0])
		return this
	}
	static build_read_statement(filter={}) {
		const columns = this.getColumns()
		// const joins = this.getJoins(filter)
		const filters = utils.control_filter2({...this._fields,...this._additional_filters},filter)
		const query_string = `SELECT ${columns.join(",")} FROM "${this._table_name}" WHERE 1=1 ${filters}`
		return query_string
	}
	/**
	 * 
	 * @param {Object} filter 
	 * @param {Object} options
	 * @param {boolean} options.mapped_only
	 * @returns 
	 */
	static async read(filter={},options={}) {
		var statement = this.build_read_statement(filter,options.mapped_only)
		const result = await global.pool.query(statement)
		return result.rows.map((r: {} | undefined)=>new this(r))
	}
	build_update_query(update_keys=[]) {
		if(!(this.constructor as typeof baseModel)._table_name) {
			throw("Missing constructor._table_name. Can't build update query")
		}
		const primary_keys = []
		const valid_update_fields = {}
		for(var key of Object.keys((this.constructor as typeof baseModel)._fields)) {
			if((this.constructor as typeof baseModel)._fields[key].primary_key) {
				primary_keys.push(key)
			} else {
				valid_update_fields[key] = (this.constructor as typeof baseModel)._fields[key]
			}
		}
		const filters = primary_keys.map((key,i)=>`"${key}"=$${i+1}`)
		const params = [...primary_keys.map(key=>this[key])]
		var update_clause = []
		for(var key of Object.keys(valid_update_fields)) {
			if(!update_keys.indexOf(key) < 0 || typeof this[key] == 'undefined') {
				// if value is null it will update to NULL, if undefined it will not update
				continue
			} else if (this[key] == null) {
				params.push(this[key])
				update_clause.push(`"${key}"=$${params.length}`)
			} else if (valid_update_fields[key].class) {
				params.push(this[key][valid_update_fields[key].foreign_key[valid_update_fields[key].column]])
				update_clause.push(`"${valid_update_fields[key].column}"=$${params.length}`)			
			} else if(valid_update_fields[key].type.toLowerCase() == "string") {
				params.push(this[key].toString())
				update_clause.push(`"${key}"=$${params.length}`) 
			} else if(valid_update_fields[key].type.toLowerCase() == "geometry") {
				params.push(JSON.stringify(this[key]))
				update_clause.push(`"${key}"=ST_GeomFromGeoJSON($${params.length})`)
			} else if(["timestamp","timestamptz","date"].indexOf(valid_update_fields[key].type.toLowerCase()) >= 0) {
				params.push(this[key].toISOString())
				update_clause.push(`"${key}"=$${params.length}::timestamptz`)
			} else if(["json","jsonb"].indexOf(valid_update_fields[key].type.toLowerCase()) >= 0) {
				params.push(JSON.stringify(this[key]))
				update_clause.push(`"${key}"=$${params.length}`)
			} else {
				params.push(this[key])
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
			params: params
		}
	}

	/**
	 * Updates each row matching given primary keys with given non-primary key field values
	 * @param {object[]} updates - List of tuples. Each tuple must contain table primary key values and at least one non-primary key field with a new value
	 */
	static async update(updates : KeyValueTuple[]=[]) {
		if(!this._fields) {
			throw(new Error("Can't use update method on this class: constructor._fields not defined"))
		}
		const primary_key_fields = Object.keys(this._fields).filter(key=>this._fields[key].primary_key)
		if(!primary_key_fields.length) {
			throw(new Error("Can't use update method on this class: missing primary key fields on constructor._fields"))
		}
		const result = []
		tuple_loop:
		for(var update_tuple of updates) {
			const read_filter = {}
			const changes = {}
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
			result.push(await read_result[0].update(changes))			
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
			var result = await global.pool.query(statement.string,statement.params)
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
		var filter_string = utils.control_filter2(this._fields,filter)
		if(!filter_string.length) {
			throw("At least one filter required for delete action")
		}
		const returning = this.getColumns()
		var result = await global.pool.query(`DELETE FROM "${this._table_name}" WHERE 1=1 ${filter_string} RETURNING ${returning.join(",")}`)
		return result.rows.map((r: {} | undefined)=>new this(r))
	}

	partial(columns=[]) {
		const partial = {} // new internal.baseModel()
		for(var key of columns) {
			partial[key] = this[key]
		}
		return new this.constructor(partial)
	}

	static _table_name = undefined
	static _fields : { [x : string]: ModelField }= {}
	static _additional_filters = {}
}

internal.BaseArray = class extends Array {
	async writeFile(output_file: any,output_format: any) {
		return internal.writeModelToFile(this,output_file,output_format)
    }
	static readFile(input_file: any,input_format: any,property_name: any,options: any) {
		return internal.readModelFromFile(this,input_file,input_format,property_name,options)
	}
}


module.exports = internal