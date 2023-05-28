export function endJSONMiddleware(request, response, next) {
    let end = response.end.bind(response);
    response.end = (body, encoding) => {
        return end(typeof body === "object" && !(body instanceof Buffer) ? JSON.safeStringify(body) : body, encoding);
    };
    next();
}