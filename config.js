import packageJSON from "./package.json" assert {type: "json"};

export default {
    name: packageJSON.name,
    version: packageJSON.version,
    logPath: "./latest.log"
};