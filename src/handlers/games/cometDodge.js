const handled_types = ["comet_dodge.move"]

const stages = [
    //  [prep, comet, stage duration]
    [2000, 1, 10000],
    [2000, 2, 10000],
    [1000, 3, 10000],
    [1000, 4, 10000],
    [1000, 6, 10000],
    [1000, 8, 10000],
    [500, 8, 10000],
]

const sleep = ms => new Promise(r => setTimeout(r, ms));

module.exports = class {
    constructor(server) {
        this.server = server;
    }

    handles(type) {
        return handled_types.includes(type);
    }

    async handleBroadcast(room, type, data) {
        switch (type) {
            case "game.ready.comet_dodge":
                let stage = 0;

                room.clients.forEach(client => {
                    client.game ??= {
                        x: 0,
                        y: 0
                    };
                });

                for (const [prep, comet, duration] of stages) {
                    stage++;

                    for (let i = 0; i < duration / prep; i++) {
                        for (let j = 0; j < comet; j++) {
                            const direction = Math.floor(Math.random() * 4);
                            const index = Math.floor(Math.random() * 10);

                            room.broadcast("comet_dodge.comet", {
                                index,
                                prep,
                                direction
                            });

                            const right = direction % 2 == 0;
                            const row = direction > 1;

                            setTimeout(async () => {
                                for (let k = 0; k < 10; k++) {
                                    const x = row ? (right ? k : 9 - k) : index;
                                    const y = row ? index : (right ? k : 9 - k);

                                    for (const session of room.clients) {
                                        if (!session.game) continue;
                                        console.log(direction, row, "index: " + index, "k" + k, "game", session.game.x, session.game.y, "comet", x, y)

                                        if (session.game.x == x && session.game.y == y) {
                                            session.game.dead = true;
                                            session.room.broadcast("comet_dodge.hit", session.id);
                                        }
                                    }
                                }

                                await sleep(50);
                            }, prep);
                        } // row
                        await sleep(prep);
                    }
                }
                break;
        }
    }

    handle(session, type, data) {
        session.game ??= {
            x: 0,
            y: 0
        };

        switch (type) {
            case "comet_dodge.move":
                if (session.game.dead) return;

                switch (data) {
                    case "up":
                        session.game.y--;
                        break;
                    case "down":
                        session.game.y++;
                        break;
                    case "left":
                        session.game.x--;
                        break;
                    case "right":
                        session.game.x++;
                        break;
                }

                session.game.x = Math.min(9, Math.max(0, session.game.x));
                session.game.y = Math.min(9, Math.max(0, session.game.y));

                session.room.broadcast("comet_dodge.move", {
                    id: session.id,
                    x: session.game.x,
                    y: session.game.y
                });
                break;
        }
    }
};