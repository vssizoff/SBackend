export function sendErrorMiddleware(text) {
    return function (request, response, next) {
        response.sendError = error => {
            try {
                request.autoLog = false;
                response.status(500);
                response.end(text);
            }
            catch (error) {}
        };
        next();
    }
}