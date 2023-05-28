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
        autoLog: true,
        ifError: "Internal server error",
    },
    questionString: "> "
};