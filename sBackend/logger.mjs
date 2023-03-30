import {File} from "./files.mjs";
import chalk from "chalk";
import * as json from "./json.mjs";
// import * as flatted from "../node_modules/flatted/esm/index.js";

export function fromType(data, object, array = null) {
    switch (typeof data) {
        case "number":
            return chalk.blue(`${data}`);
        case "string":
            return chalk.greenBright(`"${data}"`);
        case "symbol":
            return chalk.greenBright(`'${data}'`);
        case "boolean":
            return chalk.yellow(`${data}`);
        case "object":
            if (array !== null && Array.isArray(data)) {
                return array(data)
            }
            else {
                return object(data)
            }
    }
}

export function colourise(data) {
    if (typeof data === "object" && Array.isArray(data)){
        let str = "";
        data.forEach(elem => {
            str += fromType(elem, () => {return chalk.magenta(json.stringifyColours(elem))}, () => {return chalk.cyan(json.stringifyColours(elem))}) + ' ';
        });
        return str;
    }
}

export function getDate() {
    let date = new Date();
    return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
}

export function logFormat(tag, data) {
    return `${getDate()}: ${tag}: ${data}`;
}

export default class Logger {
    constructor(path) {
        if (path === null) {
            this.file = {write(data){}, read(){}, append(){}};
        }
        else {
            this.file = new File(path)
            this.clear()
        }
    }

    clear() {
        this.file.write("");
    }

    log(data, dataConsole = data) {
        this.file.append(data);
        console.log(dataConsole);
        return data;
    }

    Log(tag, data, dataConsole = data, func = chalk.white) {
        if (typeof data === "object" && typeof dataConsole === "object" && data !== null && dataConsole !== null) {
            return this.Log(tag, json.stringify(data), json.stringifyColours(dataConsole), func);
        }
        if (typeof data === "object" && data !== null) {
            return this.Log(tag, json.stringify(data), dataConsole, func);
        }
        if (typeof dataConsole === "object" && dataConsole !== null) {
            return this.Log(tag, data, json.stringifyColours(dataConsole), func);
        }
        let text = `${getDate()}: ${tag}: `;
        // this.file.append(text + data);
        // console.log(func(text + dataConsole));
        return this.log((this.file.read() === "" ? "" : "\n") + text + data, func('\n' + text + dataConsole));
    }

    message(data, dataConsole = data) {
        // if (typeof data === "object") {
        //     return this.messageObject(data);
        // }
        // let text = `\n${getDate()}: info: ${data}`;
        // this.file.append(text);
        // console.log(text);
        // return text;
        return this.Log("info", data, dataConsole);
    }

    success(data, dataConsole = data) {
        return this.Log("success", data, dataConsole, chalk.green);
    }

    warning(data, dataConsole = data) {
        return this.Log("warn", data, dataConsole, chalk.yellow);
    }

    error(data, dataConsole = data) {
        return this.Log("error", data, dataConsole, chalk.redBright);
    }

    fatal(data, dataConsole = data) {
        return this.Log("fatal", data, dataConsole, chalk.red);
    }

    initMessage(name, version, port) {
        return this.log(`${this.file.read() === "" ? "" : "\n"}--++== ${name} v${version}; port: ${port} ==++--`,
            chalk.greenBright(`\n--++== ${chalk.green(name)} ${chalk.cyan('v' + version)}; port: ${chalk.cyan(port)} ==++--`));
    }

    messageObject(data, dataConsole = data) {
        return this.message(json.stringify(data), json.stringifyColours(dataConsole));
    }

    successObject(data, dataConsole = data) {
        return this.success(json.stringify(data), json.stringifyColours(dataConsole));
    }

    warningObject(data, dataConsole = data) {
        return this.warning(json.stringify(data), json.stringifyColours(dataConsole));
    }

    errorObject(data, dataConsole = data) {
        return this.error(json.stringify(data), json.stringifyColours(dataConsole));
    }

    fatalObject(data, dataConsole = data) {
        return this.fatal(json.stringify(data), json.stringifyColours(dataConsole));
    }

    messageColourise(data) {
        return this.message(json.stringify(data), colourise(data));
    }

    successColourise(data) {
        return this.success(json.stringify(data), colourise(data));
    }

    warningColourise(data) {
        return this.warning(json.stringify(data), colourise(data));
    }

    errorColourise(data) {
        return this.error(json.stringify(data), colourise(data));
    }

    fatalColourise(data) {
        return this.fatal(json.stringify(data), colourise(data));
    }

    request(url, code, request, requestRaw, response, responseRaw) {
        let toLog = `Handled request to `;
        let toLogColours = toLog + chalk.greenBright(url);
        toLog += url;
        if (code !== undefined) {
            toLog += `. Code: ${code}`;
            toLogColours += `. Code: ${chalk.blue(code)}`;
        }
        if (request !== undefined) {
            toLog += `. Request: ${requestRaw}`;
            toLogColours += `. Request: ${chalk.white(json.stringifyColours(request))}`;
        }
        if (response !== undefined) {
            toLog += `. Response: ${responseRaw}`;
            toLogColours += `. Response: ${chalk.white(json.stringifyColours(response))}`;
        }
        return this.Log("request", toLog, toLogColours, chalk.green);
    }

    requestError(url, request, stackTrace, config) {
        let toLog = `Error during handling request to ${url}`;
        let toLogColours = `Error during handling request to ${chalk.greenBright(url)}`;
        if (request !== undefined) {
            toLog += `. Request: ${request}`;
            toLogColours += `. Request: ${json.stringifyColours(config.inputFormat === "object" ? JSON.parse(request) : request)}`
        }
        toLog += `\n${stackTrace}`;
        toLogColours += `\n${stackTrace}`;
        return this.Log("request error", toLog, toLogColours, chalk.redBright);
    }
}