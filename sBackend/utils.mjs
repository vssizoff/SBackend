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