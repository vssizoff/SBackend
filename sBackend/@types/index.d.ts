import Logger from "./logger";
import {GqlEventEmitter, gqlParserType, GqlSubSubscription, onGqlErrorType, onGqlMissingDataType} from "./gql";
import {WebSocketExpress, WSResponse} from "websocket-express";
import * as readline from "node:readline";
import * as http from "node:http";
import {GraphQLSchema} from "graphql/type";
import {PathLike} from "fs";
import * as WebSocket from "ws";

export type ConfigType = {
    port: string | number,
    host: string,
    name: string,
    version: string,
    logPath: string,
    readlinePrompt: string,
    handlerConfig: {
        autoLogFull: boolean,
        autoLog: boolean,
        autoLogWsFull: boolean,
        autoLogWs: boolean,
        onRequestHandlingErrorMessage: string,
        onRequestHandlingError(request, response, config, error): void,
        onWsHandlingErrorMessage: string,
        onWsHandlingError(data, connection, config, error): void
    },
    questionString: "> "
};

export type HandlerTypeType = "post" | "get" | "head" | "put" | "delete" | "options" | "connect" | "patch" | "ws" | "websocket";

export type HandlerCallbackType = (request: SBackendRequest, response: SBackendResponse, next: () => void) => void;
export type WSHandlerCallbackType = (request: SBackendRequest, response: SBackendWSResponse, next: () => void) => void;

export type HandlerType = {
    route: string,
    callback: HandlerCallbackType,
    type: HandlerTypeType
};

export type GqlHandlersHandler = GqlRootValueType & {
    schema: GraphQLSchema,
    parser?: gqlParserType,
    onError?: onGqlErrorType,
    onMissingData?: onGqlMissingDataType
};

export type HandlersType = {
    post?: {[key: string]: HandlerCallbackType},
    get?: {[key: string]: HandlerCallbackType},
    head?: {[key: string]: HandlerCallbackType},
    put?: {[key: string]: HandlerCallbackType},
    delete?: {[key: string]: HandlerCallbackType},
    options?: {[key: string]: HandlerCallbackType},
    connect?: {[key: string]: HandlerCallbackType},
    patch?: {[key: string]: HandlerCallbackType},
    ws?: {[key: string]: WSHandlerCallbackType},
    websocket?: {[key: string]: WSHandlerCallbackType},
    gql?: {[key: string]: GqlHandlersHandler},
    graphql?: {[key: string]: GqlHandlersHandler},
    files?: {[key: string]: PathLike},
    folders?: {[key: string]: PathLike},
    paths?: {[key: string]: PathLike},
    use?: {[key: string]: HandlerCallbackType},
    useHttp?: {[key: string]: HandlerCallbackType},
}

export type RouteType = {
    route: string,
    dir: string
} | {
    route: string,
    path: string
} | {
    route: string,
    type: HandlerTypeType
} | {
    route: string,
    type: "graphql",
    query: Array<string>,
    mutation: Array<string>,
    subscription: Array<string>
}

export type EventHandlerType = (app: SBackend) => void;

export class SBackendRequest extends http.IncomingMessage {
    body: string | object;
    stringQuery: {[key: string]: string};
    parsedQuery: {[key: string]: boolean | null | undefined | string | object};
    query: {[key: string]: boolean | null | undefined | string | object};
    stringHeaders: {[key: string]: string};
    parsedHeaders: {[key: string]: boolean | null | undefined | string | object};
    // @ts-ignore
    headers: {[key: string]: boolean | null | undefined | string | object};
    stringParams: {[key: string]: string};
    parsedParams: {[key: string]: boolean | null | undefined | string | object};
    params: {[key: string]: boolean | null | undefined | string | object};
}

export class SBackendResponse extends http.ServerResponse {
    // @ts-ignore
    end(data?: string | object): void;
    sendError(error: any): void;
    onBeforeSend(func: (res: string | object, status: number, end: boolean) => void): void;
    onAfterSend(func: (res: string | object, status: number, end: boolean) => void): void;
    onStatusChange(func: (newStatus: number) => void): void;
    headers: {[key: string]: string | number}
}

export interface SBackendWSResponse extends WSResponse {
    sendError(error: any): void;
    onBeforeSend(func: (res: string | object, status: number, end: boolean) => void): void;
    onAfterSend(func: (res: string | object, status: number, end: boolean) => void): void;
    onStatusChange(func: (newStatus: number) => void): void;
    headers: {[key: string]: string | number}

}

export type WrapperBeforeHandlerType = (this: SBackend, request: SBackendRequest, response: SBackendResponse, next: () => void, route: string) => void;
export type WrapperAfterHandlerType = (this: SBackend, request: SBackendRequest, response: SBackendResponse, next: () => void, route: string, ans: any) => any;

export interface NextMessageOptions {
    timeout?: number | undefined;
}

export interface WebSocketMessage {
    data: Buffer;
    isBinary: boolean;
}

export interface WebSocketExtension {
    nextMessage(options?: NextMessageOptions): Promise<WebSocketMessage>;
}

export type GqlContextType = {
    [key: string]: any,
    request: SBackendRequest,
    response: SBackendResponse,
    schema: GraphQLSchema,
    data: string,
    app: SBackend,
    onError: onGqlErrorType,
    onMissingData: onGqlMissingDataType,
    emit: Function
};

export type GqlSubscriptionContextType = GqlContextType & {
    response: SBackendWSResponse,
    regEvent: typeof GqlSubSubscription.prototype.regEvent,
    subscription: GqlSubSubscription
};

export type GqlHandlerType = (this: SBackend, input: {[key: string]: any}, context: GqlContextType) => any;
export type GqlSubscriptionHandlerType = (this: SBackend, input: {[key: string]: any}, context: GqlSubscriptionContextType) => any;

export type GqlRootValueType = {
    query?: {[key: string]: GqlHandlerType},
    mutation?: {[key: string]: GqlHandlerType},
    subscription?: {[key: string]: GqlSubscriptionHandlerType}
};

export type GqlOptions = {
    parser?: gqlParserType,
    onError?: onGqlErrorType,
    onMissingData?: onGqlMissingDataType,
    context?: {
        [key: string]: any
    }
}

export type KeyboardCommandHandlerType = (data: string) => void;

export default class SBackend {
    config: ConfigType
    logger: Logger
    express: WebSocketExpress;
    handlers: Array<HandlerType>;
    keyboardCommands: Array<{command: string, callback: KeyboardCommandHandlerType}>;
    routes: Array<RouteType>;
    rlStopped: boolean;
    readline: readline.Interface;
    server?: http.Server;
    onStartCallbacks: Array<EventHandlerType>;
    onPauseCallbacks: Array<EventHandlerType>;
    onResumeCallbacks: Array<EventHandlerType>;
    onStopCallbacks: Array<EventHandlerType>;
    onRestartCallbacks: Array<EventHandlerType>;
    defaultKeyboardHandler: (text: string) => void;
    wrapperBeforeHandlers: Array<WrapperBeforeHandlerType>;
    wrapperAfterHandlers: Array<WrapperAfterHandlerType>;
    gqlEventEmitter: GqlEventEmitter;
    versions: Array<string>;
    wsConnections: Array<WebSocket & WebSocketExtension>;

    constructor(config: Partial<ConfigType>);

    on(event: "start" | "pause" | "resume" | "stop" | "restart" | "wrapperBeforeHandler" | "wrapperAfterHandler", callback: EventHandlerType): void;

    onStart(callback: EventHandlerType): void;

    onPause(callback: EventHandlerType): void;

    onResume(callback: EventHandlerType): void;

    onStop(callback: EventHandlerType): void;

    onRestart(callback: EventHandlerType): void;

    onWrapperBeforeHandler(callback: EventHandlerType): void;

    onWrapperAfterHandler(callback: EventHandlerType): void;

    setConfig(config: Partial<ConfigType>): void;

    setVersions(versions: Array<string>): void;

    addVersion(version: string): void;

    initRl(): void;

    question(text: string, callback: (data: string) => void): void;

    addHandler(Route: string, type: HandlerTypeType, callback: HandlerCallbackType, routePush?: boolean): void;

    addHandlers(handlers: HandlersType): void;

    post(route: string, callback: HandlerCallbackType, routePush?: boolean): void;

    get(route: string, callback: HandlerCallbackType, routePush?: boolean): void;

    head(route: string, callback: HandlerCallbackType, routePush?: boolean): void;

    put(route: string, callback: HandlerCallbackType, routePush?: boolean): void;

    delete(route: string, callback: HandlerCallbackType, routePush?: boolean): void;

    options(route: string, callback: HandlerCallbackType, routePush?: boolean): void;

    connect(route: string, callback: HandlerCallbackType, routePush?: boolean): void;

    patch(route: string, callback: HandlerCallbackType, routePush?: boolean): void;

    ws(route: string, callback: WSHandlerCallbackType, routePush?: boolean): void;

    websocket(route: string, callback: WSHandlerCallbackType, routePush?: boolean): void;

    gql(route: string, schema: GraphQLSchema, rootValue: GqlRootValueType, options?: GqlOptions, routePush?: boolean): void;

    graphql(route: string, schema: GraphQLSchema, rootValue: GqlRootValueType, options?: GqlOptions, routePush?: boolean): void;

    addFolder(route: string, path: PathLike, logging?: boolean): void;

    addFile(route: string, path: PathLike, logging?: boolean): void;

    addPath(route: string, path: PathLike, logging?: boolean): void;

    addFilesJson(files: {[key: string]: string}, pathResolve: (...args: Array<string>) => string, logging?: boolean): void;

    use(callback: HandlerCallbackType): void;
    use(route: string, callback: HandlerCallbackType, routePush?: boolean): void;

    useHTTP(callback: HandlerCallbackType): void;
    useHTTP(route: string, callback: HandlerCallbackType, routePush?: boolean): void;

    addKeyboardCommand(command: string, callback: KeyboardCommandHandlerType): void;

    addKeyboardCommands(commands: Array<{command: string, callback: KeyboardCommandHandlerType}> | {[key: string]: KeyboardCommandHandlerType}): void;

    start(callback?: (server: http.Server) => void, runEvents?: boolean): void;

    startAsync(runEvents?: boolean): Promise<void>;

    pause(stopRl?: boolean, callback?: (app: SBackend) => void, runEvents?: boolean): void;

    resume(rerunCallback?: boolean, callback?: (app: SBackend) => void, runEvents?: boolean): void;

    stop(code: number, callback?: (app: SBackend) => void, runEvents?: boolean): void;

    restart(rerunCallback?: boolean, callback?: (app: SBackend) => void, runEvents?: boolean): void;

    gqlEmit(event: string, data: string): void;
}

export function buildHandlers(...handlers: Array<HandlersType>): HandlersType;