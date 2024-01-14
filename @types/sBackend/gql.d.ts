import {GraphQLSchema} from "graphql/type";
import {GqlRootValueType, SBackendRequest, SBackendResponse} from "./index";

export type onGqlErrorType = (error: object, request: SBackendRequest, response: SBackendResponse, data: string, schema: GraphQLSchema, rootValue: GqlRootValueType) => void;

export type onGqlMissingDataType = (request: SBackendRequest, response: SBackendResponse) => void;

export type gqlParserType = (data: string, schema: GraphQLSchema, rootValue: GqlRootValueType, request: SBackendRequest, response: SBackendResponse, onError: onGqlError, onMissingData: onGqlMissingData) => any | {data: any, errors: any} | undefined;

export let onGqlError: onGqlErrorType;
export let onGqlMissingData: onGqlMissingDataType;
export let gqlParser: gqlParserType;

export class GqlEventEmitter {
    events: {[key: string]: Array<(data: string) => void>};
    on(event: string, callback: (data: string) => void): void;
    emit(event: string, data: string): void;
}