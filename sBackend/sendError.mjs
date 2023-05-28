export function sendErrorMiddleware(request, response, next) {
    response.sendError = error => {
        try {
            request.autoLog = false;
            response.status(500);
            response.end(this.config.ifError);
        }
        catch (error) {}
    };
    next();
}