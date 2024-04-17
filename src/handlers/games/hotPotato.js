const handled_types = ["hot_potato.pass"]

const sleep = ms => new Promise(r => setTimeout(r, ms));

function explode(player) {
    if (!player) return;
    const room = player.room;

    room.broadcast("hot_potato.boom", player.id);
    room.game.data.players = room.game.data.players.splice(room.game.data.index, 1);

    clearTimeout(room.game.data.playerTimer);
    clearTimeout(room.game.data.explosion);

    player.game.dead = true;
    player.game.death = {
        time: Date.now()
    };

    room.game.data.index = -1;

    setTimeout(() => {
        room.broadcast("hot_potato.remove", player.id);

        if (room.game.data.players.length == 1) {
            room.broadcast("notify", {
                title: "Game Over",
                message: `${room.game.data.players[0].username} wins!`
            });

            room.clients.sort((a, b) => a.game.death.time - b.game.death.time);
            room.clients.reverse()

            room.clients.slice(0, 3).forEach((player, i) => {
                player.profile.step += 3 - i;
            });

            room.broadcast("hot_potato.end", room.clients.map(client => ({
                id: client.id,
                death: client.game.death
            })));
        } else {
            room.game.data.index = Math.floor(Math.random() * room.game.data.players.length);

            room.broadcast("notify", {
                title: "Hot Potato",
                message: `${room.game.data.players[room.game.data.index].username} has the potato!`
            });

            room.game.data.explosion = queueExplosion(room, 5000 + (10000 * Math.random()));
        }
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
                        receive: Date.now(),
                        death: {
                            time: 2147483647
                        }
                    };
                });

                const index = Math.floor(Math.random() * room.clients.length);
                const player = room.clients[index];

                room.broadcast("notify", {
                    title: "Hot Potato",
                    message: `${player.username} starts with the potato!`
                });

                await sleep(1000);

                room.game.data = {
                    index: index,
                    players: room.clients.slice(), // copy
                    explosion: queueExplosion(room, 5000 + (10000 * Math.random())),
                    playerTimer: null
                }

                room.broadcast("hot_potato.pass", player.id);
                break;
        }
    }

    handles(type) {
        return handled_types.includes(type);
    }

    handle(session, type, data) {
        const room = session.room;

        if (!room.game || !room.game.data) return;

        switch (type) {
            case "hot_potato.pass":
                if (session.game.freeze > Date.now() || room.game.data.index == -1) return;

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
                    explode(receiver);
                    room.game.data.index = room.game.data.players.indexOf(session);
                }, 1000);
                break;
        }
    }
};