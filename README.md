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