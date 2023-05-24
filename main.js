import SBackend from "./sBackend/index.mjs";
import test from "./test.js";
import path from "path";
import files from "./files.json" assert {type: "json"};
import packageJSON from "./package.json" assert {type: "json"};

let app = new SBackend({
    port: process.env.PORT || 8888,
    name: packageJSON.name,
    version: packageJSON.version,
    logPath: "./latest.log"
});

app.on("stop", () => {app.logger.message("Server stopped")});
app.on("pause", () => {app.logger.message("Server paused")});
app.on("resume", () => {app.logger.message("Server resumed")});
app.on("restart", () => {app.logger.message("Server restarted")});

app.defaultKeyboardHandler = answer => app.logger.message(answer);
app.addKeyboardCommand("stop", () => app.stop());
app.addKeyboardCommand("pause", () => app.pause());
app.addKeyboardCommand("resume", () => app.resume());
app.addKeyboardCommand("restart", () => app.restart());
app.addKeyboardCommand("timeout", () => {
    app.pause(true);
    setTimeout(() => app.resume(), 10000);
});

app.addHandlers(test);
app.addFile("/postman", path.resolve("postman.html"));
// app.addFolder("/", path.resolve("./sBackend"));
app.addFilesJson(files, p => path.resolve(p));

app.use(function (request, response) {
    // this.logger.message(response.headers);
    // response.headers = {
    //     test: true
    // };
    // return true;
    // response.status(288);
    // response.end({
    //     body: request.body
    // });
    this.logger.message({
        request: request.body,
        params: request.params,
        afterRoute: request.afterRoute,
        headers: request.headers,
        query: request.query
    });
    return true;
});

app.start(() => {
    app.logger.message(app.routes);
});