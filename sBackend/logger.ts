import {File} from "./files.js";
import chalk from "chalk";
import * as json from "./json.js";

export function fromType(data: string, object, array = null) {
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
    file: {
        write: (data: string) => void,
        read: () => string,
        append: (...data) => void
    }

    constructor(path) {
        if (path === null) {
            this.file = {write(){}, read(){return ""}, append(){}};
        }
        else {
            this.file = new File(path)
            this.clear()
        }
    }

    clear() {
        this.file.write("");
    }

    logSeparately(consoleData: Array<any>, fileData: Array<any>) {
        console.log(...consoleData);
        this.file.append(...fileData);
    }

    getPrefix(tag: string): string {
        return `${getDate()}: ${tag}: `;
    }

    Log(tag, func = chalk.white, ...data) {
        let prefix = this.getPrefix(tag);
        this.logSeparately(['\n', func(prefix), func(data)], [(this.file.read() === "" ? "" : "\n"), prefix, data]);
    }

    message(...data) {
        return this.Log("info", chalk.white, ...data);
    }

    success(...data) {
        return this.Log("success", chalk.green, ...data);
    }

    warning(...data) {
        return this.Log("warn", chalk.yellow, ...data);
    }

    error(...data) {
        return this.Log("error", chalk.redBright, ...data);
    }

    fatal(...data) {
        return this.Log("fatal", chalk.red, ...data);
    }

    initMessage(name, version, port) {
        this.logSeparately([chalk.greenBright(`\n--++== ${chalk.green(name)} ${chalk.cyan('v' + version)}; port: ${chalk.cyan(port)} ==++--`)],
            [`${this.file.read() === "" ? "" : "\n"}--++== ${name} v${version}; port: ${port} ==++--`]);
    }

    request(url, code, request, requestRaw, response, responseRaw) {
        let toLog = [this.getPrefix("request"), `Handled request to`, url];
        let toLogColours = [toLog, chalk.greenBright(url)];
        if (code !== undefined) {
            // toLog += `. Code: ${code}`;
            // toLogColours += `. Code: ${chalk.blue(code)}`;
            toLog.push(". Code:", code);
            toLogColours.push(". Code:", chalk.blue(code));
        }
        if (request !== undefined) {
            // toLog += `. Request: ${requestRaw}`;
            // toLogColours += `. Request: ${chalk.white(json.stringifyColours(request))}`;
            toLog.push(". Request:", requestRaw);
            toLogColours.push(". Request:", request);
        }
        if (response !== undefined) {
            // toLog += `. Response: ${response}`;
            // toLogColours += `. Response: ${chalk.white(json.stringifyColours(responseRaw))}`;
            toLog.push(". Response:", response);
            toLogColours.push(". Response:", responseRaw);
        }
        // return this.Log("", chalk.green, toLog, toLogColours);
        this.logSeparately(toLogColours, toLog);
    }

    requestError(url, request, stackTrace, config) {
        let prefix = this.getPrefix("request error");
        let toLog = `Error during handling request to ${url}`;
        let toLogColours = `Error during handling request to ${chalk.greenBright(url)}`;
        if (request !== undefined) {
            toLog += `. Request: ${request}`;
            try {
                toLogColours += `. Request: ${json.stringifyColours(config.inputFormat === "object" ? JSON.parse(request) : request)}`
            }
            catch (err) {
                toLogColours += `. Request: ${json.stringifyColours(request)}`
            }
        }
        toLog += `\n${stackTrace}`;
        toLogColours += `\n${stackTrace}`;
        // return this.Log("", chalk.redBright, toLog, toLogColours);
        this.logSeparately([prefix, toLogColours], [prefix, toLog]);
    }
}