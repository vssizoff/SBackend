export function endJSONMiddleware(request, response, next) {
    let end = response.end.bind(response);
    response.end = (body, encoding) => {
        if (typeof body === "object" && !(body instanceof Buffer)) {
            body = JSON.safeStringify(body);
            response.set({
                "content-type": "application/json"
            });
        }
        return end(body, encoding);
    };
    next();
}