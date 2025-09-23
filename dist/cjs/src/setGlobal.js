"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = setGlobal;
const pg_1 = require("pg");
const path_1 = __importDefault(require("path"));
const config_1 = __importDefault(require("config"));
function setGlobal() {
    const g = global;
    if (!g.pool) {
        // console.log("setting global.pool")
        process.env["NODE_CONFIG_DIR"] = path_1.default.resolve("config/");
        process.env["A5_BASE_DIR"] = path_1.default.resolve(".");
        g.config = config_1.default;
        const c = g.config;
        if (!("database" in c)) {
            throw ("Missing config.database");
        }
        if (!c.database.idleTimeoutMillis) {
            c.database.idleTimeoutMillis = 1000;
        }
        g.pool = new pg_1.Pool(c.database);
        if (!g.dbConnectionString) {
            g.dbConnectionString = "host=" + c.database.host + " user=" + c.database.user + " dbname=" + c.database.database + " password=" + c.database.password + " port=" + c.database.port;
        }
        // if (!Promise.allSettled) {
        //     Promise.allSettled = (promises : Promise<any>[]) =>
        //     Promise.all(
        //         promises.map((promise, i) =>
        //         promise
        //             .then(value => ({
        //             status: "fulfilled",
        //             value,
        //             }))
        //             .catch(reason => ({
        //             status: "rejected",
        //             reason,
        //             }))
        //         )
        //     );
        // }
        g.logPoolUsage = function () {
            if (g.pool) {
                console.log(new Date().toISOString() + " POOL TOTAL: " + g.pool.totalCount + ", WAITING: " + g.pool.waitingCount + ", IDLE: " + g.pool.idleCount);
            }
            else {
                console.log(new Date().toISOString() + " POOL NOT SET");
            }
        };
        if (c.log_pool_usage && c.log_pool_usage.activate) {
            setInterval(g.logPoolUsage, c.log_pool_usage.interval);
        }
    }
    return g;
}
