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
    onStart = [];
    onPause = [];
    onResume = [];
    onStop = [];
    onRestart = [];
    defaultKeyboardHandler = answer => undefined;

    constructor(config = defaultConfig) {
        this.use(fileUpload({}));
        this.setConfig(config);
        this.initRl();
    }

    on(event = "start" || "pause" || "resume" || "stop" || "restart", callback = undefined) {
        if (callback === undefined || typeof callback !== "function") return;
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

    addFilesJson(files, pathResolve, logging = true) {
        Object.keys(files).forEach(route => {
            this.addFile(route, pathResolve(files[route]), logging);
        });
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

    start(callback = undefined, runEvents = true) {
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