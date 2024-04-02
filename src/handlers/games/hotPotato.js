const handled_types = ["game.ready", "game.wheel.ready"]

module.exports = class {
    constructor(server) {
        this.server = server;
    }

    handles(type) {
        return handled_types.includes(type);
    }

    handle(session, type, data) {
        
    }
};