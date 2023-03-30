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
let app = new SBackend({
    port: 8888,
    name: "test",
    version: "0.0.0",
    logPath: "./latest.log"
});

app.post("/post", (data, app, response, request, errorFunc) => {
    app.logger.message(data);
    return {
        code: 200,
        response: "ok"
    };
});

app.start();
```
#### Server will log:
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
let app = new SBackend({
    port: 8888,
    name: "test",
    version: "0.0.0",
    logPath: "./latest.log"
});

app.get("/get", (data, app, response, request, errorFunc) => {
    app.logger.message(data);
    return {
        code: 200,
        response: "ok"
    };
});

app.start();
```
#### Server will log:
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
let app = new SBackend({
    port: 8888,
    name: "test",
    version: "0.0.0",
    logPath: "./latest.log"
});

app.formData("/formdata", (data, app, response, request, errorFunc) => {
    app.logger.message(data);
    return {
        code: 200,
        response: "ok"
    };
});

app.start();
```
#### Server will log:
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