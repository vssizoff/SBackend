import path from "path";

export default {
    "/test_get": {
        callback(request, response) {
            this.logger.message(this.url);
            this.logger.message(this.query);
            this.question("test", text => {
                this.logger.success("ok");
            });
            response.status(200);
            response.end();
        },
        type: "get"
    },
    "/test_formData": {
        callback(request, response) {
            // app.logger.message(data.request);
            app.logger.message(Object.keys(data.files));
            // app.logger.message(data.url);
            // app.logger.message(data.query);
            return {
                code: 200,
                response: data
            };
        },
        wrapper: "post.formData",
        logResponse: false
    },
    "/test_post": {
        callback(data, app, response, request) {
            app.logger.message(data);
            return {
                code: 200,
                response: data,
                headers: {
                    test: undefined
                }
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