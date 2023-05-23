import * as fs from "node:fs";
import * as flatted from "flatted";

export function write(path, data) {
    fs.writeFileSync(path, data, {encoding: "utf-8"});
}

export function read(path) {
    return fs.readFileSync(path, {encoding: "utf-8"})
}

export function writeObject(path, data) {
    write(path, flatted.stringify(data));
}

export function readObject(path) {
    return JSON.parse(read(path));
}

export function append(path, ...data) {
    write(path, read(path) + data.map(elem => typeof elem === "object" ? flatted.stringify(elem) : elem).join(' '));
}

export class File {
    path
    data

    constructor(path) {
        this.path = path;
        this.data = undefined;
    }

    write(data) {
        write(this.path, data);
    }

    read() {
        this.data = read(this.path);
        return this.data;
    }

    writeObject(data) {
        writeObject(this.path, data);
    }

    readObject() {
        this.data = readObject(this.path);
        return this.data;
    }

    append(...data) {
        append(this.path, ...data);
    }
}