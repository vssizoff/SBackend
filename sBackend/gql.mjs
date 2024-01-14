import {execute, parse, defaultFieldResolver} from "graphql";

function wrapper(callback, name) {
    return function (input, context) {
        try {
            function runEvent(connection, data) {
//                connection.send(execute({
//                    schema: context.schema,
//                    document: parse(context.data),
//                    rootValue: {
//                        [name]() {
//                            return data;
//                        }
//                    }
//                }));
                let {errors, data: Data} = gqlExecuteOne(context.schema, context.data, data, name, false);
                connection.send(errors === undefined ? {data: Data} : {errors, data: Data});
            }

            return callback.apply(this, [input, {
                runEvent,
                async acceptConnection(event) {
                    let connection = await context.response.accept()
                    context.app.gqlEventEmitter.on(event, data => runEvent(connection, data));
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

export function gqlExecuteOne(schema, data, resolver, name, throwErrors = true) {
    let {errors, data: output} = execute({
        schema: schema,
        document: typeof data === "string" ? parse(data) : data,
        rootValue: {[name]: typeof resolver === "function" ? wrapper(resolver) : resolver}
    });
    if (throwErrors) {
        if (errors !== undefined) return output[name];
        throw new Error(errors);
    }
    else return {errors, data: output[name]}
}

export function gqlExecute(schema, data, {query, mutation, subscription}, context, throwErrors = true) {
    let {errors, data: output} = execute({
        schema,
        rootValue: Object.fromEntries(Object.entries({...query, ...mutation, ...subscription}).map(([key, func]) =>[key, typeof func === "function" ? wrapper(func, key) : func])),
        contextValue: context,
        document: typeof data === "string" ? parse(data) : data
    });
    if (throwErrors) {
        if (errors !== undefined) return output;
        throw new Error(errors);
    }
    else return {errors, data: output}
}

export function gqlParser(data, schema, rootValue, request, response, onError = onGqlError, onMissingData = onGqlMissingData) {
//    return execute({
//        schema,
//        rootValue: Object.fromEntries(Object.entries(rootValue).map(([key, func]) => [key, wrapper(func, key)])),
//        contextValue: {
//            request, response, schema, data, app: this, onError, onMissingData,
//            onEmit: (event, callback) => {
//                this.gqlEventEmitter.on(event, callback);
//            },
//            emit: (event, data) => {
//                this.gqlEventEmitter.emit(event, data);
//            }
//        },
//        document: parse(data)
//    });
    return gqlExecute(schema, data, rootValue, {
        request, response, schema, data, app: this, onError, onMissingData,
        onEmit: (event, callback) => {
            this.gqlEventEmitter.on(event, callback);
            },
        emit: (event, data) => {
            this.gqlEventEmitter.emit(event, data);
        }
    }, false);
}

export function onGqlError(error, request, response, data, schema, rootValue) {
    this.logger.requestError(request.url, data, "stack" in error ? error.stack : JSON.stringify(error))
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