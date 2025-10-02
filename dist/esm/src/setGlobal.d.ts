import { Pool } from 'pg';
import A5Config from './a5Config';
interface Global {
    pool?: Pool;
    config?: A5Config;
    dbConnectionString?: string;
    logPoolUsage?(): void;
}
export default function setGlobal(): Global;
export {};
