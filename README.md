![SBackend docs](./SBackend.png)
<p align="center">SBackend - backend framework based on <a href="https://www.npmjs.com/package/express">express</a></p>

# Table of Contents
> 1. [Installation](#installation)
> 2. [Starting](#starting)
> 3. [Registering handlers](#registering-handlers)
> 4. [Sending files](#sending-files)
> 5. [Keyboard](#keyboard)
> 6. [Stop / pause / resume / restart server](#stop--pause--resume--restart-server)
> 7. [Events](#events)
> 8. [Files (utf-8)](#files-utf-8)
> 9. [Other](#other)
# Installation
* Init node project
* Type this in console
```
npm i sbackend
```
# Starting
## Creating an app
esm
```javascript
import SBackend from "sbackend";

let app = new SBackend();

app.start();
```
cjs
```javascript
const SBackend = require("sbackend")

let app = new SBackend();

app.start();
```
Server will log:
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
Server will log:
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

console.log("test");
```
In console:
```
2023.3.30 13:41:0: info: test

--++== test v0.0.0; port: 8888 ==++--
```
In latest.log:
```log
2023.3.30 14:22:44: info: test
--++== test v0.0.0; port: 8888 ==++--
```
> Why does our message was logged before *"--++== test v0.0.0; port: 8888 ==++--"*?  
> Because server was started after it.
## Start callback
```javascript
app.start();

app.logger.message("test");
```
> This message will be logged before *"--++== test v0.0.0; port: 8888 ==++--"*.  
> How can we handle server starting? Using start callback.
```javascript
app.start(() => {
    app.logger.message("test");
});
```
Server will log:
```
--++== test v0.0.0; port: 8888 ==++--

2023.3.30 15:19:37: info: test
```
# Registering handlers
## Single handler
### POST
```javascript
app.post("/post", (request, response) => {
    console.log({
        request: request.body,
        url: request.url,
        query: request.query,
        params: request.params,
        headers: request.headers,
        afterRoute: request.afterRoute
    });
    response.status(200);
    response.end("ok");
});
```
Server will log (after handling request):
```
--++== test v0.0.0; port: 8888 ==++--

2023.3.30 15:32:58: info: {
    "request": {},
    "url": "/post?test=test&test0=0&test1=true",
    "query": "test=test&test0=0&test1=true"
    "params": {},
    "headers": {
        "content-type": "text/plain",
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
app.get("/get", (request, response) => {
    console.log({
        url: request.url,
        query: request.query,
        params: request.params,
        headers: request.headers,
        afterRoute: request.afterRoute
    });
    response.status(200);
    response.end("ok");
});
```
Server will log (after handling request):
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
### Other type
```javascript
import SBackend from "sbackend";

let app = new SBackend({
    port: 8888,
    name: "test",
    version: "0.0.0",
    logPath: "./latest.log"
});

app.addHandler("/other", "put", (request, response) => {
    console.log({
        url: request.url,
        query: request.query,
        params: request.params,
        headers: request.headers,
        afterRoute: request.afterRoute
    });
    response.status(200);
    response.end("ok");
});

app.start();
```
## Multiple handlers
### main.js
```javascript
import SBackend from "sbackend";
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
        "/post"(request, response) {
            this.logger.message("POST");
            console.log({
                request: request.body,
                url: request.url,
                query: request.query,
                params: request.params,
                headers: request.headers,
                afterRoute: request.afterRoute
            });
            response.status(200);
            response.end("ok");
        }
    },
    get: {
        "/get"(request, response) {
            this.logger.message("GET");
            console.log({
                url: request.url,
                query: request.query,
                params: request.params,
                headers: request.headers,
                afterRoute: request.afterRoute
            });
            response.status(200);
            response.end("ok");
        }
    }
}
```
Server will log (after handling requests):
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
app.addFile("/file", path.resolve("./main.js"));
```
Server will log (after handling request):
```
--++== test v0.0.0; port: 8888 ==++--

2023.3.30 17:58:27: request: Handled request to /file
```
<!-- Response:
```javascript
import SBackend from "sbackend";
import path from "path";

let app = new SBackend({
    port: 8888,
    name: "test",
    version: "0.0.0",
    logPath: "./latest.log"
});

app.addFolder("/folder", path.resolve("."));

app.start();
``` -->
## One folder
```javascript
app.addFolder("/folder", path.resolve("."));
```
Server will log (after handling request):
```
--++== test v0.0.0; port: 8888 ==++--

2023.3.30 18:5:59: request: Handled request to /folder/main.js

2023.3.30 18:5:59: request: Handled request to /folder/handlers.js
```
<!-- #### Response:
```javascript
import SBackend from "sbackend";
import path from "path";

let app = new SBackend({
    port: 8888,
    name: "test",
    version: "0.0.0",
    logPath: "./latest.log"
});

app.addFolder("/folder", path.resolve("."));

app.start();
``` -->
## One folder or file
```javascript
app.addPath("/file", path.resolve("./main.js"));
app.addPath("/folder", path.resolve("."));
```
## Multiple
```javascript
app.addHandlers({
    paths: {
        "/file": path.resolve("./main.js"),
        "/folder": path.resolve(".")
    }
});
```
or
```javascript
app.addHandlers({
    files: {
        "/file": path.resolve("./main.js")
    },
    folders: {
        "/folder": path.resolve(".")
    }
});
```
Server will log (after handling request):
```
--++== test v0.0.0; port: 8888 ==++--

2023.3.30 18:11:3: request: Handled request to /file

2023.3.30 18:11:23: request: Handled request to /folder/main.js
```
<!-- #### Both responses:
```javascript
import SBackend from "sbackend";
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
``` -->
## From json
### main.js
```javascript
import SBackend from "sbackend";
import path from "path";
import files from "./files.json" assert { type: "json" };

let app = new SBackend({
    port: 8888,
    name: "test",
    version: "0.0.0",
    logPath: "./latest.log"
});

app.addFilesJson(files, p => path.resolve(p));

app.start();
```
### Files.json
```json
{
  "/log": "./latest.log",
  "/srequest": "./sRequest.js",
  "/functions": "./sBackend/files.mjs",
  "/folder": "."
}
```
# Keyboard
## Adding command
```javascript
app.addKeyboardCommand("test", data => {
    app.logger.message(data);
});
```
## Default handler
```javascript
app.defaultKeyboardHandler = data => {
    app.logger.message(data);
};
```
# Stop / pause / resume / restart server
## Pause server
```javascript
app.pause();
```
## Resume server
```javascript
app.resume();
```
## Restart server
```javascript
app.restart();
```
## Stop server
```javascript
app.stop();
```
### Stop from keyboard
```javascript
app.addKeyboardCommand("stop", () => app.stop());
```
# Events
```javascript
app.on("stop", () => {app.logger.message("Server stopped")});
app.on("pause", () => {app.logger.message("Server paused")});
app.on("resume", () => {app.logger.message("Server resumed")});
app.on("restart", () => {app.logger.message("Server restarted")});
```
# Files (utf-8)
## Read file
```javascript
import * as files from "sbackend/files.mjs";

console.log(files.read("test.txt"));
console.log(files.readObject("test.json"));
```
## Write file
```javascript
import * as files from "sbackend/files.mjs";

files.write("test.txt", "SBackend test file");
files.writeObject("test.json", {
    test: "test",
    test0: 0,
    test1: true
});
```
## Append to file
```javascript
import * as files from "sbackend/files.mjs";

files.write("test.txt", "SBackend");
files.append("test.txt", " test file");
console.log(files.read("test.txt")) // SBackend test file
```
## File class
```javascript
import * as files from "sbackend/files.mjs";

let file = new files.File("test.txt");

file.write("SBackend");
file.append(" test file");
console.log(file.read()); // SBackend test file

let file2 = new files.File("test.json");

file.writeObject({
    port: 8888,
    name: "test",
    version: "0.0.0",
    logPath: "./latest.log"
});
console.log(file.read()) // {"test": "test", "test0": 0, "test1": true}
```
# Other
## Logging routes
```javascript
import SBackend from "sbackend";
import handlers from "./handlers.js";
import path from "path";

let app = new SBackend({
    port: 8888,
    name: "test",
    version: "0.0.0",
    logPath: "./latest.log"
});

app.addHandlers(handlers);

app.addHandlers({
    paths: {
        "/file": path.resolve("./main.js"),
        "/folder": path.resolve(".")
    }
});

app.start(() => {
    app.logger.message(app.routes);
});
```
#### Server will log:
```
--++== test v0.0.0; port: 8888 ==++--

2023.5.30 9:43:31: info: [
  { route: '/post', type: 'post' },
  { route: '/get', type: 'get' },
  {
    route: '/file',
    path: '/media/sizoff/sizoff/Programming/Jet_Brains/Javascript/SBackend/main.js'
  },
  {
    route: '/folder/*',
    dir: '/media/sizoff/sizoff/Programming/Jet_Brains/Javascript/SBackend'
  }
]
```
## Setting config
```javascript
import SBackend from "sbackend";

let app = new SBackend();

app.setConfig({
    port: 8888,
    name: "test",
    version: "0.0.0",
    logPath: "./latest.log"
});

app.start();
```
## Readline questions
```javascript
app.question("test", text => {
    app.logger.success("ok");
    app.logger.message(text);
});
```