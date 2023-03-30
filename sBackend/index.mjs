import express from "express";
import {configValidator} from "./functions.mjs";
import Logger from "./logger.mjs"
import Handler from "./handler.mjs";
import fileUpload from "express-fileupload";

let defaultConfig = {
    port: 8080,
    name: "app",
    version: "0.0.0",
    logPath: null,
    fileUploader: false,
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
        if (key !== "post" && key !== "formData") {
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
    constructor(config = defaultConfig) {
        this.express = express();
        this.handlers = []
        this.routes = []
        this.express.use(fileUpload({}));
        this.setConfig(config);
    }

    setConfig(config = defaultConfig) {
        this.config = configValidator(defaultConfig, config);
        this.logger = new Logger(this.config.logPath);
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

    addFolder(route, path, logging = true){
        if (route !== null && typeof route === "string" && route.length > 0 && path !== null && typeof path === "string" && path.length > 0){
            if (route.substring(0, 1) !== '/'){
                route = '/' + route;
            }
            // this.express.use(route, express.static(path));
            this.get(route !== '/' ? route += "/:file" : "/:file", (data, app, response, request) => {
                response.sendFile(`${path}/${request.params.file}`);
            }, {logging}, false)
            this.get(route !== '/' ? route += "/:file/*" : "/:file/*", (data, app, response, request) => {
                let file = data.url.substring(route.length);
                response.sendFile(`${path}/${file}`);
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

    rawPost(route, callback, config = defaultConfig.handlerConfig) {
        this.addHandler(route, "post", callback, {...config, wrapper: "raw"})
    }

    rawGet(route, callback, config = defaultConfig.handlerConfig) {
        this.addHandler(route, "get", callback, {...config, wrapper: "raw"})
    }

    start(callback = app => null) {
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
        this.express.listen(this.config.port, () => {
            // this.logger.message(`Server working on port ${this.config.port}`)
            let errorFunc = err => {
                // let toLog = `Error in start`;
                // let toLogColours = `Error in start`;
                // toLog += `\n${err.stack}`;
                // toLogColours += `\n${err.stack}`;
                // return this.logger.Log("request error", toLog, toLogColours, chalk.redBright);
                return this.logger.error("Error in start" + `\n${err.stack}`);
            };
            try {
                this.logger.initMessage(this.config.name, this.config.version, this.config.port)
                callback(this, errorFunc);
            }
            catch (err) {
                errorFunc(err)
            }
        });
    }
}