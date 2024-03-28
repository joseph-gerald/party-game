const [
    RoomHandler,
    AvatarHandle
] = [
    require('./handlers/room.js'),
    require('./handlers/avatar.js')
];

const data = {
    sessions: [],
    clients: [],
    rooms: []
}

let handlers = [
    new RoomHandler(data),
    new AvatarHandle(data)
]

class Session {
    constructor(client) {
        this.id = Date.now().toString(30) + Math.floor(Math.random() * 1E+8)
        this.client = client;
        this.username = null;
        this.keepalive = 0;
        this.room = null;

        this.profile = {
            id: this.id,
            username: this.username,
            step: 0,
            avatar_id: Math.ceil(Math.random() * 20)
        }
    }

    send(type, data) {
        this.client.send([type, typeof data == "object" ? JSON.stringify(data) : data].map(part => btoa(part).replaceAll("=", "")).join("/"));
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

        const sessionRoom = session.room;

        if (!sessionRoom) return;

        sessionRoom.clients.splice(sessionRoom.clients.indexOf(session))
        sessionRoom.broadcast("room.disconnect", session.profile)
    }

    function onMessage(message) {
        if (message.indexOf("keepalive") == 0) {
            const count = message.split("/")[1];

            if (isNaN(parseInt(count)) || count < session.keepalive) {
                client.terminate();
            }

            session.keepalive = count;
            return;
        }

        if (session.username == null) {
            session.profile.username = session.username = message;
            session.send("server.identity", session.profile);
            return;
        }

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