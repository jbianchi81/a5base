import { Geometry } from './geometry';
import { createInterval } from './timeSteps';
import { escapeLiteral } from 'pg';
export async function delay(t, val) {
    return new Promise(function (resolve) {
        setTimeout(function () {
            // console.log("waited " + t + " ms")
            resolve(val);
        }, t);
    });
}
export function isIterable(obj) {
    // checks for null and undefined
    if (obj == null) {
        return false;
    }
    return typeof obj[Symbol.iterator] === 'function';
}
class not_null extends Object {
}
function assertValidDateTruncField(field) {
    if ([
        "microseconds",
        "milliseconds",
        "second",
        "minute",
        "hour",
        "day",
        "week",
        "month",
        "quarter",
        "year",
        "decade",
        "century",
        "millennium"
    ].indexOf(field) < 0) {
        throw (new Error("Invalid date_trunc field: " + field));
    }
}
export function control_filter2(valid_filters, filter, default_table, crud, throw_on_error) {
    // valid_filters = { column1: { table: "table_name", type: "data_type", required: bool, column: "column_name"}, ... }  
    // filter = { column1: "value1", column2: "value2", ....}
    // default_table = "table"
    var filter_string = " ";
    var errors = [];
    for (const key in valid_filters) {
        if (Object.prototype.hasOwnProperty.call(valid_filters, key)) {
            const valid_filter = valid_filters[key];
            var table_prefix = (valid_filter.table) ? '"' + valid_filter.table + '".' : (default_table) ? '"' + default_table + '".' : "";
            var column_name = (valid_filter.column) ? '"' + valid_filter.column + '"' : '"' + key + '"';
            var fullkey = table_prefix + column_name;
            if (filter[key] instanceof not_null) {
                filter_string += ` AND ` + fullkey + ` IS NOT NULL `;
            }
            else if (typeof filter[key] != "undefined" && filter[key] !== null) {
                if (/[';]/.test(filter[key])) {
                    errors.push("Invalid filter value");
                    console.error(errors[errors.length - 1]);
                }
                if (valid_filter.type == "regex_string") {
                    var regex = filter[key].replace('\\', '\\\\');
                    filter_string += " AND " + fullkey + " ~* '" + filter[key] + "'";
                }
                else if (valid_filter.type == "string") {
                    if (Array.isArray(filter[key])) {
                        var values = filter[key].filter(v => v != null).map(v => v.toString()).filter(v => v != "");
                        if (!values.length) {
                            errors.push("Empty or invalid string array");
                            console.error(errors[errors.length - 1]);
                        }
                        else {
                            if (valid_filter.case_insensitive) {
                                filter_string += ` AND lower(${fullkey}) IN ( ${values.map(v => `lower('${v}')`).join(",")})`;
                            }
                            else {
                                filter_string += ` AND ${fullkey} IN ( ${values.map(v => `'${v}'`).join(",")})`;
                            }
                        }
                    }
                    else {
                        if (valid_filter.case_insensitive) {
                            filter_string += ` AND lower(${fullkey})=lower('${filter[key]}')`;
                        }
                        else {
                            filter_string += " AND " + fullkey + "='" + filter[key] + "'";
                        }
                    }
                }
                else if (valid_filter.type == "boolean") {
                    var boolean = (/^[yYtTvVsS1]/.test(filter[key])) ? "true" : "false";
                    filter_string += " AND " + fullkey + "=" + boolean + "";
                }
                else if (valid_filter.type == "boolean_only_true") {
                    if (/^[yYtTvVsS1]/.test(filter[key])) {
                        filter_string += " AND " + fullkey + "=true";
                    }
                }
                else if (valid_filter.type == "boolean_only_false") {
                    if (!/^[yYtTvVsS1]/.test(filter[key])) {
                        filter_string += " AND " + fullkey + "=false";
                    }
                }
                else if (valid_filter.type == "geometry") {
                    if (filter[key] instanceof Geometry) {
                        const geom = filter[key];
                        filter_string += "  AND ST_Distance(st_transform(" + fullkey + ",4326),st_transform(" + geom.toSQL() + ",4326)) < 0.001";
                    }
                    else {
                        errors.push("Invalid geometry object");
                        console.error(errors[errors.length - 1]);
                    }
                }
                else if (valid_filter.type == "date" || valid_filter.type == "timestamp") {
                    let d;
                    if (filter[key] instanceof Date) {
                        d = filter[key];
                    }
                    else {
                        d = new Date(filter[key]);
                    }
                    if (valid_filter.trunc != undefined) {
                        assertValidDateTruncField(valid_filter.trunc);
                        filter_string += ` AND date_trunc('${valid_filter.trunc}',${fullkey}) = date_trunc('${valid_filter.trunc}', '${d.toISOString()}'::timestamptz)`;
                    }
                    else {
                        filter_string += " AND " + fullkey + "='" + d.toISOString() + "'::timestamptz";
                    }
                }
                else if (valid_filter.type == "timestart") {
                    var offset = (new Date().getTimezoneOffset() * 60 * 1000) * -1;
                    if (filter[key] instanceof Date) {
                        var ldate = new Date(filter[key].getTime() + offset).toISOString();
                        filter_string += " AND " + fullkey + ">='" + ldate + "'";
                    }
                    else {
                        var d = new Date(filter[key]);
                        var ldate = new Date(d.getTime() + offset).toISOString();
                        filter_string += " AND " + fullkey + ">='" + ldate + "'";
                    }
                }
                else if (valid_filter.type == "timeend") {
                    var offset = (new Date().getTimezoneOffset() * 60 * 1000) * -1;
                    if (filter[key] instanceof Date) {
                        var ldate = new Date(filter[key].getTime() + offset).toISOString();
                        filter_string += " AND " + fullkey + "<='" + ldate + "'";
                    }
                    else {
                        var d = new Date(filter[key]);
                        var ldate = new Date(d.getTime() + offset).toISOString();
                        filter_string += " AND " + fullkey + "<='" + ldate + "'";
                    }
                }
                else if (valid_filter.type == "greater_or_equal_date") {
                    var ldate = new Date(filter[key]).toISOString();
                    filter_string += ` AND ${fullkey} >= '${ldate}'::timestamptz`;
                }
                else if (valid_filter.type == "smaller_or_equal_date") {
                    var ldate = new Date(filter[key]).toISOString();
                    filter_string += ` AND ${fullkey} <= '${ldate}'::timestamptz`;
                }
                else if (valid_filter.type == "numeric_interval") {
                    if (Array.isArray(filter[key])) {
                        if (filter[key].length < 2) {
                            errors.push("numeric_interval debe ser de al menos 2 valores");
                            console.error(errors[errors.length - 1]);
                        }
                        else {
                            filter_string += " AND " + fullkey + ">=" + parseFloat(filter[key][0]) + " AND " + key + "<=" + parseFloat(filter[key][1]);
                        }
                    }
                    else {
                        filter_string += " AND " + fullkey + "=" + parseFloat(filter[key]);
                    }
                }
                else if (valid_filter.type == "numeric_min") {
                    filter_string += " AND " + fullkey + ">=" + parseFloat(filter[key]);
                }
                else if (valid_filter.type == "numeric_max") {
                    filter_string += " AND " + fullkey + "<=" + parseFloat(filter[key]);
                }
                else if (valid_filter.type == "integer") {
                    if (Array.isArray(filter[key])) {
                        const values = filter[key].map(v => parseInt(v)).filter(v => v.toString() != "NaN");
                        if (!values.length) {
                            errors.push(`Invalid integer array : ${filter[key].toString()}`);
                            console.error(errors[errors.length - 1]);
                        }
                        else {
                            filter_string += " AND " + fullkey + " IN (" + values.join(",") + ")";
                        }
                    }
                    else {
                        var value = parseInt(filter[key]);
                        if (value.toString() == "NaN") {
                            errors.push(`Invalid integer: ${filter[key]}`);
                            console.error(errors[errors.length - 1]);
                        }
                        else {
                            filter_string += " AND " + fullkey + "=" + value + "";
                        }
                    }
                }
                else if (valid_filter.type == "number" || valid_filter.type == "float") {
                    if (Array.isArray(filter[key])) {
                        const values = filter[key].map(v => parseFloat(v)).filter(v => v.toString() != "NaN");
                        if (!values.length) {
                            errors.push(`Invalid float array: ${filter[key].toString()}`);
                            console.error(errors[errors.length - 1]);
                        }
                        else {
                            filter_string += " AND " + fullkey + " IN (" + values.join(",") + ")";
                        }
                    }
                    else {
                        var value = parseFloat(filter[key]);
                        if (value.toString() == "NaN") {
                            errors.push(`Invalid float: ${filter[key]}`);
                            console.error(errors[errors.length - 1]);
                        }
                        else {
                            filter_string += " AND " + fullkey + "=" + value + "";
                        }
                    }
                }
                else if (valid_filter.type == "interval") {
                    const value = createInterval(filter[key]);
                    if (!value) {
                        throw ("invalid interval filter: " + filter[key]);
                    }
                    filter_string += ` AND ${fullkey}='${value.toPostgres()}'::interval`;
                }
                else if (valid_filter.type == "jsonpath") {
                    if (!valid_filter.expression) {
                        throw new Error("Missing expression for valid_filter " + key);
                    }
                    const jsonpath_expression = valid_filter.expression.replace("$0", filter[key]);
                    filter_string += ` AND jsonb_path_exists(${fullkey}, '${jsonpath_expression}')`;
                }
                else {
                    if (Array.isArray(filter[key])) {
                        filter_string += " AND " + fullkey + " IN (" + filter[key].join(",") + ")";
                    }
                    else {
                        filter_string += " AND " + fullkey + "=" + filter[key] + "";
                    }
                }
            }
            else if (valid_filter.required) {
                errors.push("Falta valor para filtro obligatorio " + key);
                console.error(errors[errors.length - 1]);
            }
        }
    }
    if (errors.length > 0) {
        if (throw_on_error) {
            throw ("Invalid filter:\n" + errors.join("\n"));
        }
        else {
            return null;
        }
    }
    else {
        return filter_string;
    }
}
export function pasteIntoSQLQuery(query, params) {
    for (var i = params.length - 1; i >= 0; i--) {
        var value;
        switch (typeof params[i]) {
            case "string":
                value = escapeLiteral(params[i]);
                break;
            case "number":
                value = parseFloat(params[i]);
                if (value.toString() == "NaN") {
                    throw (new Error("Invalid number"));
                }
                break;
            case "object":
                if (params[i] instanceof Date) {
                    value = "'" + params[i].toISOString() + "'::timestamptz::timestamp";
                }
                else if (params[i] instanceof Array) {
                    // if(/';/.test(params[i].join(","))) {
                    // 	throw("Invalid value: contains invalid characters")
                    // }
                    value = escapeLiteral(`{${params[i].join(",")}}`); // .map(v=> (typeof v == "number") ? v : "'" + v.toString() + "'")
                }
                else if (params[i] === null) {
                    value = "NULL";
                }
                else if (params[i].constructor && params[i].constructor.name == 'PostgresInterval') {
                    value = `${escapeLiteral(params[i].toPostgres())}::interval`;
                }
                else {
                    value = escapeLiteral(params[i].toString());
                }
                break;
            case "undefined":
                value = "NULL";
                break;
            default:
                value = escapeLiteral(params[i].toString());
        }
        var I = parseInt(i.toString()) + 1;
        var placeholder = "\\$" + I.toString();
        // console.log({placeholder:placeholder,value:value})
        query = query.replace(new RegExp(placeholder, "g"), value.toString());
    }
    return query;
}
