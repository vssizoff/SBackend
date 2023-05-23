import path from "path";

export default {
    get: {
        "/test_get"(request, response) {
            this.logger.message(request.url);
            this.logger.message(request.query);
            this.question("test", text => {
                this.logger.success("ok");
            });
            response.status(200);
            response.end();
        },
        "/test/:test"(request, response) {
            this.logger.message(request.params);
            response.status(200);
            response.end("ok");
        },
        "/test2/*"(request, response) {
            this.logger.message(request.afterRoute);
            response.sendFile(`${path.resolve("./sBackend")}/${request.afterRoute}`);
            response.status(200);
            response.end();
        }
    },
    post: {
        "/test_formData"(request, response) {
            // app.logger.message(data.request);
            this.logger.message(Object.keys(request.files));
            // app.logger.message(data.url);
            // app.logger.message(data.query);
            response.status(200);
            response.end(request);
        },
        "/test_post"(request, response) {
            this.logger.message(request);
            response.status(200);
            response.headers = {
                test: undefined
            };
            response.end(request);
        }
    }
}