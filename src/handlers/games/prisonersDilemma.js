const handled_types = ["prison_dilemma.action"]

const rewards = {
    "cooperation": [
        3, 3
    ],
    "betrayal": [
        5, 0
    ],
    "mutual_betrayal": [
        1, 1
    ],
}

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