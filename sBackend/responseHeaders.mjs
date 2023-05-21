export function responseHeadersMiddleware(request, response) {
    response.headers = {};
    response.onBeforeSend(() => response.set(response.headers));
    return true;
}