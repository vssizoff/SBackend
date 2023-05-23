export function statusChangeHandlersMiddleware(request, response) {
    response.statusChangeHandlers = [];
    response.onStatusChange = func => {
        response.statusChangeHandlers.push(func.bind(this));
    }
    let oldStatus;
    function onStatusChange(newStatus) {
        response.statusChangeHandlers.forEach(func => func(newStatus, oldStatus));
        oldStatus = newStatus;
    }
    let status = response.status.bind(response), sendStatus = response.sendStatus.bind(response);
    response.status = code => {
        let ans = status(code);
        onStatusChange(code);
        return ans;
    };
    response.sendStatus = code => {
        let ans = sendStatus(code);
        onStatusChange(code);
        return ans;
    };
    return true;
}