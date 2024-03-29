export function autoNext(request, response, next, route, ans) {
    if (ans === true) {next();}
}

export function afterRoute(request, response, next, route) {
    if (route !== undefined) {
        request.afterRoute = request.url.substring(route.length - 1);
    }
}

export function wrapper(app, func, route) {
    func = func.bind(app);
    return async function (request, response, next) {
        let beforeHandlers = app.wrapperBeforeHandlers, afterHandlers = app.wrapperAfterHandlers;
        try {
            beforeHandlers.forEach(func => func.bind(app)(request, response, next, route));
            let ans = func(request, response, next);
            if (ans instanceof Promise) ans = await ans;
            afterHandlers.forEach(func => {
                let tmp = func.bind(app)(request, response, next, route, ans);
                if (tmp !== undefined) ans = tmp;
            });
        }
        catch (error) {
            app.logger.requestError(request.url, request.body, "stack" in error ? error.stack : JSON.stringify(error));
            response.sendError(error);
        }
    }
}

export function handlersFormat(handlers, app) {
    if (typeof handlers === "function") {
        return handlersFormat(handlers(app), app)
    }
    if (typeof handlers !== "object" || Object.keys(handlers).length === 0) return {};
    let object = {};
    Object.keys(handlers).forEach(key => object[key.toLowerCase()] = handlers[key]);
    return object;
}