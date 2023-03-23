function setAll(oldCfg, value){
    let newCfg = {};
    for (let key of Object.keys(oldCfg)){
        newCfg[key] = value;
    }
    return newCfg;
}

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

export function configValidator(oldCfg, newCfg) {
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

export function queryParse(object, parse = true) {
    if (!parse) {
        return object;
    }
    if (typeof object !== "object" || object === null) {
        return object;
    }
    Object.keys(object).forEach(key => {
        let num = Number(object[key]);
        if (!isNaN(num)) {
            object[key] = num;
        }
        else {
            try {
                object[key] = JSON.parse(object[key]);
            }
            catch (err) {
                switch (object[key]) {
                    case "true":
                        object[key] = true;
                        break;
                    case "false":
                        object[key] = false;
                        break;
                    case "null":
                        object[key] = null;
                        break;
                    case "undefined":
                        object[key] = undefined;
                        break;
                    case "NaN":
                        object[key] = NaN;
                        break;
                }
            }
        }
    });
    return object;
}