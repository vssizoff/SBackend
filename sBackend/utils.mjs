import fs from "node:fs";

JSON.safeStringify = (obj, indent = 2) => {
    let cache = [];
    const retVal = JSON.stringify(
        obj,
        (key, value) =>
            typeof value === "object" && value !== null
                ? cache.includes(value)
                    ? undefined
                    : cache.push(value) && value
                : value,
        indent
    );
    cache = null;
    return retVal;
};

Object.fromCircular = data => JSON.parse(JSON.safeStringify(data));

export let circularToObject = Object.fromCircular;

export class File {
    path
    data = undefined
    options = {encoding: "utf-8"}

    constructor(path, encodingOrOptions = "utf-8") {
        this.path = path;
        if (typeof encodingOrOptions === "string") {
            this.options.encoding = encodingOrOptions;
        }
        else if (typeof encodingOrOptions === "object") {
            this.options = encodingOrOptions;
        }
    }

    write(data) {
        fs.writeFileSync(this.path, data, this.options);
    }

    read() {
        this.data = fs.readFileSync(this.path, this.options);
        return this.data;
    }

    writeObject(data) {
        this.write(JSON.safeStringify(data));
    }

    readObject() {
        this.data = JSON.parse(this.read());
        return this.data;
    }

    append(...data) {
        this.write(this.read() + data.map(elem => typeof elem === "object" ? JSON.safeStringify(elem) : elem).join(' '));
    }
}