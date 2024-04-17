const handled_types = ["room.create", "room.join", "room.players", "room.kick", "room.start", "room.public.listen"]

class Room {
    constructor(host, server) {
        this.server = server;

        this.clients = [host];
        this.host = host;

        this.state = "idle";
        this.map = null;

        this.game = null;

        // 36^3 = 46,656 possible codes
        const codeLength = 3;
        this.code = Math.random().toString(36).substring(2, 2 + codeLength).toUpperCase();
    }

    broadcast(type, data) {
        this.clients.forEach(client => client.send(type, data));
        this.server.handlers.forEach(handler => handler.handleBroadcast ? handler.handleBroadcast(this, type, data) : null);
    }

    kick(id, reason) {
        const client = this.clients.find(client => client.id == id);

        if (client) {
            client.send("server.disconnect", reason);

            client.client.close();
        }
    }

    close(reason) {
        this.clients.forEach(client => this.kick(client.id, reason));
        this.server.rooms.splice(this.server.rooms.indexOf(this), 1);
        
        broadcastToListeners(this.server);
    }

    remove(session) {
        this.clients.splice(this.clients.indexOf(session), 1);
        this.broadcast("room.disconnect", session.profile);

        if (session == this.host) {
            if (this.clients.length) {
                this.close("Host disconnected, room closed")
            }
        }
    }
}

function broadcastToListeners(server) {
    const listeners = server.sessions.filter(session => session.state == "room.public.listen");

    const lobbyInfo = server.rooms.filter(room => room.state == "idle").map(room => ({
        code: room.code,
        host: room.host.profile,
        players: room.clients.length
    }));

    listeners.forEach(session => {
        session.send("room.public.info", lobbyInfo);
    })
}

module.exports = class {
    constructor(server) {
        this.server = server;
    }

    handles(type) {
        return handled_types.includes(type);
    }

    handle(session, type, data) {
        switch (type) {
            case "room.create":
                {
                    const room = new Room(session, this.server)
                    this.server.rooms.push(room);

                    session.host = true;
                    session.room = room;
                    session.send("host", room.code);

                    session.send("room.join", {
                        profile: session.profile,
                        host: room.host.id
                    });

                    broadcastToListeners(this.server);
                }
                break;
            case "room.join":
                {
                    const room = this.server.rooms.find(room => room.code == data);

                    if (room) {
                        if (room.state != "idle") return session.send("error", {
                            title: "Room started",
                            message: "Room is already in progress 😔"
                        });

                        if (room.clients.find(client => client.id == session.id)) return;

                        room.clients.push(session);

                        session.send("join", data);
                        session.room = room;

                        room.broadcast("room.join", {
                            profile: session.profile,
                            host: room.host.id
                        });
                    } else {
                        session.send("error", {
                            title: "Room not found",
                            message: `Could not find a room with code: ${data}`
                        });
                    }
                }
                break;
            case "room.players":
                if (data == "true") {
                    session.send("room.join", {
                        profile: session.profile,
                        host: session.id
                    });
                } else {
                    session.send("room.players", session.room.clients.map(client => client.profile))
                }
                break;
            case "room.kick":
                if (!session.host) return session.send("server.error.401", "You are not the host");

                const client = session.room.clients.find(client => client.id == data);

                session.room.kick(data, "You were kicked by the host");
                break;
            case "room.start":
                if (!session.host) return session.send("server.error.401", "You are not the host");

                session.room.state = "playing";

                session.room.broadcast("room.start");
                broadcastToListeners(this.server);
                break;
            case "room.public.listen":
                session.state = "room.public.listen";

                broadcastToListeners(this.server);
                break;
        }
    }
};