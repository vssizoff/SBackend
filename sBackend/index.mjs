import express from "express";
import {configValidator} from "./functions.mjs";
import Logger from "./logger.mjs"
import Handler from "./handler.mjs";
import fileUpload from "express-fileupload";
import readline from "node:readline";
import { stdin as input, stdout as output } from 'process';

let defaultConfig = {
    port: 8080,
    name: "app",
    version: "0.0.0",
    logPath: null,
    readlinePrompt: ">> ",
    handlerConfig: {
        wrapper: "auto",
        inputFormat: "object",
        outputFormat: "object",
        parseQuery: false,
        stringQuery: false,
        stringRouteParams: false,
        logging: true,
        logRequest: true,
        logResponse: true,
        ifErr: ""
    }
}

let log = console.log;

function wrapper(handler) {
    return (request, response) => {
        handler.run(request, response)
    }
}

export function handlersFormat(handlers, app) {
    if (typeof handlers === "function") {
        return handlersFormat(handlers(app), app)
    }
    let object = {
        post: {},
        get: {}
    }
    if (typeof handlers !== "object") {
        app.logger.error("Not supported format");
    }
    if (Array.isArray(handlers)) {
        handlers.forEach(handler => {
            object[handler.type || "post"][handler.route || "/"] = handler;
        });
        return object;
    }
    let flag = true;
    Object.keys(handlers).forEach(key => {
        if (key !== "post" && key !== "get") {
            flag = false;
        }
    });
    if (flag) {
        return handlers;
    }
    Object.keys(handlers).forEach(route => {
        let handler = handlers[route];
        object[handler.type || "post"][route] = handler;
    });
    return object;
}

export default class SBackend {
    express = express();
    expressUse = [];
    handlers = [];
    keyboardCommands = [];
    routes = [];
    rlStopped = false;
    readline = readline.createInterface({input, output});
    server = undefined;
    onStart = app => undefined;
    onPause = app => undefined;
    onResume = app => undefined;
    onStop = app => undefined;
    onRestart = app => undefined;
    defaultKeyboardHandler = answer => undefined;

    constructor(config = defaultConfig) {
        this.use(fileUpload({}));
        this.setConfig(config);
        this.initRl();
    }

    on(event, callback) {
        switch (event.toLowerCase()) {
            case "start":
                this.onStart = callback;
                break;
            case "pause":
                this.onPause = callback;
                break;
            case "resume":
                this.onResume = callback;
                break;
            case "stop":
                this.onStop = callback;
                break;
            case "restart":
                this.onRestart = callback;
                break;
        }
    }

    setConfig(config = defaultConfig) {
        this.config = configValidator(defaultConfig, config);
        this.logger = new Logger(this.config.logPath);
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
                    value.callback(answer);
                    flag = false;
                }
            });
            if (flag) {
                this.defaultKeyboardHandler(answer);
            }
            if (!this.rlStopped) {
                this.readline.prompt();
            }
        });
    }

    addHandler(route, type, callback, config = defaultConfig.handlerConfig, routePush = true) {
        if (route.substring(0, 1) !== '/'){
            route = '/' + route;
        }
        type = config.type || type
        this.handlers.push(new Handler(route, type, callback, config, this))
        if (routePush) {
            this.routes.push({route, type, wrapper: config.wrapper});
        }
    }

    addHandlers(handlers) {
        handlers = handlersFormat(handlers, this);
        Object.keys(handlers).forEach(type => {
            Object.keys(handlers[type]).forEach(route => {
                if ("dir" in handlers[type][route]) {
                    this.addFolder(route, handlers[type][route].dir);
                    return;
                }
                if ("path" in handlers[type][route]) {
                    this.addFile(route, handlers[type][route].path);
                    return;
                }
                this.addHandler(route, type, handlers[type][route].callback, handlers[type][route]);
            });
        });
    }

    post(route, callback, config = defaultConfig.handlerConfig, routePush = true) {
        this.addHandler(route, "post", callback, {...config, wrapper: "post"}, routePush)
    }

    get(route, callback, config = defaultConfig.handlerConfig, routePush = true) {
        this.addHandler(route, "get", callback, {...config, wrapper: "get"}, routePush)
    }

    formData(route, callback, config = defaultConfig.handlerConfig, routePush = true) {
        this.addHandler(route, "post", callback, {...config, wrapper: "post.formData"}, routePush)
    }

    rawPost(route, callback, config = defaultConfig.handlerConfig) {
        this.addHandler(route, "post", callback, {...config, wrapper: "raw"})
    }

    rawGet(route, callback, config = defaultConfig.handlerConfig) {
        this.addHandler(route, "get", callback, {...config, wrapper: "raw"})
    }

    addFolder(route, path, logging = true){
        if (route !== null && typeof route === "string" && route.length > 0 && path !== null && typeof path === "string" && path.length > 0){
            if (route.substring(0, 1) !== '/'){
                route = '/' + route;
            }
            // this.express.use(route, express.static(path));
            // this.get(route !== '/' ? route += "/:file" : "/:file", (data, app, response, request) => {
            //     response.sendFile(`${path}/${request.params.file}`);
            // }, {logging}, false)
            // this.get(route !== '/' ? route += "/:file/*" : "/:file/*", (data, app, response, request) => {
            //     let file = data.url.substring(route.length);
            //     response.sendFile(`${path}/${file}`);
            // }, {logging}, false)
            this.get(route !== '/' ? route += "/*" : "/*", (data, app, response, request) => {
                response.sendFile(`${path}/${data.afterRoute}`);
            }, {logging}, false)
            this.routes.push({route, dir: path});
        }
    }

    addFile(route, path, logging = true) {
        if (route.substring(0, 1) !== '/'){
            route = '/' + route;
        }
        this.get(route, (data, app, response) => {
            response.sendFile(path);
        }, {logging}, false);
        this.routes.push({route, path});
    }

    use() {
        this.expressUse.push(arguments);
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

    start(callback = this.onStart, replaceEvent = true) {
        if (replaceEvent) {
            this.onStart = callback;
        }
        this.expressUse.forEach(value => {
            this.express.use(...value);
        });
        this.handlers.forEach(handler => {
            switch (handler.type) {
                case "post":
                    this.express.post(handler.route, wrapper(handler));
                    break;
                case "get":
                    this.express.get(handler.route, wrapper(handler));
                    break;
                case "head":
                    this.express.head(handler.route, wrapper(handler));
                    break;
                case "put":
                    this.express.put(handler.route, wrapper(handler));
                    break;
                case "delete":
                    this.express.delete(handler.route, wrapper(handler));
                    break;
                case "options":
                    this.express.options(handler.route, wrapper(handler));
                    break;
                case "connect":
                    this.express.connect(handler.route, wrapper(handler));
                    break;
                case "patch":
                    this.express.patch(handler.route, wrapper(handler));
                    break;
            }
        });
        this.server = this.express.listen(this.config.port, () => {
            let errorFunc = err => {
                return this.logger.error("Error in start" + `\n${err.stack}`);
            };
            try {
                this.logger.initMessage(this.config.name, this.config.version, this.config.port)
                callback(this, errorFunc);
                this.readline.prompt();
                process.on('SIGTERM', () => this.stop());
                process.on('SIGINT', () => this.stop());
            }
            catch (err) {
                errorFunc(err)
            }
        });
    }

    pause(stopRl = false, callback = this.onPause, replaceEvent = true) {
        if (replaceEvent) this.onPause = callback;
        if (stopRl) {
            this.readline.pause();
            this.rlStopped = true;
        }
        if (this.server.closeAllConnections) this.server.closeAllConnections();
        this.server.close(() => callback(this));
    }

    resume(rerunCallback = false, callback = this.onResume, replaceEvent = true) {
        if (replaceEvent) this.onResume = callback;
        this.express = express();
        this.express.use(fileUpload({}));
        if (this.rlStopped) {
            this.readline.resume();
            this.rlStopped = false;
        }
        if (rerunCallback) this.start(() => {
            callback(this);
            this.onStart(this);
        }, false);
        else this.start(callback, false);
    }

    stop(code = 0, callback = this.onStop, replaceEvent = true) {
        if (replaceEvent) this.onStop = callback;
        this.pause(true, () => {
            callback(this);
            process.exit(code);
        }, false);
    }

    restart(rerunCallback = true, callback = this.onRestart, replaceEvent = true) {
        if (replaceEvent) this.onRestart = callback;
        this.pause(true, () => undefined, false);
        this.resume(rerunCallback, callback, false);
    }
}