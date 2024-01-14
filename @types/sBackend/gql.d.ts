export function gqlParser(data, schema, rootValue, request, response, onError = onGqlError, onMissingData = onGqlMissingData): any | {data: any, errors: any} | undefined;

export function onGqlError(error, request, response, data, schema, rootValue): void;

export function onGqlMissingData(request, response): void;

export class GqlEventEmitter {
    events: {[key: string]: Array<(data: string) => void>};
    on(event: string, callback: (data: string) => void): void;
    emit(event: string, data: string): void;
}