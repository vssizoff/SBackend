import chalk from "chalk";

function _JsonStringifyColours(object) {
    if (object === null) {
        return [chalk.yellow("null")];
    }
    if (object === undefined) {
        return [chalk.yellow("undefined")];
    }
    let list = []
    if (Array.isArray(object)) {
        list.push("[");
        if (object.length === 0) {
            return ["[]"];
        }
        object.forEach(value => {
            switch (typeof value) {
                case "number":
                    list.push(chalk.blue(`${value}`));
                    break;
                case "string":
                    list.push(chalk.greenBright(`"${value}"`));
                    break;
                // case "symbol":
                //     list.push(chalk.greenBright(`'${value}'`));
                //     break;
                case "boolean":
                    list.push(chalk.yellow(`${value}`));
                    break;
                case "object":
                    let list2 = _JsonStringifyColours(value);
                    // let str = list2[0];
                    list.push(list2[0]);
                    for (let i = 1; i < list2.length - 1; i++) {
                        // str += `\n    ${list2[i]}`;
                        list.push(`    ${list2[i]}`);
                    }
                    if (list2.length >= 2) {
                        list.push(list2[list2.length - 1]);
                    }
                    break;
                case "function":
                    list.push(chalk.magenta("function"));
                    break;
            }
        });
        list.push("]");
    }
    else {
        list.push("{");
        if (Object.keys(object).length === 0) {
            return ["{}"];
        }
        Object.keys(object).forEach(key => {
            switch (typeof object[key]) {
                case "number":
                    list.push(`"${key}": ${chalk.blue(`${object[key]}`)}`);
                    break;
                case "string":
                    list.push(`"${key}": ${chalk.greenBright(`"${object[key]}"`)}`);
                    break;
                case "symbol":
                    list.push(`"${key}": ${chalk.greenBright(`'${object[key]}'`)}`);
                    break;
                case "boolean":
                    list.push(`"${key}": ${chalk.yellow(`${object[key]}`)}`);
                    break;
                case "object":
                    let list2 = _JsonStringifyColours(object[key]);
                    // let str = list2[0];
                    list.push(`"${key}": ${list2[0]}`);
                    for (let i = 1; i < list2.length - 1; i++) {
                        // str += `\n    ${list2[i]}`;
                        list.push(`    ${list2[i]}`);
                    }
                    if (list2.length >= 2) {
                        list.push(list2[list2.length - 1]);
                    }
                    break;
                case "function":
                    list.push(`"${key}": ${chalk.magenta("function")}`);
                    break;
            }
        });
        list.push("}");
    }
    return list;
}

export function stringifyColours(object) {
    if (object === null) {
        return chalk.yellow("null");
    }
    if (object === undefined) {
        return chalk.yellow("undefined");
    }
    if (typeof object !== "object") {
        switch (typeof object) {
            case "number":
                return chalk.blue(`${object}`);
            case "string":
                return chalk.greenBright(`"${object}"`);
            // case "symbol":
            //     return chalk.greenBright(`'${object}'`);
            case "boolean":
                return chalk.yellow(`${object}`);
            case "function":
                return chalk.magenta("function");
            default: return object
        }
    }
    let list = _JsonStringifyColours(object);
    let str = "";
    str += list[0];
    for (let i = 1; i < list.length - 1; i++) {
        str += `\n    ${list[i]}`;
        let last = list[i][list[i].length - 1], next = list[i + 1][list[i + 1].length - 1];
        if (i < list.length - 2 && last !== '{' && last !== '[' && next !== '}' && next !== ']') {
            str += ',';
        }
    }
    if (list.length >= 2) {
        str += `\n${list[list.length - 1]}`;
    }
    return str;
}