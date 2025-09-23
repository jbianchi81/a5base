import { Pool } from 'pg'
import path from 'path'
import config from 'config';
        
        
interface Global {
    pool?: Pool
    config?: any
    dbConnectionString?: string
    logPoolUsage?(): void
}

interface DBConfig {
    idleTimeoutMillis?: number
    host: string
    database: string
    user: string
    password: string
    port: number
}

interface LogPoolUsageConfig {
    activate: boolean
    interval: number
}

type A5Config = {
    database?: DBConfig
    log_pool_usage?: LogPoolUsageConfig
}

export default function setGlobal() {
    const g = global as Global
    if(!g.pool) {
        // console.log("setting global.pool")
        process.env["NODE_CONFIG_DIR"] = path.resolve("config/")
        process.env["A5_BASE_DIR"] = path.resolve(".")
        g.config = config
        const c = g.config as A5Config
        if(!("database" in c)) {
            throw("Missing config.database")
        }
        if(! c.database.idleTimeoutMillis) {
        c.database.idleTimeoutMillis = 1000
        }
        
        g.pool = new Pool(c.database)
        if(!g.dbConnectionString) {
            g.dbConnectionString = "host=" + c.database.host + " user=" + c.database.user + " dbname=" + c.database.database + " password=" + c.database.password + " port=" + c.database.port
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
            if(g.pool) {
                console.log(new Date().toISOString() + " POOL TOTAL: " + g.pool.totalCount + ", WAITING: " + g.pool.waitingCount + ", IDLE: " + g.pool.idleCount)
            } else {
                console.log(new Date().toISOString() + " POOL NOT SET")
            }
        }
        
        if(c.log_pool_usage && c.log_pool_usage.activate) {
            setInterval(g.logPoolUsage,c.log_pool_usage.interval)
        }
    }
    return g
}