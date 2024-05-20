const [
    RoomHandler,
    AvatarHandle,
    MapHandler,
    GameHandler
] = [
        require('./handlers/room.js'),
        require('./handlers/avatar.js'),
        require('./handlers/map.js'),
        require('./handlers/game.js')
    ];

const data = {
    sessions: [],
    clients: [],
    rooms: []
}

const handlers = data.handlers = [
    new RoomHandler(data),
    new AvatarHandle(data),
    new MapHandler(data),
    new GameHandler(data)
]

function encode(string) {
    return btoa(encodeURI(string));
}

function decode(string) {
    return atob(decodeURI(string));
}

class Session {
    constructor(client) {
        this.id = Date.now().toString(30) + Math.floor(Math.random() * 1E+8)
        this.client = client;
        this.username = null;
        this.keepalive = 0;
        this.room = null;

        this.gameReady = 0;
        this.state = "";

        this.game = null;

        this.profile = {
            id: this.id,
            username: this.username,
            step: 0,
            avatar_id: Math.ceil(Math.random() * 20)
        }
    }

    send(type, data = "") {
        try {
            this.client.send([type, typeof data == "object" ? JSON.stringify(data) : data].map(part => encode(part).replaceAll("=", "")).join("/"));
        } catch (error) {
            console.log(error);

            this.send("error", {
                title: "Encoder Error",
                message: "Something went wrong when encoding your message. Please report EN01/400."
            })
        }
    }
}

function handleConnection(client, request) {
    const headers = request.headers;
    const session = new Session(client);

    data.clients.push(client);
    data.sessions.push(session);

    session.onClose = onClose;

    function onClose() {
        console.log(`Connection Closed`);

        var position = data.clients.indexOf(client);
        data.clients.splice(position, 1);
        data.sessions.splice(position, 1);

        const sessionRoom = session.room;

        if (!sessionRoom) return;

        sessionRoom.remove(session);

        if (!sessionRoom.clients.length) {
            sessionRoom.close("Room Empty");
        }
    }

    function onMessage(message) {
        if (message.indexOf("PING") == 0) {
            const count = parseInt(atob(message.split("/")[1]));

            if (isNaN(count) || count < session.keepalive) {
                client.terminate();
            }

            session.keepalive = count;
            session.client.send("PONG/" + btoa(count).replaceAll("=", ""));
            return;
        }

        if (session.username == null) {
            session.profile.username = session.username = message;
            session.send("server.identity", session.profile);
            return;
        }

        try {
            let [type, data] = message.split("/").map(part => decode(part));

            console.log(`Received: ${type} ${data}`);


            try {
                for (const handler of handlers) {
                    if (handler.handles(type)) {
                        handler.handle(session, type, data);
                    }
                }
            } catch (error) {
                console.log(error);
                session.send("error", {
                    title: "Internal Server Error",
                    message: "Something went wrong on our end, please report EH01/500."
                })
            }
        } catch (error) {
            console.log(error);
            session.send("error", {
                title: "Decoder Error",
                message: "Something went wrong when decoding your message. Please report DE01/400."
            });
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