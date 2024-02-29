import * as fs from "fs";
import Logger from "./logger.mjs";
import {wsMiddleware} from "./ws.mjs";
import {execute} from "./versions.mjs";
import * as readline from "node:readline";
import fileUpload from "express-fileupload";
import {endJSONMiddleware} from "./endJSON.mjs";
import {WebSocketExpress} from 'websocket-express';
import {sendErrorMiddleware} from "./sendError.mjs";
import {sendHandlersMiddleware} from "./sendHandlers.mjs";
import {requestLoggerMiddleware} from "./requestLogger.mjs";
import {defaultConfig, defaultGqlOptions} from "./types.mjs";
import {responseHeadersMiddleware} from "./responseHeaders.mjs";
import {requestBodyParserMiddleware} from "./requestBodyParser.mjs";
import {statusChangeHandlersMiddleware} from "./statusChangeHandlers.mjs";
import {afterRoute, autoNext, handlersFormat, wrapper} from "./handlers.mjs";
import {GqlEventEmitter, gqlParser, GqlSubscription, onGqlError, onGqlMissingData} from "./gql.mjs";
import {headersParserMiddleware, queryParserMiddleware, routeParamsParserMiddleware} from "./parsers.mjs";

let log = console.log;

export default class SBackend {
    config = defaultConfig
    logger
    express = new WebSocketExpress();
    handlers = [];
    keyboardCommands = [];
    routes = [];
    rlStopped = false;
    readline = readline.createInterface({input: process.stdin, output: process.stdout});
    server = undefined;
    onStartCallbacks = [];
    onPauseCallbacks = [];
    onResumeCallbacks = [];
    onStopCallbacks = [];
    onRestartCallbacks = [];
    defaultKeyboardHandler = () => undefined;
    wrapperBeforeHandlers = [];
    wrapperAfterHandlers = [];
    gqlEventEmitter = new GqlEventEmitter();
    versions = [];
    wsConnections = [];

    constructor(config = defaultConfig) {
        this.setConfig(config);
        this.use((request) => {
            request.url = decodeURIComponent(request.url);
            return true;
        });
        this.use(endJSONMiddleware);
        this.use(statusChangeHandlersMiddleware);
        this.use(sendHandlersMiddleware)
        this.use(fileUpload({}));
        this.use(requestBodyParserMiddleware);
        this.use(requestLoggerMiddleware);
        this.use(sendErrorMiddleware);
        this.use(queryParserMiddleware);
        this.use(headersParserMiddleware);
        this.use(routeParamsParserMiddleware);
        this.use(responseHeadersMiddleware);
        this.use((request, response) => {
            response.set({"X-Powered-By": "SBackend"});
            return true;
        });
        this.use(wsMiddleware);
        this.on("wrapperBeforeHandler", afterRoute);
        this.on("wrapperAfterHandler", autoNext);
    }

    on(event, callback) {
        switch (event.toLowerCase()) {
            case "start":
                this.onStartCallbacks.push(callback);
                break;
            case "pause":
                this.onPauseCallbacks.push(callback);
                break;
            case "resume":
                this.onResumeCallbacks.push(callback);
                break;
            case "stop":
                this.onStopCallbacks.push(callback);
                break;
            case "restart":
                this.onRestartCallbacks.push(callback);
                break;
            case "wrapperbeforehandler":
                this.wrapperBeforeHandlers.push(callback);
                break;
            case "wrapperafterhandler":
                this.wrapperAfterHandlers.push(callback);
                break;
        }
    }

    onStart(callback) {
        this.on("start", callback);
    }

    onPause(callback) {
        this.on("pause", callback);
    }

    onResume(callback) {
        this.on("resume", callback);
    }

    onStop(callback) {
        this.on("stop", callback);
    }

    onRestart(callback) {
        this.on("restart", callback);
    }

    onWrapperBeforeHandler(callback) {
        this.on("wrapperBeforeHandler", callback);
    }

    onWrapperAfterHandler(callback) {
        this.on("wrapperAfterHandler", callback);
    }

    setConfig(config = defaultConfig) {
        this.config = {...this.config, ...config};
        this.config.handlerConfig = {...this.config.handlerConfig, ...config.handlerConfig}
        this.initRl();
        this.logger = new Logger(this.config.logPath, console.log);
        console.log = this.logger.message.bind(this.logger);
    }

    setVersions(versions) {
        this.versions = versions;
    }

    addVersion(version) {
        this.versions.push(version);
    }

    initRl() {
        let app = this;
        console.log = function() {
            if (!app.rlStopped) {
                app.readline.pause();
                app.readline.output.write('\x1b[2K\r');
            }
            log.apply(console, Array.prototype.slice.call(arguments));
            if (!app.rlStopped) {
                app.readline.resume();
                app.readline._refreshLine();
            }
        }
        this.readline.setPrompt(this.config.readlinePrompt);
        this.readline.on("line", answer => {
            let command = answer.split(' ')[0], flag = true;
            this.keyboardCommands.forEach(value => {
                if (value.command === command) {
                    value.callback(answer.trim());
                    flag = false;
                }
            });
            if (flag) {
                this.defaultKeyboardHandler(answer.trim());
            }
            if (!this.rlStopped) {
                this.readline.prompt();
            }
        });
    }

    question(text, callback) {
        this.readline.question(text + this.config.questionString, callback);
    }

    addHandler(Route, type, callback, routePush = true) {
        execute(Route, this.versions).forEach(route => {
            type = type.toLowerCase();
            if (type === "files") {
                return this.addFile(route, callback);
            }
            if (type === "folders") {
                return this.addFolder(route, callback);
            }
            if (type === "paths") {
                return this.addPath(route, callback);
            }
            if (type === "use") {
                return this.use(route, callback);
            }
            if (type === "useHTTP") {
                return this.useHTTP(route, callback);
            }
            if (type === "websocket") {
                type = "ws";
            }
            if (route[0] !== '/'){
                route = '/' + route;
            }
            this.handlers.push({route, type, callback});
            this.express[type](route, wrapper(this, callback, route));
            if (routePush) {
                this.routes.push({route, type});
            }
        });
    }

    addHandlers(handlers) {
        handlers = handlersFormat(handlers, this);
        Object.keys(handlers).forEach(type => {
            if (type !== "gql" && type !== "graphql") Object.keys(handlers[type]).forEach(route => {
                this.addHandler(route, type, handlers[type][route]);
            });
            else Object.keys(handlers[type]).forEach(route => {
                let {schema, parser, onError, onMissingData, query, mutation, subscription} = handlers[type][route];
                this.graphql(route, schema, {query, mutation, subscription}, parser, onError, onMissingData);
            });
        });
    }

    post(route, callback, routePush = true) {
        this.addHandler(route, "post", callback, routePush);
    }

    get(route, callback, routePush = true) {
        this.addHandler(route, "get", callback, routePush);
    }

    head(route, callback, routePush = true) {
        this.addHandler(route, "head", callback, routePush);
    }

    put(route, callback, routePush = true) {
        this.addHandler(route, "put", callback, routePush);
    }

    delete(route, callback, routePush = true) {
        this.addHandler(route, "delete", callback, routePush);
    }

    options(route, callback, routePush = true) {
        this.addHandler(route, "options", callback, routePush);
    }

    connect(route, callback, routePush = true) {
        this.addHandler(route, "connect", callback, routePush);
    }

    patch(route, callback, routePush = true) {
        this.addHandler(route, "patch", callback, routePush);
    }

    ws(route, callback, routePush = true) {
        this.addHandler(route, "ws", callback, routePush);
    }

    websocket(route, callback, routePush = true) {
        this.addHandler(route, "ws", callback, routePush);
    }

    gql(route, schema, {query, mutation, subscription}, {parser = gqlParser, onError = onGqlError, onMissingData = onGqlMissingData, context = {}}, routePush = true) {
        async function func(data, rootValue, request, response) {
            try {
                data = await parser.apply(this, [data, schema, rootValue, request, response, context, onError, onMissingData]);
                if (response.ended) return;
                response.status(200);
                response.end(data);
            }
            catch (error) {
                onError.apply(this, [error, request, response, data, schema, rootValue]);
            }
        }

        this.useHTTP(route,  async (request, response) => {
            let data = "";
            if (request.body !== undefined && typeof request.body === "object" && "query" in request.body) data = request.body.query;
            else if (request.parsedQuery !== undefined && typeof request.parsedQuery === "object" && "query" in request.parsedQuery) data = request.parsedQuery.query;
            else if (request.parsedHeaders !== undefined && typeof request.parsedHeaders === "object" && "query" in request.parsedHeaders) data = request.parsedHeaders.query;
            else return onMissingData.apply(this, [request, response]);
            await func.apply(this, [data, {query, mutation}, request, response]);
        }, false);

        this.ws(route, async (request, response) => {
            // let data = "";
            // if (request.parsedQuery !== undefined && typeof request.parsedQuery === "object" && "query" in request.parsedQuery) data = request.parsedQuery.query;
            // else if (request.parsedHeaders !== undefined && typeof request.parsedHeaders === "object" && "query" in request.parsedHeaders) data = request.parsedHeaders.query;
            // else return onMissingData.apply(this, [request, response]);
            // try {
            //     data = await parser.apply(this, [data, schema, {subscription}, request, response]);
            // }
            // catch (error) {
            //     onError.apply(this, [error, request, response, data, schema, {subscription}]);
            // }
            try {
                response.accept().then(connection => {
                    let subscription0 = new GqlSubscription(connection, this.gqlEventEmitter, schema);
                    subscription0.onSubscribe(async (subSubscription) => {
                        try {
                            if (subSubscription.payload === undefined || typeof subSubscription.payload !== "object" || !("query" in subSubscription.payload)) onMissingData.apply(this, [request, response]);
                            else await parser.apply(this, [subSubscription.payload.query, schema, {subscription}, request, response, {...context, subscription: subSubscription}, onError, onMissingData]);
                        }
                        catch (error) {
                            onError.apply(this, [error, request, response, subSubscription.payload, schema, {subscription}]);
                        }
                    });
                });
            }
            catch (error) {
                onError.apply(this, [error, request, response, "", schema, {...subscription}]);
            }
        }, false);

        if (routePush) {
            this.routes.push({
                route, type: "graphql",
                query: query === undefined ? [] : Object.keys(query),
                mutation: mutation === undefined ? [] : Object.keys(mutation),
                subscription: subscription === undefined ? [] : Object.keys(subscription)
            });
        }
    }

    graphql(route, schema, rootValue, options = defaultGqlOptions, routePush = true) {
        this.gql(route, schema, rootValue, options, routePush);
    }

    addFolder(route, path, logging = true) {
        if (route !== null && typeof route === "string" && route.length > 0 && path !== null && typeof path === "string" && path.length > 0){
            if (route[0] !== '/'){
                route = '/' + route;
            }
            this.get(route !== '/' ? route += "/*" : "/*", (request, response) => {
                response.sendFile(`${path}/${request.afterRoute}`);
            }, false)
            this.routes.push({route, dir: path});
        }
    }

    addFile(route, path, logging = true) {
        if (route[0] !== '/'){
            route = '/' + route;
        }
        this.get(route, (request, response) => {
            response.sendFile(path);
        }, false);
        this.routes.push({route, path});
    }

    addPath(route, path, logging = true) {
        this[fs.lstatSync(path).isDirectory() ? "addFolder" : "addFile"](route, path, logging);
    }

    addFilesJson(files, pathResolve, logging = true) {
        Object.keys(files).forEach(route => {
            this.addPath(route, pathResolve(files[route]), logging);
        });
    }

    use(routeOrCallback, callback = undefined, routePush = true) {
        let route = routeOrCallback;
        if (callback === undefined) {
            callback = routeOrCallback;
            route = undefined;
        }
        if (route !== undefined && route[0] !== '/') {
            route = '/' + route;
        }
        callback = wrapper(this, callback, route);
        this.express.use(...(route === undefined ? [callback] : [route, callback]));
        // this.expressUse.push(route === undefined ? [callback] : [route, callback]);
        this.handlers.push({route, callback, type: "use"});
        if (route !== undefined && routePush) {
            this.routes.push({route, type: "use"});
        }
    }

    useHTTP(routeOrCallback, callback = undefined, routePush = true) {
        let route = routeOrCallback;
        if (callback === undefined) {
            callback = routeOrCallback;
            route = undefined;
        }
        if (route !== undefined && route[0] !== '/') {
            route = '/' + route;
        }
        callback = wrapper(this, callback, route);
        this.express.useHTTP(...(route === undefined ? [callback] : [route, callback]));
        // this.expressUse.push(route === undefined ? [callback] : [route, callback]);
        this.handlers.push({route, callback, type: "useHTTP"});
        if (route !== undefined && routePush) {
            this.routes.push({route, type: "useHTTP"});
        }
    }

    addKeyboardCommand(command, callback) {
        this.keyboardCommands.push({command, callback});
    }

    addKeyboardCommands(commands) {
        if (typeof commands !== "object") return;
        if (Array.isArray(commands)) {
            commands.forEach(command => {
                this.addKeyboardCommand(command.command, command.callback);
            });
            return;
        }
        Object.keys(commands).forEach(key => {
            this.addKeyboardCommand(key, commands[key]);
        });
    }

    start(callback = undefined, runEvents = true) {
        this.server = this.express.listen(this.config.port, this.config.host, () => {
            let errorFunc = err => {
                return this.logger.error("Error in start" + `\n${err.stack}`);
            };
            try {
                this.logger.initMessage(this.config.name, this.config.version, this.config.port)
                if (callback !== undefined && typeof callback === "function") callback(this.server);
                if (runEvents) this.onStartCallbacks.forEach(fn => {fn(this)});
                this.readline.prompt();
                process.on('SIGTERM', () => this.stop());
                process.on('SIGINT', () => this.stop());
            }
            catch (err) {
                errorFunc(err)
            }
        });
        return this.server;
    }

    async startAsync(runEvents = true) {
        return new Promise((resolve) => {
            this.start(resolve, runEvents);
        });
    }

    pause(stopRl = false, callback = undefined, runEvents = true) {
        if (stopRl) {
            this.readline.pause();
            this.rlStopped = true;
        }
        for (let wsConnection of this.wsConnections) wsConnection.terminate();
        if (this.server.closeAllConnections) this.server.closeAllConnections();
        this.server.close(() => {
            if (callback !== undefined && typeof callback === "function") callback(this);
            if (runEvents) this.onPauseCallbacks.forEach(fn => {fn(this)});
        });
    }

    resume(rerunCallback = false, callback = undefined, runEvents = true) {
        this.express = new WebSocketExpress();
        this.express.use(fileUpload({}));
        if (this.rlStopped) {
            this.readline.resume();
            this.rlStopped = false;
        }
        this.handlers.forEach(handler => {
            if (handler.route === undefined && handler.type === "use") this.express.use(wrapper(this, handler.callback, handler.route));
            else if (handler.route === undefined && handler.type === "useHTTP") this.express.useHTTP(wrapper(this, handler.callback, handler.route));
            else if (handler.route !== undefined) this.express[handler.type](handler.route, wrapper(this, handler.callback, handler.route));
        });
        if (rerunCallback) this.start(() => {
            if (callback !== undefined && typeof callback === "function") callback(this);
            if (runEvents) this.onResumeCallbacks.forEach(fn => {fn(this)});
            this.onStartCallbacks.forEach(fn => {fn(this)});
        }, false);
        else this.start(() => {
            if (callback !== undefined && typeof callback === "function") callback(this);
            if (runEvents) this.onResumeCallbacks.forEach(fn => {fn(this)});
        }, false);
    }

    stop(code = 0, callback = undefined, runEvents = true) {
        this.pause(true, () => {
            if (callback !== undefined && typeof callback === "function") callback(this);
            if (runEvents) this.onStopCallbacks.forEach(fn => {fn(this)});
            process.exit(code);
        }, false);
    }

    restart(rerunCallback = true, callback = undefined, runEvents = true) {
        this.pause(true, () => {return undefined}, true);
        this.resume(rerunCallback, () => {
            if (callback !== undefined && typeof callback === "function") callback(this);
            if (runEvents) this.onRestartCallbacks.forEach(fn => {fn(this)});
        }, false);
    }

    gqlEmit(event, data) {
        this.gqlEventEmitter.emit(event, data);
    }
}

export function buildHandlers(...handlersArray) {
    let ans = {};
    handlersArray.forEach(handlers => Object.entries(handlers).forEach(([type, typeHandlers]) => {
        if (!(type in ans)) ans[type] = {};
        ans[type] = {...ans[type], ...typeHandlers};
    }));
    return ans;
}