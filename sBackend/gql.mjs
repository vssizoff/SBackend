import {execute, parse} from "graphql";

function wrapper(callback, name) {
    return function (input, context) {
        try {
            function regEvent(connection, data) {
                connection.send(execute({
                    schema: context.schema,
                    document: parse(context.data),
                    rootValue: {
                        [name]() {
                            return data;
                        }
                    }
                }));
            }

            return callback.apply(this, [input, {
                regEvent,
                async acceptConnection(event) {
                    let connection = await context.response.accept()
                    context.app.gqlEventEmitter.on(event, data => regEvent(connection, data));
                    return connection;
                },
                ...context
            }]);
        }
        catch (error) {
            let {request, response, data, schema, rootValue, onError, app} = context;
            onError.apply(app, [error, request, response, data, schema, rootValue]);
        }
    }
}

export function gqlParser(data, schema, {query, mutation, subscription}, request, response, onError = onGqlError, onMissingData = onGqlMissingData) {
    return execute({
        schema,
        rootValue: Object.fromEntries(Object.entries({...query, ...mutation, ...subscription}).map(([key, func]) => [key, wrapper(func, key)])),
        contextValue: {
            request, response, schema, data, app: this, onError, onMissingData,
            onEmit: (event, callback) => {
                this.gqlEventEmitter.on(event, callback);
            },
            emit: (event, data) => {
                this.gqlEventEmitter.emit(event, data);
            }
        },
        document: parse(data)
    });
}

export function onGqlError(error, request, response, data, schema, rootValue) {
    this.logger.requestError(request.url, data, error.stack)
    request.autoLogFull = false;
    request.autoLog = false;
    response.status(500);
    response.end("");
    response.ended = true
}

export function onGqlMissingData(request, response) {
    let {url, body, parsedQuery, parsedHeaders} = request;
    this.logger.gqlMissingData(url, body, parsedQuery, parsedHeaders);
    request.autoLogFull = false;
    request.autoLog = false;
    response.status(400);
    response.end("");
}

export class GqlEventEmitter {
    events = {}

    on(event, callback) {
        if (!(event in this.events)) this.events[event] = [];
        this.events[event].push(callback);
    }

    emit(event, data) {
        if (!(event in this.events)) return;
        this.events[event].forEach(func => func(data));
    }
}