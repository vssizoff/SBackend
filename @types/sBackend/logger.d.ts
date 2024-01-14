import {File} from "./ulils";

export function getDate(): string;

export default class Logger {
    log: (...data: Array<string>) => void;
    file: File
    
    constructor(path: string, log: (...data: Array<string>) => void);
    clear(): void;
    logSeparately(consoleData: Array<string>, fileData: Array<string>): void;
    getPrefix(tag: string): string;
    Log(tag: string, func: (data: string) => string, ...data: Array<string>): void;
    message(...data: Array<any>): void;
    success(...data: Array<any>): void;
    warning(...data: Array<any>): void;
    error(...data: Array<any>): void;
    fatal(...data: Array<any>): void;
    initMessage(name: string, version: string, port: string | number): void;
    requestFull(url: string, code: number, request: any, response: any): void;
    request(url: string, code: number): void;
    requestError(url: string, request: string, stackTrace: string): void;
    wsConnected(url: string): void;
    wsRejected(url: string): void;
    wsInputFull(url: string, data: any): void;
    wsInput(url: string): void;
    wsOutputFull(url: string, data: any): void;
    wsOutput(url: string): void;
    wsError(url: string, data: any, stackTrace: string): void;
    wsClose(url: string): void;
    wsTerminate(url: string): void;
    gqlMissingData(url: string, body: any, query: any, headers: any): void;
}