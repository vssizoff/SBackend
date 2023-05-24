export function autoLogEnable(request, response, next) {
    request.autoLog = true;
    next();
}

export function requestLoggerMiddleware(request, response, next) {
    response.onAfterSend((res, status) => {
        this.logger.request(request.url, status, typeof request.body === "string" ? request.body.replaceAll("\n", "\\n") : request.body,
            typeof res === "string" ? res.replaceAll("\n", "\\n") : res);
    });
    next();
}