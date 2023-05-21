export default function (app, func, route) {
    func = func.bind(app);
    return function (request, response, next) {
        if (route !== undefined) {
            request.afterRoute = request.url.substring(route.length - 1);
        }
        try {
            let ans = func(request, response, next);
            if (ans) next();
        }
        catch (error) {
            app.logger.requestError(request.url, request.body, error.stack);
            response.sendError(error);
        }
    }
}