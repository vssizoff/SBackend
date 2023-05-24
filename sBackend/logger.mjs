import {File} from "./files.mjs";
import chalk from "chalk";
import * as flatted from "flatted";

export function getDate() {
    let date = new Date();
    return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
}

export default class Logger {
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

    logSeparately(consoleData, fileData) {
        console.log(...consoleData);
        this.file.append(...fileData);
    }

    getPrefix(tag) {
        return `${getDate()}: ${tag}:`;
    }

    Log(tag, func = chalk.white, ...data) {
        let prefix = this.getPrefix(tag);
        this.logSeparately(['\n' + func(prefix), ...data.map((elem) => {
            return typeof elem !== "string" ? elem : func(elem);
        })], [(this.file.read() === "" ? "" : "\n") + prefix, ...data.map(flatted.stringify)]);
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

    request(url, code, request, response) {
        request = typeof request === "string" ? request.replaceAll("\n", "\\n") : request;
        response = typeof response === "string" ? response.replaceAll("\n", "\\n") : response;
        let toLog = ['\n' + this.getPrefix("request"), `Handled request to`];
        let toLogColours = [...toLog, chalk.greenBright(url)];
        toLog.push(url);
        if (code !== undefined) {
            toLog.push(". Code:", code);
            toLogColours.push(". Code:", code);
        }
        if (request !== undefined) {
            toLog.push(". Request:", typeof request === "string" ? `"${request}"` : request);
            toLogColours.push(". Request:", typeof request === "string" ? chalk.cyan(`"${request}"`) : request);
        }
        if (response !== undefined) {
            toLog.push(". Response:", typeof response === "string" ? `"${response}"` : response);
            toLogColours.push(". Response:", typeof response === "string" ? chalk.cyan(`"${response}"`) : response);
        }
        this.logSeparately(toLogColours.map(elem => typeof elem === "string" ? chalk.green(elem) : elem), toLog);
    }

    requestError(url, request, stackTrace) {
        request = typeof request === "string" ? request.replaceAll("\n", "\\n") : request;
        let toLog = ['\n' + this.getPrefix("request"), `Error during handling request to`];
        let toLogColours = [...toLog, chalk.greenBright(url)];
        toLog.push(url);
        if (request !== undefined) {
            toLog.push(". Request:", typeof request === "string" ? `"${request}"` : request);
            try {
                toLogColours.push(`. Request:`, typeof request === "string" ? chalk.cyan(`"${request}"`) : request);
            }
            catch (err) {
                toLogColours.push(`. Request:`, typeof request === "string" ? chalk.cyan(`"${request}"`) : request);
            }
        }
        toLog.push(`\n${stackTrace}`);
        toLogColours.push(`\n${stackTrace}`);
        this.logSeparately(toLogColours.map(elem => typeof elem === "string" ? chalk.redBright(elem) : elem), toLog);
    }
}