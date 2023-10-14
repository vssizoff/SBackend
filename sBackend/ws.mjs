import {requestBodyParser} from "./requestBodyParser.mjs";

export function wsMiddleware(request, response, next) {
    if (!("accept" in response && "reject" in response)) return next();
    let accept = response.accept.bind(response), reject = response.reject.bind(response);
    response.accept = async (...args) => {
        let connection = await accept(...args);
        let on = connection.on.bind(connection), send = connection.send.bind(connection),
            terminate = connection.terminate.bind(connection);
        connection.on = (...args) => {
            if (args.length <= 0 || args[0] !== "message") return on(...args);
            return on(...args.map(elem => (typeof elem === "function" ? ((rawData, isBinary) => {
                let data = rawData;
                try {
                    if (!isBinary) data = requestBodyParser(data.toString());
                    if (request.autoLogWsFull === undefined ? this.config.handlerConfig.autoLogWsFull : request.autoLogWsFull) {
                        this.logger.wsInputFull(request.baseUrl, data);
                    }
                    else if (request.autoLogWs === undefined ? this.config.handlerConfig.autoLogWs : request.autoLogWs) {
                        this.logger.wsInput(request.baseUrl);
                    }
                    return elem(data, isBinary, rawData);
                }
                catch (error) {
                    try {
                        this.logger.wsError(request.baseUrl, data, error.stack);
                        let {autoLogWs, autoLogWsFull} = request;
                        request.autoLogWs = false;
                        request.autoLogWsFull = false;
                        this.config.handlerConfig.onWsHandlingError.apply(this, [data, connection, this.config.handlerConfig, error]);
                        request.autoLogWs = autoLogWs;
                        request.autoLogWsFull = autoLogWsFull;
                    }
                    catch (error) {}
                }
            }) : elem)));
        }
        connection.send = (body) => {
            if (request.autoLogWsFull === undefined ? this.config.handlerConfig.autoLogWsFull : request.autoLogWsFull) {
                this.logger.wsOutputFull(request.baseUrl, body);
            }
            else if (request.autoLogWs === undefined ? this.config.handlerConfig.autoLogWs : request.autoLogWs) {
                this.logger.wsOutput(request.baseUrl);
            }
            if (typeof body === "object" && !(body instanceof Buffer || body instanceof ArrayBuffer)) {
                body = JSON.safeStringify(body);
            }
            send(body);
        }
        connection.on("close", () => {
            if (request.autoLogWsFull ?? request.autoLogWs ?? (this.config.handlerConfig.autoLogWsFull || this.config.handlerConfig.autoLogWs)) {
                this.logger.wsClose(request.baseUrl);
            }
        });
        connection.terminate = (...args) => {
            if (request.autoLogWsFull ?? request.autoLogWs ?? (this.config.handlerConfig.autoLogWsFull || this.config.handlerConfig.autoLogWs)) {
                this.logger.wsTerminate(request.baseUrl);
            }
            return terminate(...args);
        }
        if (request.autoLogWsFull ?? request.autoLogWs ?? (this.config.handlerConfig.autoLogWsFull || this.config.handlerConfig.autoLogWs)) {
            this.logger.wsConnected(request.baseUrl);
        }
        return connection;
    }
    response.reject = (...args) => {
        if (request.autoLogWsFull ?? request.autoLogWs ?? (this.config.handlerConfig.autoLogWsFull || this.config.handlerConfig.autoLogWs)) {
            this.logger.wsRejected(request.baseUrl);
        }
        return reject(...args);
    }
    next();
}