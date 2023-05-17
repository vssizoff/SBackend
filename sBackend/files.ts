import * as fs from "node:fs"

export function write(path, data: string) {
    fs.writeFileSync(path, data, {encoding: "utf-8"});
}

export function read(path) {
    return fs.readFileSync(path, {encoding: "utf-8"})
}

export function writeObject(path, data: object) {
    write(path, JSON.stringify(data));
}

export function readObject(path) {
    return JSON.parse(read(path));
}

export function append(path, ...data) {
    write(path, data.map(elem => read(path) + elem).join(""));
}

export class File {
    path: string
    data: string | object

    constructor(path) {
        this.path = path;
        this.data = undefined;
    }

    write(data: string) {
        write(this.path, data);
    }

    read() {
        this.data = read(this.path);
        return this.data;
    }

    writeObject(data: object) {
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