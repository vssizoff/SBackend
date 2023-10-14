// export type handlerConfigType = {
//     wrapper?: string,
//     inputFormat?: string,
//     outputFormat?: string,
//     parseQuery?: boolean,
//     stringQuery?: boolean,
//     stringRouteParams?: boolean,
//     stringHeaders?: boolean,
//     logging?: boolean,
//     logRequest?: boolean,
//     logResponse?: boolean,
//     ifErr?: string,
//     type?: string
// };
//
// export type configType = {
//     port?: number,
//     name?: string,
//     version?: string,
//     logPath?: string,
//     readlinePrompt?: string,
//     handlerConfig?: handlerConfigType,
//     questionString?: string
// };

export let defaultConfig = {
    port: process.env.PORT || 8080,
    name: "app",
    version: "0.0.0",
    logPath: null,
    readlinePrompt: ">> ",
    handlerConfig: {
        autoLogFull: false,
        autoLog: true,
        autoLogWsFull: false,
        autoLogWs: true,
        onRequestHandlingErrorMessage: "Internal server error",
        onRequestHandlingError(request, response, config, error) {
            if (!config.onRequestHandlingErrorMessage) return;
            response.end(config.onRequestHandlingErrorMessage);
        },
        onWsHandlingErrorMessage: "Internal server error",
        onWsHandlingError(data, connection, config, error) {
            if (!config.onWsHandlingErrorMessage) return;
            connection.send(config.onWsHandlingErrorMessage);
        }
    },
    questionString: "> "
};