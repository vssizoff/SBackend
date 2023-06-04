import URL from "node:url";

export function parseObjectTypes(object) {
    if (typeof object !== "object" || object === null) {
        return object;
    }
    Object.keys(object).forEach(key => {
        let num = Number(object[key]);
        if (!isNaN(num)) {
            object[key] = num;
        }
        else {
            try {
                object[key] = JSON.parse(object[key]);
            }
            catch (err) {
                switch (object[key]) {
                    case "true":
                        object[key] = true;
                        break;
                    case "false":
                        object[key] = false;
                        break;
                    case "null":
                        object[key] = null;
                        break;
                    case "undefined":
                        object[key] = undefined;
                        break;
                    case "NaN":
                        object[key] = NaN;
                        break;
                }
            }
        }
    });
    return object;
}

export function queryParserMiddleware(request, response, next) {
    request.parsedQuery = parseObjectTypes(URL.parse(request.url, true).query);
    request.stringQuery = parseObjectTypes(URL.parse(request.url, false).query);
    request.query = request.parsedQuery;
    next();
}

export function headersParserMiddleware(request, response, next) {
    request.stringHeaders = JSON.parse(JSON.stringify(request.headers));
    request.parsedHeaders = parseObjectTypes(request.headers);
    request.headers = request.parsedHeaders;
    next();
}

export function routeParamsParserMiddleware(request, response, next) {
    request.stringParams = JSON.parse(JSON.stringify(request.params));
    request.parsedParams = parseObjectTypes(request.params);
    request.params = request.parsedParams;
    next();
}