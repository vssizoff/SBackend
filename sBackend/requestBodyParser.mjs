import {js2xml, xml2js} from "xml-js";

function f(obj) {
    if (obj === undefined) return obj;
    if (Array.isArray(obj)) {
        return obj.map(elem => f(elem));
    }
    if (obj.type === "text") return obj.text;
    delete obj.type;
    if ("elements" in obj) {
        obj.elements = f(obj.elements);
    }
    return obj;
}

export function XMLParse(data) {
    return f(xml2js(data, {compact: false}).elements);
}

function f0(obj) {
    if (obj === undefined) return obj;
    if (Array.isArray(obj)) {
        return obj.map(elem => f0(elem));
    }
    if (typeof obj === "string") return {type: "text", text: obj};
    obj.type = "element";
    if ("elements" in obj) {
        obj.elements = f0(obj.elements);
    }
    return obj;
}

export function toXML(data) {
    let a = JSON.parse(JSON.stringify(data));
    return js2xml({
        elements: f0(a)
    }, {compact: false});
}

export function requestBodyParser(data) {
    try {
        return JSON.parse(data);
    }
    catch (e) {
        try {
            return XMLParse(data);
        }
        catch (e) {
            return data;
        }
    }
}

export function requestBodyParserMiddleware(request, response, next) {
    if (request.body) {
        next();
        return;
    }
    let data = "";
    try {
        request.on("data", chunk => {
            data += chunk.toString();
        });
        request.on("end", () => {
            request.body = requestBodyParser(data);
            next();
        });
    }
    catch (error) {
        next();
    }
}