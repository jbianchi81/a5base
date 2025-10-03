import { baseModel, ModelField } from './baseModel';
interface UserRequest extends Request {
    user: User_;
}
declare const internal: {};
import { Request, Response } from 'express';
import { Client } from 'pg';
export declare function getUsers(req: UserRequest, res: Response): Promise<void>;
export declare function createUser(req: Request, res: Response): Promise<void>;
export declare function getUser(req: UserRequest, res: Response): Promise<void>;
export declare function userChangePassword(req: UserRequest, res: Response): Promise<void>;
export declare function deleteUser(req: Request, res: Response): Promise<void>;
export declare function viewUser(req: UserRequest, res: Response): Promise<void>;
export declare function viewUsers(req: UserRequest, res: Response): Promise<void>;
export declare function newUserForm(req: UserRequest, res: Response): void;
interface UserFields {
    id?: number;
    name: string;
    role?: string;
    password?: string;
    pass_enc?: Buffer<ArrayBufferLike>;
    token?: Buffer<ArrayBufferLike>;
}
interface User_ {
    username: string;
    id: number | undefined;
    role: string | undefined;
    password: string | undefined;
}
interface ReadFilter {
    id?: number;
    name?: string;
    role?: string;
}
interface Changes {
    password?: string;
    token?: Buffer<ArrayBufferLike>;
    role?: string;
}
export declare class User extends baseModel {
    name: string;
    id: number | undefined;
    role: string | undefined;
    password: string | undefined;
    pass_enc: Buffer<ArrayBufferLike> | undefined;
    token: Buffer<ArrayBufferLike> | undefined;
    static _fields: {
        [x: string]: ModelField;
    };
    constructor(fields: UserFields);
    bufferToString(buffer: Buffer): string;
    stringifyPassword(): string;
    stringifyToken(): string;
    toCSV(options?: {
        header?: boolean;
    }): string;
    static fromCSVMany(csv_string: string): User[];
    /**
     * Convert CSV row to user instance
     * @param {string|any[]} array_or_string - Array or delimited string that represents a single user instance
     * @returns {internal.user}
     */
    static fromCSV(array_or_string: string[] | string): User;
    toJSON(): {
        id: number | undefined;
        name: string;
        role: string | undefined;
        password: string | undefined;
        token: Buffer<ArrayBufferLike> | undefined;
        pass_enc: Buffer<ArrayBufferLike> | undefined;
    };
    encryptToken(): string | Buffer<ArrayBuffer> | undefined;
    encryptPassword(): string | Buffer<ArrayBuffer> | undefined;
    create(): Promise<this>;
    static create(users: UserFields | UserFields[], options: any, client: typeof Client): Promise<User[]>;
    static read(filter: ReadFilter, options?: any): Promise<User[]>;
    static read(id: number, options?: any): Promise<User | undefined>;
    update(changes?: Changes): Promise<this>;
    static update(filter?: {}, changes?: {}): Promise<User[]>;
    delete(options: any): Promise<User | undefined>;
    static delete(filter: ReadFilter): Promise<User[]>;
}
export default internal;
