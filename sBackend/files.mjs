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
        this.path = path
    }

    write(data) {
        write(this.path, data)
    }

    read() {
        return read(this.path)
    }

    writeObject(data) {
        writeObject(this.path, data)
    }

    readObject() {
        return readObject(this.path)
    }

    append(data) {
        append(this.path, data)
    }
}