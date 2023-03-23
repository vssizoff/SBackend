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
                case "symbol":
                    list.push(chalk.greenBright(`'${value}'`));
                    break;
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
                    list.push(list2[list2.length - 1]);
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
                    list.push(list2[list2.length - 1]);
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
            case "symbol":
                return chalk.greenBright(`'${object}'`);
            case "boolean":
                return chalk.yellow(`${object}`);
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
    str += `\n${list[list.length - 1]}`;
    return str;
}

function _JsonStringify(object, indent = "    ") {
    if (object === null) {
        return ["null"];
    }
    if (object === undefined) {
        return ["undefined"];
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
                    list.push(`${value}`);
                    break;
                case "string":
                    list.push(`"${value}"`);
                    break;
                case "symbol":
                    list.push(`'${value}'`);
                    break;
                case "boolean":
                    list.push(`${value}`);
                    break;
                case "object":
                    let list2 = _JsonStringify(value);
                    list.push(list2[0]);
                    for (let i = 1; i < list2.length - 1; i++) {
                        list.push(`${indent}${list2[i]}`);
                    }
                    list.push(list2[list2.length - 1]);
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
                    list.push(`"${key}": ${object[key]}`);
                    break;
                case "string":
                    list.push(`"${key}": "${object[key]}"`);
                    break;
                case "symbol":
                    list.push(`"${key}": '${object[key]}'`);
                    break;
                case "boolean":
                    list.push(`"${key}": ${object[key]}`);
                    break;
                case "object":
                    let list2 = _JsonStringify(object[key], indent);
                    // let str = list2[0];
                    list.push(`"${key}": ${list2[0]}`);
                    for (let i = 1; i < list2.length - 1; i++) {
                        // str += `\n    ${list2[i]}`;
                        list.push(`    ${list2[i]}`);
                    }
                    list.push(list2[list2.length - 1]);
                    break;
                case "function":
                    list.push(`"${key}": function`);
                    break;
            }
        });
        list.push("}");
    }
    return list;
}

export function stringify(object, indent = "    ", endl = true) {
    if (object === null) {
        return "null";
    }
    if (object === undefined) {
        return "undefined";
    }
    if (typeof object !== "object") {
        switch (typeof object) {
            case "number":
                return `${object}`;
            case "string":
                return `"${object}"`;
            case "symbol":
                return `'${object}'`;
            case "boolean":
                return `${object}`;
            default: return object
        }
    }
    let list = _JsonStringify(object, indent);
    let str = "";
    str += list[0];
    for (let i = 1; i < list.length - 1; i++) {
        str += `${endl ? '\n' : ""}${indent}${list[i]}`;
        let last = list[i][list[i].length - 1], next = list[i + 1][list[i + 1].length - 1];
        if (i < list.length - 2 && last !== '{' && last !== '[' && next !== '}' && next !== ']') {
            str += ',';
        }
    }
    str += `${endl ? '\n' : ""}${list[list.length - 1]}`;
    return str;
}

export function stringifyString(object) {
    return stringify(object, "", false);
}

export function stringifyAllTypes(object) {
    return {
        normal: stringify(object),
        string: stringifyString(object),
        colours: stringifyColours(object)
    }
}