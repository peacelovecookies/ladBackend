import anylizeUrls from './anylizeUrls.js';

export default class Router {
    constructor(server) {
        this.server = server;
    }

    initRoutes() {
        this.server.route([
            ...anylizeUrls,
        ]);
    }
}