import {configValidator, queryParse} from "./functions.mjs";
import URL from "node:url";

let defaultConfig = {
    post: {
        inputFormat: "object",
        outputFormat: "object",
        parseQuery: false,
        stringQuery: false,
        stringRouteParams: false,
        logging: true,
        logRequest: true,
        logResponse: true,
        ifErr: ""
    },
    formData: {
        inputFormat: "object",
        outputFormat: "object",
        parseQuery: false,
        stringQuery: false,
        stringRouteParams: false,
        logging: true,
        logRequest: true,
        logResponse: true,
        ifErr: ""
    },
    get: {
        inputFormat: "object",
        outputFormat: "object",
        parseQuery: true,
        stringQuery: false,
        stringRouteParams: false,
        logging: true,
        logResponse: true,
        ifErr: ""
    }
};

export function setConfig(newConfig){
    defaultConfig.global = configValidator(defaultConfig.global, newConfig.global);
    defaultConfig.post = configValidator(defaultConfig.global, newConfig.post);
    defaultConfig.formdata = configValidator(defaultConfig.global, newConfig.formdata);
    defaultConfig.get = configValidator(defaultConfig.global, newConfig.get);
}

export function getConfig() {
    return defaultConfig;
}

function defaultHandler(data, app, response, request, errorFunc) { return {code: 200} }

export function post(handler = defaultHandler, route, config = defaultConfig.post) {
    config = configValidator(defaultConfig.post, config);
    return (request, response,  app) => {
        let dataRaw = "";
        let query = "";
        let errorFunc = err => {
            app.logger.requestError(request.url, dataRaw, err.stack, config);
        };
        try {
            request.on("data", chunk => {
                dataRaw += chunk.toString();
            });
            request.on("end", () => {
                try {
                    let data = dataRaw;
                    if (config.inputFormat === "object"){
                        data = JSON.parse(data);
                    }
                    query = queryParse(URL.parse(request.url, config.parseQuery).query, !config.stringQuery);
                    // let a = handler(data, response, app, request.url, query, request);
                    let a = handler({
                        request: data,
                        url: request.url,
                        query,
                        params: queryParse(request.params, !config.stringRouteParams),
                        afterRoute: request.url.substring(route.length - 1)
                    }, app, response, request, errorFunc);
                    let resRaw, res, code;
                    if (a === undefined) {
                        resRaw = undefined;
                        code = undefined;
                    }
                    else {
                        resRaw = a.response;
                        code = a.code;
                    }
                    res = resRaw;
                    if (config.outputFormat === "object" && resRaw !== undefined && typeof resRaw === "object"){
                        res = JSON.stringify(resRaw);
                    }
                    if (code !== undefined) {
                        response.status(code);
                    }
                    if (resRaw !== undefined) {
                        response.end(res);
                    }
                    if (config.logging) {
                        app.logger.request(request.url, code, data, dataRaw, res, resRaw)
                    }
                }
                catch (err) {
                    errorFunc(err);
                    response.status(500);
                    response.end(config.ifErr);
                }
            });
        }
        catch (err) {
            errorFunc(err);
            response.status(500);
            response.end(config.ifErr);
        }
    }
}

export function get(handler = defaultHandler, route, config = defaultConfig.get) {
    config = configValidator(defaultConfig.get, config);
    return (request, response, app) => {
        let query = "";
        let errorFunc = err => {
            app.logger.requestError(request.url, undefined, err.stack, config);
        };
        try {
            query = queryParse(URL.parse(request.url, config.parseQuery).query, !config.stringQuery);
            // let a = handler(response, query, app, request.url, request);
            let a = handler({
                url: request.url,
                query,
                params: queryParse(request.params, !config.stringRouteParams),
                afterRoute: request.url.substring(route.length - 1)
            }, app, response, request, errorFunc)
            let resRaw, res, code;
            if (a === undefined) {
                resRaw = undefined;
                code = undefined;
            }
            else {
                resRaw = a.response;
                code = a.code;
            }
            res = resRaw
            if (config.outputFormat === "object" && resRaw !== undefined && typeof resRaw === "object"){
                res = JSON.stringify(resRaw);
            }
            if (code !== undefined) {
                response.status(code);
            }
            if (resRaw !== undefined) {
                response.end(res);
            }
            if (config.logging) {
                app.logger.request(request.url, code, undefined, undefined, res, resRaw)
            }
        }
        catch (err) {
            errorFunc(err);
            response.status(500);
            response.end(config.ifErr);
        }
    }
}

export function formData(handler = defaultHandler, route, config = defaultConfig.formData) {
    config = configValidator(defaultConfig.formData, config);
    return (request, response, app) => {
        let query = "", data;
        let errorFunc = err => {
            app.logger.requestError(request.url, JSON.stringify(data), err.stack, config);
        };
        try {
            data = queryParse(request.body);
            query = queryParse(URL.parse(request.url, config.parseQuery).query, !config.stringQuery);
            // let a = handler(data, request.files, response, query, app, request.url, request);
            let a = handler({
                request: data,
                files: request.files,
                url: request.url,
                query,
                params: queryParse(request.params, !config.stringRouteParams),
                afterRoute: request.url.substring(route.length - 1)
            }, app, response, request, errorFunc)
            let resRaw, res, code;
            if (a === undefined) {
                resRaw = undefined;
                code = undefined;
            }
            else {
                resRaw = a.response;
                code = a.code;
            }
            res = resRaw;
            if (config.outputFormat === "object" && resRaw !== undefined && typeof resRaw === "object"){
                res = JSON.stringify(resRaw);
            }
            if (code !== undefined) {
                response.status(code);
            }
            if (resRaw !== undefined) {
                response.end(res);
            }
            if (config.logging) {
                app.logger.request(request.url, code, data, JSON.stringify(data), res, resRaw)
            }
        }
        catch (err) {
            errorFunc(err);
            response.status(500);
            response.end(config.ifErr);
        }
    }
}