import SBackend from "./sBackend/index.mjs";
import test from "./test.js";
import path from "path";
import files from "./files.json" assert {type: "json"};

let app = new SBackend({
    port: 8888,
    name: "test",
    version: "0.0.0",
    logPath: "./latest.log"
});

// app.onStop = ;
// app.onPause = ;
// app.onResume = ;
// app.onRestart = ;

app.on("stop", () => {app.logger.message("Server stopped")});
app.on("pause", () => {app.logger.message("Server paused")});
app.on("resume", () => {app.logger.message("Server resumed")});
app.on("restart", () => {app.logger.message("Server restarted")});

// process.on('SIGTERM', () => app.stop());
// process.on('SIGINT', () => app.stop());

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
    // app.logger.message(request);
    // app.logger.message(response);
    this.logger.message(response.headers);
    response.headers = {
        test: true
    };
    response.end();
});

app.start(() => {
    app.logger.message(app.routes);
    // app.question("test", text => {
    //     app.logger.success("ok");
    // });
});