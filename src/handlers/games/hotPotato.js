const handled_types = ["hot_potato.pass"]

const sleep = ms => new Promise(r => setTimeout(r, ms));

function explode(player) {
    const room = player.room;

    room.broadcast("hot_potato.boom", room.clients[room.game.data.index].id);
    room.game.data.players.splice(room.game.data.index, 1);

    clearTimeout(room.game.data.explosion);

    setTimeout(() => {
        room.broadcast("hot_potato.remove", room.clients[room.game.data.index].id);
    }, 1500);
}

function queueExplosion(room, duration) {
    return setTimeout(() => {
        room.game.data.playerTimer = null;
        explode(room.game.data.players[room.game.data.index]);
    }, duration)
}

module.exports = class {
    constructor(server) {
        this.server = server;
    }

    async handleBroadcast(room, type, data) {
        switch (type) {
            case "game.ready.hot_potato":
                room.clients.forEach(client => {
                    client.game ??= {
                        last: Date.now(),
                        freeze: Date.now() - 1000,
                        receive: Date.now()
                    };
                });

                await sleep(1000);

                room.game.data = {
                    index: Math.floor(Math.random() * room.clients.length),
                    players: room.clients,
                    explosion: queueExplosion(room, 10000 + (10000 * Math.random())),
                    playerTimer: null
                }

                room.broadcast("hot_potato.pass", room.clients[room.game.data.index].id);
                break;
        }
    }

    handles(type) {
        return handled_types.includes(type);
    }

    handle(session, type, data) {
        const room = session.room;

        session.game ??= {
            last: Date.now(),
            freeze: Date.now() - 1000,
            receive: Date.now()
        };

        if (!room.game.data) return;

        switch (type) {
            case "hot_potato.pass":
                if (session.game.freeze > Date.now()) return;

                session.game.last = Date.now();

                if (room.game.data.index != room.game.data.players.indexOf(session)) {
                    session.send("notify", {
                        title: "Potatoless",
                        message: "You do not have the potato and cannot pass it for the next 5s!"
                    });

                    session.game.freeze = Date.now() + 5000;
                    return;
                }

                room.game.data.index = (room.game.data.index + 1) % room.game.data.players.length;
                const receiver = room.game.data.players[room.game.data.index];

                if (!receiver) return;

                receiver.game.receive = Date.now();

                room.broadcast("hot_potato.pass", receiver.id);

                clearInterval(room.game.data.playerTimer);

                room.game.data.playerTimer = setTimeout(() => {
                    if (receiver.game.receive < receiver.game.last) return;

                    room.broadcast("hot_potato.boom", receiver.id);

                    explode(receiver);
                    room.game.data.index = room.game.data.players.indexOf(session);
                }, 1000);
                break;
        }
    }
};