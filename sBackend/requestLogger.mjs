export function requestLoggerMiddleware(request, response, next) {
    response.onAfterSend((res, status) => {
        if (request.autoLog === undefined ? this.config.handlerConfig.autoLog : request.autoLog) {
            this.logger.request(request.url, status, request.body, res);
        }
    });
    next();
}