import SBackend from "./sBackend/index.mjs";
import test from "./test.js";
import path from "path";
import files from "./files.json" assert {type: "json"};
import config from "./config.js";

let app = new SBackend(config);


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

// app.use(function (request, response) {
//     console.log({
//         request: request.body,
//         params: request.params,
//         afterRoute: request.afterRoute,
//         headers: request.headers,
//         query: request.query,
//         url: request.url
//     });
//     return true;
// });
app.addHandlers(test);
app.addFile("/postman", path.resolve("postman.html"));
// app.addFolder("/", path.resolve("./sBackend"));
app.addFilesJson(files, p => path.resolve(p));

app.startAsync().then(server => {
    app.logger.message(app.routes);
});