import fs from "node:fs"

export function write(path, data) {
    fs.writeFileSync(path, data, {encoding: "utf-8"})
}

export function read(path) {
    return fs.readFileSync(path, {encoding: "utf-8"})
}

export function writeObject(path, data) {
    write(path, JSON.stringify(data))
}

export function readObject(path) {
    return JSON.parse(read(path))
}

export function append(path, data) {
    write(path, read(path) + data)
}

export class File {
    constructor(path) {
        this.path = path;
        this.data = undefined;
    }

    write(data = this.data) {
        this.data = data;
        write(this.path, data);
    }

    read() {
        this.data = read(this.path);
        return this.data;
    }

    writeObject(data = this.data) {
        this.data = data;
        writeObject(this.path, data);
    }

    readObject() {
        this.data = readObject(this.path);
        return this.data;
    }

    append(data) {
        if (typeof this.data === "object") {
            this.data = JSON.stringify(this.data);
        }
        this.data += data;
        append(this.path, data);
    }
}