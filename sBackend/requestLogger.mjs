export function autoLogEnable(request, response, next) {
    request.autoLog = true;
    next();
}

export function requestLoggerMiddleware(request, response, next) {
    response.onAfterSend((res, status) => {
        this.logger.request(request.url, status, request.body, res);
    });
    next();
}