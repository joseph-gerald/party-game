const RoomHandler = require('./handlers/room.js');

const data = {
    sessions: [],
    clients: [],
    rooms: []
}

let handlers = [
    new RoomHandler(data)
]

console.log(handlers[0])

class Session {
    constructor(client) {
        this.client = client;
        this.username = null;
        this.room = null;
    }

    send(type, data) {
        this.client.send([type,data].map(part => btoa(part).replaceAll("=", "")).join("/"));
    }
}

function handleConnection(client, request) {
    const headers = request.headers;
    const session = new Session(client);

    data.clients.push(client);
    data.sessions.push(session);

    function onClose() {
        console.log(`Connection Closed`);
        
        var position = data.clients.indexOf(client);
        data.clients.splice(position, 1);
    }

    function onMessage(message) {
        if (message.indexOf("keepalive") == 0) {
            const count = message.split("/")[1];

            if (isNaN(parseInt(count))) throw Error("Invalid Keepalive");
            return;
        }

        if (session.username == null) return session.username = message;

        let [type, data] = message.split("/").map(part => atob(part));

        console.log(`Received: ${type} ${data}`);

        for (const handler of handlers) {
            if (handler.handles(type)) {
                handler.handle(session, type, data);
                return;
            }
        }
    }

    client.on('message', data => {
        try {
            onMessage(data.toString())
        } catch (error) {
            client.close();
            console.log(error)
        }
    });

    client.on('close', onClose);
}

module.exports = handleConnection;