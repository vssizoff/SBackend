import SBackend from "./sBackend/index.mjs";
import test from "./test.js";
import path from "path";
import files from "./files.json" assert { type: "json" };

let app = new SBackend({
    port: 8888,
    name: "test",
    version: "0.0.0",
    logPath: "./latest.log"
});

app.post("/test", (data, app, response, request) => {
    // app.logger.success("test request");
    // app.logger.message(data);
    // app.logger.message(url);
    // app.logger.message(JSON.stringify(query));
    app.logger.success({
        test: "test",
        test0: 16,
        test1: true,
        test2: {
            test: "test",
            test0: 16,
            test1: true,
            test2: {
                test: "test",
                test0: 16,
                test1: true
            }
        },
        test3: [
            "test",
            16,
            true,
            {
                test: "test",
                test0: 16,
                test1: true,
                test2: {
                    test: "test",
                    test0: 16,
                    test1: true
                }
            }
        ]
    });
    // app.logger.message("test");
    app.logger.messageColourise(["test", 16, true, {
        test: "test",
        test0: 16,
        test1: true
    }, ["test", 16, true, {
        test: "test",
        test0: 16,
        test1: true
    }]]);
    app.logger.requestError("test", JSON.stringify({
        test: "test",
        test0: 16,
        test1: true,
        test2: ["test", 16, true, {
            test: "test",
            test0: 16,
            test1: true
        }]
    }), "test", {inputFormat: "object"})
    app.logger.requestError("test", undefined, "test", {inputFormat: "object"});
    app.logger.request("test", 200, {
        test: "test",
        test0: 16,
        test1: true,
        test2: ["test", 16, true, {
            test: "test",
            test0: 16,
            test1: true
        }]
    }, JSON.stringify({
        test: "test",
        test0: 16,
        test1: true,
        test2: ["test", 16, true, {
            test: "test",
            test0: 16,
            test1: true
        }]
    }), {
        test: "test",
        test0: 16,
        test1: true,
        test2: ["test", 16, true, {
            test: "test",
            test0: 16,
            test1: true
        }]
    }, JSON.stringify({
        test: "test",
        test0: 16,
        test1: true,
        test2: ["test", 16, true, {
            test: "test",
            test0: 16,
            test1: true
        }]
    }))
    return {
        code: 200,
        response: "ok"
    }
}, {
    parseQuery: true
});

app.addHandlers(test);
app.addFile("/postman", path.resolve("postman.html"));
// app.addFolder("/", path.resolve("./sBackend"));

Object.keys(files).forEach(route => {
    app.addFile(route, path.resolve(files[route]));
});

app.start(() => {
    app.logger.message(app.routes);
});