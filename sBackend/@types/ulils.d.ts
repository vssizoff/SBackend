export class File {
    path: string
    data: string | undefined
    options: {encoding: string}

    constructor(path: string, encodingOrOptions: string);

    write(data: string): void;

    read(): string;

    writeObject(data: object): void;

    readObject(): object;

    append(...data: Array<string>): void;
}