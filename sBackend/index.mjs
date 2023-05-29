import * as fs from "fs";
import express from "express";
import Logger from "./logger.mjs";
import * as utils from "./utils.mjs";
import * as readline from "node:readline";
import {defaultConfig} from "./types.mjs";
import fileUpload from "express-fileupload";
import {endJSONMiddleware} from "./endJSON.mjs";
import {sendErrorMiddleware} from "./sendError.mjs";
import {sendHandlersMiddleware} from "./sendHandlers.mjs";
import {requestLoggerMiddleware} from "./requestLogger.mjs";
import {responseHeadersMiddleware} from "./responseHeaders.mjs";
import {requestBodyParserMiddleware} from "./requestBodyParser.mjs";
import {statusChangeHandlersMiddleware} from "./statusChangeHandlers.mjs";
import {afterRoute, autoNext, handlersFormat, wrapper} from "./handlers.mjs";
import {headersParserMiddleware, queryParserMiddleware, routeParamsParserMiddleware} from "./parsers.mjs";

let log = console.log;

export default class SBackend {
    config = defaultConfig
    logger
    express = express();
    expressUse = [];
    handlers = [];
    keyboardCommands = [];
    routes = [];
    rlStopped = false;
    readline = readline.createInterface({input: process.stdin, output: process.stdout});
    server = undefined;
    onStart = [];
    onPause = [];
    onResume = [];
    onStop = [];
    onRestart = [];
    defaultKeyboardHandler = () => undefined;
    wrapperBeforeHandlers = [];
    wrapperAfterHandlers = [];

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
        this.on("wrapperBeforeHandler", afterRoute);
        this.on("wrapperAfterHandler", autoNext);
    }

    on(event, callback) {
        switch (event.toLowerCase()) {
            case "start":
                this.onStart.push(callback);
                break;
            case "pause":
                this.onPause.push(callback);
                break;
            case "resume":
                this.onResume.push(callback);
                break;
            case "stop":
                this.onStop.push(callback);
                break;
            case "restart":
                this.onRestart.push(callback);
                break;
            case "wrapperbeforehandler":
                this.wrapperBeforeHandlers.push(callback);
                break;
            case "wrapperafterhandler":
                this.wrapperAfterHandlers.push(callback);
                break;
        }
    }

    setConfig(config = defaultConfig) {
        this.config = {...defaultConfig, ...config};
        this.initRl();
        this.logger = new Logger(this.config.logPath, console.log);
        console.log = this.logger.message.bind(this.logger);
    }

    initRl() {
        let app = this;
        console.log = function() {
            if (!app.rlStopped) {
                app.readline.pause();
                // @ts-ignore
                app.readline.output.write('\x1b[2K\r');
            }
            log.apply(console, Array.prototype.slice.call(arguments));
            if (!app.rlStopped) {
                app.readline.resume();
                // @ts-ignore
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

    addHandler(route, type, callback, routePush = true) {
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
        if (route[0] !== '/'){
            route = '/' + route;
        }
        this.handlers.push({route, type, callback});
        if (routePush) {
            this.routes.push({route, type});
        }
    }

    addHandlers(handlers) {
        handlers = handlersFormat(handlers, this);
        Object.keys(handlers).forEach(type => {
            Object.keys(handlers[type]).forEach(route => {
                this.addHandler(route, type, handlers[type][route]);
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

    use(routeOrCallback, callback, routePush = true) {
        let route = routeOrCallback;
        if (callback === undefined) {
            callback = routeOrCallback;
            route = undefined;
        }
        if (route !== undefined && route[0] !== '/') {
            route = '/' + route;
        }
        callback = wrapper(this, callback, route);
        this.expressUse.push(route === undefined ? [callback] : [route, callback]);
        if (route !== undefined && routePush) {
            this.routes.push({
                route,
                type: "use"
            })
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
        this.expressUse.forEach(value => {
            this.express.use(...value);
        });
        this.handlers.forEach(handler => {
            this.express[handler.type](handler.route, wrapper(this, handler.callback, handler.route));
        });
        this.server = this.express.listen(this.config.port, () => {
            let errorFunc = err => {
                return this.logger.error("Error in start" + `\n${err.stack}`);
            };
            try {
                this.logger.initMessage(this.config.name, this.config.version, this.config.port)
                if (callback !== undefined && typeof callback === "function") callback(this);
                if (runEvents) this.onStart.forEach(fn => {fn(this)});
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

    pause(stopRl = false, callback = undefined, runEvents = true) {
        if (stopRl) {
            this.readline.pause();
            this.rlStopped = true;
        }
        if (this.server.closeAllConnections) this.server.closeAllConnections();
        this.server.close(() => {
            if (callback !== undefined && typeof callback === "function") callback(this);
            if (runEvents) this.onPause.forEach(fn => {fn(this)});
        });
    }

    resume(rerunCallback = false, callback = undefined, runEvents = true) {
        this.express = express();
        this.express.use(fileUpload({}));
        if (this.rlStopped) {
            this.readline.resume();
            this.rlStopped = false;
        }
        if (rerunCallback) this.start(() => {
            if (callback !== undefined && typeof callback === "function") callback(this);
            if (runEvents) this.onResume.forEach(fn => {fn(this)});
            this.onStart.forEach(fn => {fn(this)});
        }, false);
        else this.start(() => {
            if (callback !== undefined && typeof callback === "function") callback(this);
            if (runEvents) this.onResume.forEach(fn => {fn(this)});
        }, false);
    }

    stop(code = 0, callback = undefined, runEvents = true) {
        this.pause(true, () => {
            if (callback !== undefined && typeof callback === "function") callback(this);
            if (runEvents) this.onStop.forEach(fn => {fn(this)});
            process.exit(code);
        }, false);
    }

    restart(rerunCallback = true, callback = undefined, runEvents = true) {
        this.pause(true, () => {return undefined}, true);
        this.resume(rerunCallback, () => {
            if (callback !== undefined && typeof callback === "function") callback(this);
            if (runEvents) this.onRestart.forEach(fn => {fn(this)});
        }, false);
    }
}