import {defaultConfig} from "./types.mjs";

let defaultConfig2 = {
    wrapper: "auto"
}

export default class Handler {
    route
    type
    callback
    config
    app

    constructor(route, type, callback, config = defaultConfig.handlerConfig, app) {
        config = {...defaultConfig2, ...config}
        if (route.substring(0, 1) !== '/'){
            route = '/' + route;
        }
        this.route = route;
        this.type = type;
        this.callback = callback;
        this.config = config;
        this.app = app;
        this.setWrapper()
    }

    setWrapper(wrapper = this.config.wrapper) {
        this.config.wrapper = wrapper
        switch (wrapper) {
            case "auto":
                this.setWrapper(this.type);
                break;
            case "raw":
                break;
            case "get":
                // this.callback = wrappers.get(this.callback, this.route, this.config)

                break;
            case "post":
                // this.callback = wrappers.post(this.callback, this.route, this.config)

                break;
            case "post.formData":
                // this.callback = wrappers.formData(this.callback, this.route, this.config)

                break;
            default:
                this.app.logger.error("Not supported wrapper")
                break;
        }
    }

    run(request, response) {
        this.callback(request, response, this.app);
        // this.app.readline.close();
        // this.app.readline.prompt();
    }
}