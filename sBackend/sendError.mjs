export function sendErrorMiddleware(request, response, next) {
    response.sendError = error => {
        try {
            let {autoLog, autoLogFull} = request;
            request.autoLog = false;
            request.autoLogFull = false;
            response.status(500);
            this.config.handlerConfig.onRequestHandlingError.apply(this, [request, response, this.config.handlerConfig, error]);
            request.autoLog = autoLog;
            request.autoLogFull = autoLogFull;
        }
        catch (error) {}
    };
    next();
}