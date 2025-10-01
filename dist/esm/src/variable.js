import { baseModel } from './baseModel';
import { interval2string } from './timeSteps';
import { control_filter2, pasteIntoSQLQuery } from './utils';
class Variable extends baseModel {
    constructor(args) {
        super(args);
    }
    async getId() {
        var result = await this.pool.query("\
			SELECT id FROM var WHERE var=$1 AND \"GeneralCategory\"=$2\
		", [this["var"], this.GeneralCategory]);
        if (result.rows.length) {
            if (this.id) {
                if (result.rows[0].id == this.id) {
                    return;
                }
                else {
                    throw ("var already exists with different id");
                }
            }
            else {
                this.id = result.rows[0].id;
            }
        }
        else {
            if (this.id) {
                return;
            }
            else {
                const new_id = await this.pool.query("\
				SELECT max(id)+1 AS id\
				FROM var\
				");
                this.id = new_id.rows[0].id;
            }
        }
    }
    toString() {
        return "{id:" + this.id + ",var:" + this["var"] + ", nombre:" + this.nombre + ",abrev:" + this.abrev + ",type:" + this.type + ",datatype: " + this.datatype + ",valuetype:" + this.valuetype + ",GeneralCategory:" + this.GeneralCategory + ",VariableName:" + this.VariableName + ",SampleMedium:" + this.SampleMedium + ",def_unit_id:" + this.def_unit_id + ",timeSupport:" + JSON.stringify(this.timeSupport) + "}";
    }
    toCSV() {
        return this.id + "," + this["var"] + "," + this.nombre + "," + this.abrev + "," + this.type + "," + this.datatype + "," + this.valuetype + "," + this.GeneralCategory + "," + this.VariableName + "," + this.SampleMedium + "," + this.def_unit_id + "," + JSON.stringify(this.timeSupport);
    }
    toCSVless() {
        return this.id + "," + this["var"] + "," + this.nombre;
    }
    toJSON() {
        return {
            "id": this.id,
            "var": this["var"],
            "nombre": this.nombre,
            "abrev": this.abrev,
            "type": this.type,
            "datatype": this.datatype,
            "valuetype": this.valuetype,
            "GeneralCategory": this.GeneralCategory,
            "VariableName": this.VariableName,
            "SampleMedium": this.SampleMedium,
            "def_unit_id": this.def_unit_id,
            "timeSupport": this.timeSupport,
            "def_hora_corte": this.def_hora_corte
        };
    }
    static upsertVarQuery(variable) {
        var query = "\
		INSERT INTO var (id, var,nombre,abrev,type,datatype,valuetype,\"GeneralCategory\",\"VariableName\",\"SampleMedium\",def_unit_id,\"timeSupport\") \
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)\
		ON CONFLICT (var,\"GeneralCategory\") DO UPDATE SET \
			var=excluded.var,\
			nombre=excluded.nombre,\
			abrev=excluded.abrev,\
			type=excluded.type,\
			datatype=excluded.datatype,\
			valuetype=excluded.valuetype,\
			\"GeneralCategory\"=excluded.\"GeneralCategory\",\
			\"VariableName\"=excluded.\"VariableName\",\
			\"SampleMedium\"=excluded.\"SampleMedium\",\
			def_unit_id=excluded.def_unit_id,\
			\"timeSupport\"=excluded.\"timeSupport\"\
		RETURNING id,var,nombre,abrev,type,datatype,valuetype,\"GeneralCategory\",\"VariableName\",\"SampleMedium\",def_unit_id,\"timeSupport\"";
        var params = [variable.id, variable["var"], variable.nombre, variable.abrev, variable.type, variable.datatype, variable.valuetype, variable.GeneralCategory, variable.VariableName, variable.SampleMedium, variable.def_unit_id, interval2string(variable.timeSupport)];
        return pasteIntoSQLQuery(query, params);
    }
    async create() {
        await this.getId();
        const stmt = Variable.upsertVarQuery(this);
        try {
            var result = await this.pool.query(stmt);
        }
        catch (e) {
            throw new Error(e.toString());
        }
        if (result.rows.length <= 0) {
            throw new Error("Upsert failed");
        }
        this.set(result.rows[0]);
        return this;
    }
    static async read(filter = {}, options) {
        if (filter.id && !Array.isArray(filter.id)) {
            const id = filter.id;
            if (id.toString() == "NaN") {
                throw (new Error("Invalid variable id. Must be integer"));
            }
            const rows = await this.executeQueryReturnRows("\
            SELECT id, \
                var,\
                nombre,\
                abrev,\
                type,\
                datatype,\
                valuetype,\
                \"GeneralCategory\",\
                \"VariableName\",\
                \"SampleMedium\",\
                def_unit_id,\
                \"timeSupport\",\
                def_hora_corte\
            FROM var\
            WHERE id=$1", [id]);
            if (rows.length <= 0) {
                console.error("variable no encontrada");
                return [];
            }
            const variable = new this(rows[0]);
            variable.id = rows[0].id;
            return [variable];
        }
        else {
            const valid_filters = {
                id: { type: "numeric" },
                "var": { type: "string" },
                nombre: { type: "regex_string" },
                abrev: { type: "regex_string" },
                type: { type: "string" },
                datatype: { type: "string" },
                valuetype: { type: "string" },
                GeneralCategory: { type: "string" },
                VariableName: { type: "string" },
                SampleMedium: { type: "string" },
                def_unit_id: { type: "numeric" },
                timeSupport: { type: "interval" },
                def_hora_corte: { type: "interval" }
            };
            var filter_string = control_filter2(valid_filters, filter, undefined, true);
            // console.log(filter_string)
            if (!filter_string) {
                return Promise.reject(new Error("invalid filter value"));
            }
            const stmt = "SELECT id, var,nombre,abrev,type,datatype,valuetype,\"GeneralCategory\",\"VariableName\",\"SampleMedium\",def_unit_id,\"timeSupport\"\
            FROM var \
            WHERE 1=1 " + filter_string + " ORDER BY id";
            const res = await this.pool.query(stmt);
            var variables = res.rows.map(row => {
                const variable = new this(row);
                variable.id = row.id;
                return variable;
            });
            return variables;
        }
    }
    async find() {
        if (this.id) {
            var result = await Variable.read({ id: this.id }, {});
            if (result.length) {
                return result[0];
            }
            else {
                console.error("Variable not found");
                return;
            }
        }
        else if (this.VariableName) {
            var result = await Variable.read({
                VariableName: this.VariableName,
                timeSupport: this.timeSupport,
                datatype: this.datatype ?? 'Continuous'
            }, {});
            if (result != null && result.length) {
                return result[0];
            }
            else {
                console.error("Variable not found");
                return;
            }
        }
        else {
            throw new Error("id or VariableName required to find var");
        }
    }
    async update(changes = {}) {
        this.set(changes);
        return this.create();
    }
    static async delete(filter = {}, options = {}) {
        var matches = await this.read(filter, {});
        if (!matches.length) {
            console.log("Nothing to delete");
            return [];
        }
        const deleted = [];
        for (var match of matches) {
            const d = await match.delete();
            if (d) {
                deleted.push(d); // internal.CRUD.deleteVar(matches[i].id))
            }
        }
        return deleted;
    }
    async delete() {
        if (!this.id) {
            console.error("Can't delete this instance since it was not yet created");
            return;
        }
        try {
            var result = await this.pool.query("\
                DELETE FROM var\
                WHERE id=$1\
                RETURNING id, var,nombre,abrev,type,datatype,valuetype,\"GeneralCategory\",\"VariableName\",\"SampleMedium\",def_unit_id,\"timeSupport\"", [this.id]);
            if (result.rows.length <= 0) {
                console.log("id not found");
                return;
            }
            console.log("Deleted var.id=" + result.rows[0].id);
            return new Variable(result.rows[0]);
        }
        catch (e) {
            throw new Error(e.toString());
        }
    }
}
Variable._table_name = "var";
Variable._fields = {
    id: { type: "integer", primary_key: true },
    var: { type: "string" },
    nombre: { type: "string" },
    abrev: { type: "string" },
    type: { type: "string" },
    datatype: { type: "string" },
    valuetype: { type: "string" },
    GeneralCategory: { type: "string" },
    VariableName: { type: "string" },
    SampleMedium: { type: "string" },
    def_unit_id: { type: "string" },
    timeSupport: { type: "interval" },
    def_hora_corte: { type: "interval" }
};
export default Variable;
