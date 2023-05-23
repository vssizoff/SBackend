export function responseHeadersMiddleware(request, response) {
    response.headers = {};
    response.onBeforeSend(() => {
        if (response.headers !== {}) {
            response.set(response.headers);
        }
    });
    return true;
}