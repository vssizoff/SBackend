import {GraphQLSchema} from "graphql/type";
import {GqlRootValueType, SBackendRequest, SBackendResponse, WebSocketExtension} from "./index";
import WebSocket from "ws";

export class GqlSubSubscription {
    eventEmitter: GqlEventEmitter;
    schema: GraphQLSchema;
    parent: GqlSubscription;
    id: string;
    name: string;
    payload: object;

    constructor(parent: GqlSubscription, eventEmitter: GqlEventEmitter, schema: GraphQLSchema, id: string, payload: object);
    send(data: any, afterHandler: (data: any) => any): void;
    regEvent(event: string, beforeHandler: (data: any) => any, afterHandler: (data: any) => any): void;
}

export type SubscribeHandlerType = (subSubscription: GqlSubSubscription) => void;

export class GqlSubscription {
    connection: WebSocket & WebSocketExtension;
    eventEmitter: GqlEventEmitter;
    subscribeHandlers: Array<SubscribeHandlerType>;
    schema: GraphQLSchema;
    subSubscriptions: {[id: string]: GqlSubSubscription};

    constructor(connection: WebSocket & WebSocketExtension, eventEmitter: GqlEventEmitter, schema: GraphQLSchema);
    send(id: string, data: any): void;
    onMessage(callback: (this: WebSocket, data: WebSocket.RawData, isBinary: boolean) => void): void;
    onClose(callback: (this: WebSocket, code: number, reason: Buffer) => void): void;
    onError(callback: (this: WebSocket, err: Error) => void): void;
    onOpen(callback: (this: WebSocket) => void): void;
    onSubscribe(callback: SubscribeHandlerType): void;
    terminate(): void;
}

export type onGqlErrorType = (error: object, request: SBackendRequest, response: SBackendResponse, data: string, schema: GraphQLSchema, rootValue: GqlRootValueType) => void;

export type onGqlMissingDataType = (request: SBackendRequest, response: SBackendResponse) => void;

export type gqlParserType = (data: string, schema: GraphQLSchema, rootValue: GqlRootValueType, request: SBackendRequest, response: SBackendResponse, onError: onGqlErrorType, onMissingData: onGqlMissingDataType) => any | {data: any, errors: any} | undefined;

export let onGqlError: onGqlErrorType;
export let onGqlMissingData: onGqlMissingDataType;
export let gqlParser: gqlParserType;

export class GqlEventEmitter {
    events: {[key: string]: Array<(data: string) => void>};
    on(event: string, callback: (data: string) => void): void;
    emit(event: string, data: string): void;
}