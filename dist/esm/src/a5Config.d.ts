interface DBConfig {
    idleTimeoutMillis?: number;
    host: string;
    database: string;
    user: string;
    password: string;
    port: number;
}
interface LogPoolUsageConfig {
    activate: boolean;
    interval: number;
}
export interface A5Config {
    database?: DBConfig;
    log_pool_usage?: LogPoolUsageConfig;
}
export {};
