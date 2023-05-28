export function sendHandlersMiddleware(request, response, next) {
    response.sendHandlers = [];
    response.sendHandlers0 = [];
    response.onBeforeSend = func => {
        response.sendHandlers.push(func.bind(this));
    };
    response.onAfterSend = func => {
        response.sendHandlers0.push(func.bind(this));
    };
    let status, handler = (res, end) => {
        response.sendHandlers0.forEach(func => func(res, status, end));
    }, handler0 = (res, end) => {
        response.sendHandlers.forEach(func => func(res, status, end));
    };
    response.onStatusChange(newStatus => status = newStatus);
    let end = response.end.bind(response), json = response.json, jsonp = response.jsonp.bind(response),
        send = response.send, sendFile = response.sendFile;
    response.send = body => {
        handler0(body, false);
        let func = response.send, func0 = response.end;
        response.send = send;
        response.end = end;
        let ans = send.bind(response)(body);
        response.send = func;
        response.end = func0;
        handler(body, false);
        return ans;
    };
    response.end = (body, encoding) => {
        handler0(body, true);
        let ans = end(body, encoding);
        handler(body, true);
        return ans;
    };
    // response.json = body => {
    //     handler0(body);
    //     let ans = json(body);
    //     handler(body);
    //     return ans;
    // };
    // response.jsonp = body => {
    //     handler0(body);
    //     let ans = jsonp(body);
    //     handler(body);
    //     return ans;
    // };
    response.sendFile = (body, options, fn) => {
        handler0(body);
        let func = response.end;
        response.end = end;
        return sendFile.bind(response)(body, options, error => {
            if (fn !== undefined && typeof fn === "function") fn(error);
            handler(body, false);
            response.end = func;
        });
    };
    next();
}