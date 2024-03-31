const isLocalhost = window.location.host.indexOf("localhost") == 0;
const protocol = isLocalhost ? "ws://" : "wss://";

const socket = new WebSocket(protocol + window.location.host);

function encode(string) {
    return btoa(encodeURI(string));
}

function decode(string) {
    return decodeURI(atob(string));
}

class Player {
    constructor(obj) {
        for (const [key, value] of Object.entries(obj)) {
            this[key] = value;
        }

        this.host = false;
    }
}

class Room {
    constructor(connection) {
        this.connection = connection;
        this.players = {};
        this.code = "";

        this.host_id = "";
        this.host = null;

        this.status = "idle";
        this.map = null;
    }
}

class EventBus {
    constructor() {
        this.listeners = {};
    }

    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }

        this.listeners[event].push(callback);
    }

    remove(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter((cb) => cb != callback);
        }
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach((callback) => callback(data));
        }
    }
}

class Connection {
    constructor(socket) {
        this.socket = socket;
        this.events = new EventBus();
        this.pings = {};
        this.ping = -1;
        this.keepalive = 0;
        this.ping_history = [];
        this.lagging = false;

        socket.onclose = () => {
            setTimeout(() => location.reload(), 3000);
        }

        socket.onopen = () => {
            setInterval(() => {
                this.sendPing();
            }, (isLocalhost ? 30 : 1) * 1000);

            window.connected = true;
            this.sendPing();
        }

        this.socket.onmessage = (event) => {
            const message = event.data;

            if (message.indexOf("PONG") == 0) {
                const count = parseInt(atob(message.split("/")[1]));
    
                const ping = Date.now() - this.pings[count];
                delete this.pings[count];

                this.ping = ping;
                
                this.ping_history.push(ping);
                this.ping_history = this.ping_history.slice(-100);
                return;
            }

            const [type, data] = message.split("/").map(part => decode(part));
            console.log(type, data);

            this.events.emit(type, (() => {
                try {
                    return JSON.parse(data)
                } catch {
                    return data;
                }
            })());
        }
    }

    send(type, data) {
        console.log(this)
        this.socket.send([type, typeof data == "object" ? JSON.stringify(data) : data].map(part => encode(part).replaceAll("=", "")).join("/"));
    }

    sendPing() {
        const count = this.keepalive++;
        this.socket.send("PING/" + btoa(count).replaceAll("=", ""));

        if (this.ping_history.reduce((a, b) => a + b, 0) / this.ping_history.length < 300) this.lagging = false;
        if (Object.keys(this.pings).length > 0) this.lagging = true;

        this.pings[count] = Date.now();
    }
}

window.connection = new Connection(socket);
window.room = new Room(window.connection);

connection.events.on("server.identity", data => {
    window.player = new Player(data);
})

connection.events.on("server.disconnect", data => {
    window.disconnect_reason = data;
    pushScreen("disconnected");
});

connection.events.on("error", data => {
    window.notify(data.title, data.message, 5000, ["warning"]);
});