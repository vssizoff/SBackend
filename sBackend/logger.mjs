import {File} from "./utils.mjs";
import chalk from "chalk";

export function getDate() {
    let date = new Date();
    return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
}

export default class Logger {
    constructor(path, log) {
        this.log = log;
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
        this.log(...consoleData);
        this.file.append(...fileData);
    }

    getPrefix(tag) {
        return `${getDate()}: ${tag}:`;
    }

    Log(tag, func = chalk.white, ...data) {
        let prefix = this.getPrefix(tag);
        this.logSeparately([func(prefix), ...data.map((elem) => {
            return typeof elem !== "string" ? elem : func(elem);
        })], [(this.file.read() === "" ? "" : "\n") + prefix, ...data.map(elem => typeof elem === "object" ?
            JSON.safeStringify(elem, undefined, 2) : elem)]);
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

    requestFull(url, code, request, response) {
        request = typeof request === "string" ? request.replaceAll("\n", "\\n") : request;
        response = typeof response === "string" ? response.replaceAll("\n", "\\n") : response;
        let toLog = ['\n' + this.getPrefix("request"), `Handled request to`];
        let toLogColours = [...toLog, chalk.cyan(url)];
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

    request(url, code) {
        let toLog = ['\n' + this.getPrefix("request"), `Handled request to`];
        let toLogColours = [...toLog, chalk.cyan(url)];
        toLog.push(url);
        if (code !== undefined) {
            toLog.push(". Code:", code);
            toLogColours.push(". Code:", code);
        }
        this.logSeparately(toLogColours.map(elem => typeof elem === "string" ? chalk.green(elem) : elem), toLog);
    }

    requestError(url, request, stackTrace) {
        request = typeof request === "string" ? request.replaceAll("\n", "\\n") : request;
        let toLog = [this.getPrefix("request"), `Error during handling request to`];
        let toLogColours = [...toLog, chalk.cyan(url)];
        toLog[0] = '\n' + toLog[0];
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

    wsConnected(url) {
        let prefix = this.getPrefix("wsConnected");
        this.logSeparately([chalk.green(prefix), chalk.green("Websocket connected on url"), chalk.cyan(url)], ['\n' + prefix, "Websocket connected on url", url]);
    }

    wsRejected(url) {
        let prefix = this.getPrefix("wsRejected");
        this.logSeparately([chalk.red(prefix), chalk.red("Websocket rejected on url"), chalk.cyan(url)], ['\n' + prefix, "Websocket rejected on url", url]);
    }

    wsInputFull(url, data) {
        let prefix = this.getPrefix("wsInput");
        this.logSeparately([chalk.green(prefix), chalk.green("Websocket connection on url"),
            chalk.cyan(url), chalk.green("has sent message"), (typeof data === "string" ? chalk.cyan(`"${data}"`) : data)],
            ['\n' + prefix, "Websocket connection on url", url, "has sent message",
                (typeof data === "string" ? `"${data}"` : data)]);
    }

    wsInput(url) {
        let prefix = this.getPrefix("wsInput");
        this.logSeparately([chalk.green(prefix), chalk.green("Websocket connection on url"),
                chalk.cyan(url), chalk.green("has sent message")],
            ['\n' + prefix, "Websocket connection on url", url, "has sent message"]);
    }

    wsOutputFull(url, data) {
        let prefix = this.getPrefix("wsOutput");
        this.logSeparately([chalk.green(prefix), chalk.green("Server has sent message"),
            (typeof data === "string" ? chalk.cyan(`"${data}"`) : data), chalk.green("to websocket connection on url"),
            chalk.cyan(url)], ['\n' + prefix, "Server has sent message", (typeof data === "string" ? `"${data}"` : data),
            "to websocket connection on url", url]);
    }

    wsOutput(url) {
        let prefix = this.getPrefix("wsOutput");
        this.logSeparately([chalk.green(prefix), chalk.green("Server has sent message"),
            chalk.green("to websocket connection on url"), chalk.cyan(url)],
            ['\n' + prefix, "Server has sent message", "to websocket connection on url", url]);
    }

    wsError(url, data, stackTrace) {
        data = typeof data === "string" ? data.replaceAll("\n", "\\n") : data;
        let toLog = [this.getPrefix("data"), `Error during handling websocket input to`];
        let toLogColours = [...toLog, chalk.cyan(url)];
        toLog[0] = '\n' + toLog[0];
        toLog.push(url);
        if (data !== undefined) {
            toLog.push(". Data:", typeof data === "string" ? `"${data}"` : data);
            try {
                toLogColours.push(`. Data:`, typeof data === "string" ? chalk.cyan(`"${data}"`) : data);
            }
            catch (err) {
                toLogColours.push(`. Data:`, typeof data === "string" ? chalk.cyan(`"${data}"`) : data);
            }
        }
        toLog.push(`\n${stackTrace}`);
        toLogColours.push(`\n${stackTrace}`);
        this.logSeparately(toLogColours.map(elem => typeof elem === "string" ? chalk.redBright(elem) : elem), toLog);
    }
}