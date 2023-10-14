export function requestLoggerMiddleware(request, response, next) {
    response.onAfterSend((res, status) => {
        if (request.autoLogFull === undefined ? this.config.handlerConfig.autoLogFull : request.autoLogFull) {
            this.logger.requestFull(request.url, status ?? 200, request.body, res);
        }
        else if (request.autoLog === undefined ? this.config.handlerConfig.autoLog : request.autoLog) {
            this.logger.request(request.url, status ?? 200);
        }
    });
    next();
}