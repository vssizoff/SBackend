import {execute, parse} from "graphql";

export class GqlSubscription {
    connection;
    eventEmitter;
    payload;
    payloadGotHandlers = [];
    id;
    schema;
    name;


    constructor(connection, eventEmitter) {
        this.connection = connection;
        this.eventEmitter = eventEmitter;
        connection.on("message", (data) => {
            switch (data.type) {
                case "connection_init":
                    this.connection.send({type: "connection_ack"});
                    break;
                case "ping":
                    this.connection.send({type: "pong"});
                    break;
                case "subscribe":
                    this.payload = data.payload;
                    this.id = data.id;
                    this.payloadGotHandlers.forEach(func => func(this.payload));
                    break;
            }
        });
    }

    send(data) {
        this.connection.send({id: this.id, type: "next", payload: gqlExecuteOne(this.schema, this.payload.query, data, this.name, false)});
    }

    onMessage(callback) {
        this.connection.on("message", callback);
    }

    onClose(callback) {
        this.connection.on("close", callback);
    }

    onError(callback) {
        this.connection.on("error", callback);
    }

    onOpen(callback) {
        this.connection.on("open", callback);
    }

    onPayloadGot(callback) {
        this.payloadGotHandlers.push(callback);
    }

    terminate() {
        this.connection.terminate();
    }

    regEvent(event) {
        this.eventEmitter.on(event, data => this.send(data));
    }
}

function wrapper(callback) {
    return function (input, context) {
        try {
            return callback.apply(context.app, [input, context]);
        }
        catch (error) {
            let {request, response, data, schema, rootValue, onError, app} = context;
            onError.apply(app, [error, request, response, data, schema, rootValue]);
        }
    }
}

function subscriptionWrapper(callback, name) {
    return function (input, context) {
        try {
            let {app, subscription} = context;
            subscription.name = name;
            console.log(name);
            return callback.apply(app, [input, context]);
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
    console.log(query, mutation, subscription);
    let {errors, data: output} = execute({
        schema,
        rootValue: Object.fromEntries([...Object.entries({...query, ...mutation}).map(([key, func]) =>[key, typeof func === "function" ? wrapper(func, key) : func]),
            ...Object.entries({...subscription}).map(([key, func]) =>[key, typeof func === "function" ? subscriptionWrapper(func, key) : func])]),
        contextValue: context,
        document: typeof data === "string" ? parse(data) : data
    });
    if (throwErrors) {
        if (errors !== undefined) return output;
        throw new Error(errors);
    }
    else return {errors, data: output}
}

export function gqlParser(data, schema, rootValue, request, response, context = {}, onError = onGqlError, onMissingData = onGqlMissingData) {
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
        ...context,
        request, response, schema, data, app: this, onError, onMissingData,
        onEmit: (event, callback) => {
            this.gqlEventEmitter.on(event, callback);
        },
        emit: (event, data) => {
            this.gqlEventEmitter.emit(event, data);
        },
        // runEvent(connection, data0) {
        //     let {errors, data: Data} = gqlExecuteOne(schema, data, data0, name, false);
        //     connection.send(errors === undefined ? {data: Data} : {errors, data: Data});
        // }
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