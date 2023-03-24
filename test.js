import path from "path";

export default {
    "/test_get": {
        callback(data, app, response, request) {
            app.logger.message(data.url);
            app.logger.message(data.query);
            return {
                code: 200,
                response: "ok"
            }
        },
        type: "get"
    },
    "/test_formData": {
        callback(data, app, response, request) {
            // app.logger.message(data.request);
            app.logger.message(Object.keys(data.files.file));
            // app.logger.message(data.url);
            // app.logger.message(data.query);
            return {
                code: 200,
                response: "ok"
            };
        },
        wrapper: "post.formData"
    },
    "/test_post": {
        callback(data, app, response, request) {
            app.logger.message(data);
            return {
                code: 200,
                response: null
            }
        },
        inputFormat: "raw",
        // outputFormat: "raw"
    },
    "/test/:test": {
        callback(data, app, response, request) {
            app.logger.message(request.params);
            return {
                code: 200,
                response: "ok"
            }
        },
        type: "get"
    },
    // "/log": {
    //     path: path.resolve("./latest.log")
    // },
    "/test2/*": {
        callback(data, app, response) {
            app.logger.message(data.afterRoute);
            response.sendFile(`${path.resolve("./sBackend")}/${data.afterRoute}`);
            return {
                code: 200
            }
        },
        type: "get"
    }
}