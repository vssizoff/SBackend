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
        },
        form_data(request, response) {
            let formData = new FormData;
            formData.set("url", request.url);
            formData.set("body", JSON.stringify(request.body));
            formData.set("headers", JSON.stringify(request.headers));
            formData.set("query", JSON.stringify(request.query));
            formData.set("afterRoute", request.afterRoute);
            response.end(formData);
        }
    },
    use: {
        "/test"(request, response) {
            response.end({
                url: request.url,
                body: request.body,
                headers: request.headers,
                query: request.query,
                afterRoute: request.afterRoute,
                params: request.params
            });
        }
    },
    ws: {
        async "/ws"(request, response) {
            let connection = await response.accept();
            connection.on("message", (data, isBinary, rawData) => {
                console.log(rawData);
                connection.send(data);
                throw new Error("test");
            });
        }
    }
}