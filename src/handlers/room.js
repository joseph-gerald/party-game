const handled_types = ["room.create", "room.join","room.players"]

class Room {
    constructor(host) {
        this.clients = [host];
        this.host = host;

        // 36^3 = 46,656 possible codes
        const codeLength = 3;
        this.code = Math.random().toString(36).substring(2, 2 + codeLength).toUpperCase();
    }

    broadcast(type, data) {
        this.clients.forEach(client => client.send(type, data))
    }
}

module.exports = class {
    constructor(server) {
        this.server = server;
    }

    handles(type) {
        return handled_types.includes(type);
    }

    handle(session, type, data) {
        console.log(data)
        switch (type) {
            case "room.create":
                {
                    const room = new Room(session)
                    this.server.rooms.push(room);

                    session.room = room;
                    session.send("host", room.code);
                }
                break;
            case "room.join":
                {
                    const room = this.server.rooms.find(room => room.code == data);

                    if (room) {
                        if (room.clients.find(client => client.id == session.id)) return;

                        room.clients.push(session);

                        session.send("join", data);
                        session.room = room;

                        room.clients.forEach(client => {
                            client.send("room.join", session.profile);
                        });
                    } else {
                        session.send("error", "Room not found");
                    }
                }
                break;
            case "room.players":
                session.send("room.players", session.room.clients.map(client => client.profile))
        }
    }
};