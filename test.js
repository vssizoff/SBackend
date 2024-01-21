import path from "path";
import fs from "node:fs";
import {execute, parse, buildSchema} from "graphql";
import {buildHandlers} from "./sBackend/index.mjs";

let users = [];

export default buildHandlers({
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
                connection.send(data);
                if (data === "disconnect") connection.close();
                if (data === "terminate") connection.terminate();
            });
        }
    },
    gql: {
        "/graphql": {
            schema: buildSchema(fs.readFileSync("./schema.graphql", {encoding: "utf8"})),
            query: {
                getAllUsers() {
                    return users;
                },
                getUser({id: ID}) {
                    return {...users.find(({id}) => id === ID), test: "test"}
                }
            },
            mutation: {
                createUser({input: {username, data}}, {emit}) {
                    users.push({id: Date.now() % 1000000000, username, data});
                    // subscriptions.createUserSubscribe.forEach(func => func(users[users.length - 1]))
                    emit("createUserSubscribe", users[users.length - 1]);
                    return users[users.length - 1];
                },
                setData({id, data}, {emit, app}) {
                    let index = 0;
                    for (; index < users.length && users[index].id !== id; index++) {}
                    if (index >= users.length) return;
                    users[index].data = data;
                    emit("userChangeSubscribe" + id + "data", {id, type: "data", user: users[index]});
                    emit("userChangeSubscribe" + "data", {id, type: "data", user: users[index]});
                    emit("userChangeSubscribe" + id, {id, type: "data", user: users[index]});
                    emit("userChangeSubscribe", {id, type: "data", user: users[index]});
                    return users[index];
                },
                setUsername({id, username}, {emit}) {
                    let index = 0;
                    for (; index < users.length && users[index].id !== id; index++) {}
                    if (index >= users.length) return;
                    users[index].username = username;
                    emit("userChangeSubscribe" + id + "username", {id, type: "username", user: users[index]});
                    emit("userChangeSubscribe" + "username", {id, type: "username", user: users[index]});
                    emit("userChangeSubscribe" + id, {id, type: "username", user: users[index]});
                    emit("userChangeSubscribe", {id, type: "data", user: users[index]});
                    return users[index];
                },
                delUser({id}, {emit}) {
                    let index = 0;
                    for (; index < users.length && users[index].id !== id; index++) {}
                    if (index >= users.length) return false;
                    let user = users[index];
                    users.splice(index, 1);
                    emit("delUserSubscribe", user);
                    return true;
                }
            },
            subscription: {
                createUserSubscribe(_, {regEvent}) {
                    // acceptConnection("createUserSubscribe");
                    regEvent("createUserSubscribe");
                },
                userChangeSubscribe({id, eventType}, {regEvent}) {
                    // acceptConnection(`userChangeSubscribe${id ?? ""}${(eventType ?? "").toLowerCase()}`);
                    regEvent(`userChangeSubscribe${id ?? ""}${(eventType ?? "").toLowerCase()}`);
                },
                delUserSubscribe(_, {regEvent}) {
                    // acceptConnection("delUserSubscribe");
                    regEvent("delUserSubscribe");
                }
            }
        }
    }
})