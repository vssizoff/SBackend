function configValidatorBody(oldCfg, newCfg){
    for (let key of Object.keys(oldCfg)){
        if (key in newCfg && oldCfg[key] !== null && typeof oldCfg[key] === "object"){
            if (typeof newCfg[key] === "object" && newCfg[key] !== null){
                newCfg[key] = configValidatorBody(oldCfg[key], newCfg[key]);
            }
            else {
                newCfg[key] = setAll(oldCfg[key], newCfg[key]);
            }
        }
        else if (!(key in newCfg)){
            // console.log(Object.keys(newCfg));
            // console.log(key in newCfg);
            newCfg[key] = oldCfg[key]
        }
    }
    return newCfg;
}

function configValidator(oldCfg, newCfg) {
    if (oldCfg !== undefined && newCfg !== undefined){
        return configValidatorBody(oldCfg, newCfg)
    }
    else if (oldCfg !== undefined){
        return oldCfg;
    }
    else if (newCfg !== undefined){
        return newCfg;
    }
    else {
        return {};
    }
}

String.prototype.replaceAt = function(index, replacement) {
    return this.substring(0, index) + replacement + this.substring(index + replacement.length);
}

function Query(query) {
    let str = "";
    Object.keys(query).forEach(key => {
        str += `&${key}=${query[key]}`;
    });
    str = str.replaceAt(0, '?');
    return str;
}

// function listener2(request, response, data, onSuccess) {
//     onSuccess(data, response.code, response.headers, response)
// }

function listener(request, outputType, onSuccess, onError) {
    request.then(response => {
        switch (outputType) {
            case "object":
                response.json().then(data => {onSuccess(data, response.code, response.headers, response)});
                break;
            case "text":
                response.text().then(data => {onSuccess(data, response.code, response.headers, response)});
                break;
            case "blob":
                response.blob().then(data => {onSuccess(data, response.code, response.headers, response)});
                break;
            default:
                onSuccess(null, response.code, response.headers, response);
        }
    });
    request.catch(error => {
        onError(error);
    });
}

let defaultCfg = {
    onSuccess(data, status, headers, response) {
        console.log(data);
    },
    onError(data, status, headers, response) {
        console.error("Request error");
        // console.error(status);
        console.error(data);
    },
    query: null,
    outputType: "object",
    headers: {}
};

function get(url, options = defaultCfg) {
    let {onSuccess, onError, query, outputType, headers} = configValidator(defaultCfg, options);

    if (query != null && query !== {} && typeof query === "object"){
        url = url + Query(query);
    }

    let request = fetch(url, {method: "GET", headers});

    listener(request, outputType, onSuccess, onError);
}

function post(url, body, options = defaultCfg) {
    let {onSuccess, onError, query, outputType, headers} = configValidator(defaultCfg, options);

    if (query != null && query !== {} && typeof query === "object"){
        url = url + Query(query);
    }

    let request = fetch(url, {
        method: "POST",
        body: typeof body === "object" ? JSON.stringify(body) : body,
        headers
    });

    listener(request, outputType, onSuccess, onError);
}

function formData(url, body, options = defaultCfg) {
    let formdata = new FormData();
    Object.keys(body).forEach(key => {
        formdata.append(key, body[key])
    });

    let {onSuccess, onError, query, outputType, headers} = configValidator(defaultCfg, options);

    if (query != null && query !== {} && typeof query === "object"){
        url = url + Query(query);
    }

    let request = fetch(url, {
        method: "POST",
        body: formdata,
        headers
    });

    listener(request, outputType, onSuccess, onError);
}