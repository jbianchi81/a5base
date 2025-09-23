import { Pool } from 'pg';
interface Global {
    pool?: Pool;
    config?: any;
    dbConnectionString?: string;
    logPoolUsage?(): void;
}
export default function setGlobal(): Global;
export {};
