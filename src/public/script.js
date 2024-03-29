const isLocalhost = window.location.host.indexOf("localhost") == 0;
const protocol = isLocalhost ? "ws://" : "wss://";

const socket = new WebSocket(protocol + window.location.host);

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

        socket.onclose = () => {
            setTimeout(() => location.reload(), 3000);
        }

        socket.onopen = () => {
            let keepaliveCount = 0;
            setInterval(() => { socket.send("keepalive/" + keepaliveCount++); }, 60 * 1000);
        
            window.connected = true;
        }

        this.socket.onmessage = (event) => {
            const [type, data] = event.data.split("/").map(part => atob(part));
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
        this.socket.send([type,typeof data == "object" ? JSON.stringify(data) : data].map(part => btoa(part).replaceAll("=", "")).join("/"));
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