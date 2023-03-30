***Download: https://disk.yandex.ru/d/S16Krj_BUvpbOg***
# Starting
## Creating an app
#### esm
```javascript
import SBackend from "./sBackend/index.mjs";

let app = new SBackend();

app.start();
```
#### cjs
```javascript
const SBackend = require("./sBackend/index.mjs")

let app = new SBackend();

app.start();
```
### Server will log:
```
--++== app v0.0.0; port: 8080 ==++--
```
## Changing app name, version, port
```javascript
let app = new SBackend({
    port: 8888,
    name: "test",
    version: "0.0.1"
});
```
### Server will log:
```
--++== test v0.0.1; port: 8888 ==++--
```
## Logging
```javascript
let app = new SBackend({
    port: 8888,
    name: "test",
    version: "0.0.0",
    logPath: "./latest.log"
});

app.logger.message("test");
```
### In console:
```
2023.3.30 13:41:0: info: test

--++== test v0.0.0; port: 8888 ==++--
```
### In latest.log
```log
2023.3.30 14:22:44: info: test
--++== test v0.0.0; port: 8888 ==++--
```
Why does our message was logged before *"--++== test v0.0.0; port: 8888 ==++--"*?  
Because server was started after it.
## Start callback
```javascript
app.start();

app.logger.message("test");
```
This message will be logged before *"--++== test v0.0.0; port: 8888 ==++--"*.  
How can we log handle server starting? Using start callback.
```javascript
app.start(() => {
    app.logger.message("test");
});
```
### Server will log:
```
--++== test v0.0.0; port: 8888 ==++--

2023.3.30 15:19:37: info: test
```
# Registering handlers
## Single handler
### POST
```javascript
app.post("/post", (data, app, response, request, errorFunc) => {
    app.logger.message(data);
    return {
        code: 200,
        response: "ok"
    };
});
```
#### Server will log (after handling request):
```
--++== test v0.0.0; port: 8888 ==++--

2023.3.30 15:32:58: info: {
    "request": {},
    "url": "/post?test=test&test0=0&test1=true",
    "query": "test=test&test0=0&test1=true"
    "params": {},
    "headers": {
        "content-type": "text/plain",
        "user-agent": "PostmanRuntime/7.31.3",
        "accept": "*/*",
        "postman-token": "efcfd80c-4e7b-4a3b-875a-2e05812bc351",
        "host": "localhost:8888",
        "accept-encoding": "gzip, deflate, br",
        "connection": "keep-alive",
        "content-length": 2
    },
    "afterRoute": "t?test=test&test0=0&test1=true"
}

2023.3.30 15:32:58: request: Handled request to /post?test=test&test0=0&test1=true. Code: 200. Request: {}. Response: "ok"
```
### GET
```javascript
app.get("/get", (data, app, response, request, errorFunc) => {
    app.logger.message(data);
    return {
        code: 200,
        response: "ok"
    };
});
```
#### Server will log (after handling request):
```
--++== test v0.0.0; port: 8888 ==++--

2023.3.30 15:36:47: info: {
    "url": "/get?test=test&test0=0&test1=true",
    "query": "test=test&test0=0&test1=true"
    "params": {},
    "headers": {
        "user-agent": "PostmanRuntime/7.31.3",
        "accept": "*/*",
        "postman-token": "a348e587-306a-4e91-bc38-647e9502bc39",
        "host": "localhost:8888",
        "accept-encoding": "gzip, deflate, br",
        "connection": "keep-alive"
    },
    "afterRoute": "t?test=test&test0=0&test1=true"
}

2023.3.30 15:36:47: request: Handled request to /get?test=test&test0=0&test1=true. Code: 200. Response: "ok"
```
### FormData
```javascript
app.formData("/formdata", (data, app, response, request, errorFunc) => {
    app.logger.message(data);
    return {
        code: 200,
        response: "ok"
    };
});
```
#### Server will log (after handling request):
```
--++== test v0.0.0; port: 8888 ==++--

2023.3.30 15:45:23: info: {
    "request": {
        "test": "test",
        "test0": 0,
        "test1": true
    },
    "files": null,
    "url": "/formdata?test=test&test0=0&test1=true",
    "query": "test=test&test0=0&test1=true"
    "params": {},
    "headers": {
        "user-agent": "PostmanRuntime/7.31.3",
        "accept": "*/*",
        "postman-token": "af46fdb6-cbe4-496b-bbcb-55d0c578287e",
        "host": "localhost:8888",
        "accept-encoding": "gzip, deflate, br",
        "connection": "keep-alive",
        "content-type": "multipart/form-data; boundary=--------------------------247694685990523438764693",
        "content-length": 376
    },
    "afterRoute": "a?test=test&test0=0&test1=true"
}

2023.3.30 15:45:23: request: Handled request to /formdata?test=test&test0=0&test1=true. Code: 200. Request: {
    "test": "test",
    "test0": 0,
    "test1": true
}. Response: "ok"
```
### Raw POST
#### No request body parsing, no logging, no error handling.
```javascript
app.rawPost("/post", (request, response, app) => {
    response.status(200);
    response.end("ok");
});
```
#### Server will log only init message.
### Raw GET
#### No logging, no error handling.
```javascript
app.rawGet("/post", (request, response, app) => {
    response.status(200);
    response.end("ok");
});
```
#### Server will log only init message.
## Multiple handlers
### main.js
```javascript
import SBackend from "./sBackend/index.mjs";
import handlers from "./handlers.js";

let app = new SBackend({
    port: 8888,
    name: "test",
    version: "0.0.0",
    logPath: "./latest.log"
});

app.addHandlers(handlers);

app.start();
```
### handlers.js
```javascript
export default {
    post: {
        "/post": {
            callback(data, app, response, request, errorFunc) {
                app.logger.message("POST");
                app.logger.message(data);
                return {
                    code: 200,
                    response: "ok"
                }
            }
        },
        "/formdata": {
            callback(data, app, response, request, errorFunc) {
                app.logger.message("FormData");
                app.logger.message(data);
                return {
                    code: 200,
                    response: "ok"
                }
            },
            wrapper: "post.formData"
        },
        "/post/raw": {
            callback(request, response, app) {
                app.logger.message("raw POST");
                response.status(200);
                response.end("ok");
            },
            wrapper: "raw"
        }
    },
    get: {
        "/get": {
            callback(data, app, response, request, errorFunc) {
                app.logger.message("GET");
                app.logger.message(data);
                return {
                    code: 200,
                    response: "ok"
                }
            }
        },
        "/get/raw": {
            callback(request, response, app) {
                app.logger.message("raw GET");
                response.status(200);
                response.end("ok");
            },
            wrapper: "raw"
        }
    }
}
```
#### Server will log (after handling requests):
```
--++== test v0.0.0; port: 8888 ==++--

2023.3.30 17:45:0: info: POST

2023.3.30 17:45:0: info: {
    "request": {
        "test": "test",
        "test0": 0,
        "test1": true
    },
    "url": "/post?test=test&test0=0&test1=true",
    "query": "test=test&test0=0&test1=true"
    "params": {},
    "headers": {
        "content-type": "application/json",
        "user-agent": "PostmanRuntime/7.31.3",
        "accept": "*/*",
        "postman-token": "750d0b9f-a395-4bae-8022-a15f42354219",
        "host": "localhost:8888",
        "accept-encoding": "gzip, deflate, br",
        "connection": "keep-alive",
        "content-length": 61
    },
    "afterRoute": "t?test=test&test0=0&test1=true"
}

2023.3.30 17:45:0: request: Handled request to /post?test=test&test0=0&test1=true. Code: 200. Request: {
    "test": "test",
    "test0": 0,
    "test1": true
}. Response: "ok"

2023.3.30 17:45:2: info: FormData

2023.3.30 17:45:2: info: {
    "request": {
        "test": "test",
        "test0": 0,
        "test1": true
    },
    "files": null,
    "url": "/formdata?test=test&test0=0&test1=true",
    "query": "test=test&test0=0&test1=true"
    "params": {},
    "headers": {
        "user-agent": "PostmanRuntime/7.31.3",
        "accept": "*/*",
        "postman-token": "a6279535-578b-4300-92f2-8b4ba2d0fd9f",
        "host": "localhost:8888",
        "accept-encoding": "gzip, deflate, br",
        "connection": "keep-alive",
        "content-type": "multipart/form-data; boundary=--------------------------763107324175412377365942",
        "content-length": 376
    },
    "afterRoute": "a?test=test&test0=0&test1=true"
}

2023.3.30 17:45:2: request: Handled request to /formdata?test=test&test0=0&test1=true. Code: 200. Request: {
    "test": "test",
    "test0": 0,
    "test1": true
}. Response: "ok"

2023.3.30 17:45:8: info: raw POST

2023.3.30 17:45:10: info: GET

2023.3.30 17:45:10: info: {
    "url": "/get?test=test&test0=0&test1=true",
    "query": {
        "test": "test",
        "test0": 0,
        "test1": true
    }
    "params": {},
    "headers": {
        "user-agent": "PostmanRuntime/7.31.3",
        "accept": "*/*",
        "postman-token": "2797a3f5-4868-4db6-8804-8d301cd67f55",
        "host": "localhost:8888",
        "accept-encoding": "gzip, deflate, br",
        "connection": "keep-alive"
    },
    "afterRoute": "t?test=test&test0=0&test1=true"
}

2023.3.30 17:45:10: request: Handled request to /get?test=test&test0=0&test1=true. Code: 200. Response: "ok"

2023.3.30 17:45:12: info: raw GET
```
# Sending files
## One file
```javascript
import SBackend from "./sBackend/index.mjs";
import path from "path";

let app = new SBackend({
    port: 8888,
    name: "test",
    version: "0.0.0",
    logPath: "./latest.log"
});

app.addFile("/some_file", path.resolve("./main.js"));

app.start();
```
#### Server will log (after handling request):
```
--++== test v0.0.0; port: 8888 ==++--

2023.3.30 17:58:27: request: Handled request to /some_file
```
#### Response:
```javascript
import SBackend from "./sBackend/index.mjs";
import path from "path";

let app = new SBackend({
    port: 8888,
    name: "test",
    version: "0.0.0",
    logPath: "./latest.log"
});

app.addFolder("/folder", path.resolve("."));

app.start();
```
## One folder
```javascript
import SBackend from "./sBackend/index.mjs";
import path from "path";

let app = new SBackend({
    port: 8888,
    name: "test",
    version: "0.0.0",
    logPath: "./latest.log"
});

app.addFolder("/folder", path.resolve("."));

app.start();
```
#### Server will log (after handling request):
```
--++== test v0.0.0; port: 8888 ==++--

2023.3.30 18:5:59: request: Handled request to /folder/main.js
```
#### Response:
```javascript
import SBackend from "./sBackend/index.mjs";
import path from "path";

let app = new SBackend({
    port: 8888,
    name: "test",
    version: "0.0.0",
    logPath: "./latest.log"
});

app.addFolder("/folder", path.resolve("."));

app.start();
```
## Multiple
```javascript
import SBackend from "./sBackend/index.mjs";
import path from "path";

let app = new SBackend({
    port: 8888,
    name: "test",
    version: "0.0.0",
    logPath: "./latest.log"
});

app.addHandlers({
    "/some_file": {
        path: path.resolve("./main.js")
    },
    "/folder": {
        dir: path.resolve(".")
    }
})

app.start();
```
#### Server will log (after handling request):
```
--++== test v0.0.0; port: 8888 ==++--

2023.3.30 18:11:3: request: Handled request to /some_file

2023.3.30 18:11:23: request: Handled request to /folder/main.js
```
#### Both responses:
```javascript
import SBackend from "./sBackend/index.mjs";
import path from "path";

let app = new SBackend({
    port: 8888,
    name: "test",
    version: "0.0.0",
    logPath: "./latest.log"
});

app.addHandlers({
    "/some_file": {
        path: path.resolve("./main.js")
    },
    "/folder": {
        dir: path.resolve(".")
    }
})

app.start();
```