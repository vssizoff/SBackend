export function sendHandlersMiddleware(request, response, next) {
    response.sendHandlers = [];
    response.sendHandlers0 = [];
    response.onBeforeSend = func => {
        response.sendHandlers.push(func.bind(this));
    };
    response.onAfterSend = func => {
        response.sendHandlers0.push(func.bind(this));
    };
    let status, handler = res => {
        response.sendHandlers0.forEach(func => func(res, status));
    }, handler0 = res => {
        response.sendHandlers.forEach(func => func(res, status));
    };
    let Status = response.status.bind(response), sendStatus = response.sendStatus.bind(response),
        end = response.end.bind(response), json = response.json.bind(response), jsonp = response.jsonp.bind(response),
        send = response.send.bind(response), sendFile = response.sendFile.bind(response);
    response.status = code => {
        let ans = Status(code);
        status = code;
        return ans;
    };
    response.sendStatus = code => {
        let ans = sendStatus(code);
        status = code;
        return ans;
    };
    response.send = body => {
        handler0(body);
        let ans = send(body);
        handler(body);
        return ans;
    };
    response.end = (body, encoding) => {
        handler0(body);
        let ans = end(body, encoding);
        handler(body);
        return ans;
    };
    response.json = body => {
        handler0(body);
        let ans = json(body);
        handler(body);
        return ans;
    };
    response.jsonp = body => {
        handler0(body);
        let ans = jsonp(body);
        handler(body);
        return ans;
    };
    response.sendFile = (body, options, fn) => {
        handler0(body);
        return sendFile(body, options, error => {
            fn(error);
            handler(body);
        });
    };
    next();
}