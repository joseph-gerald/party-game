const handled_types = ["comet_dodge.move"]

const stages = [
    //  [prep, comet, stage duration]
    [2000, 1, 4000],
    [1000, 6, 5000],
    [1000, 18, 10000],
    [1000, 10, 10000],
    [1000, 12, 10000],
    [1000, 14, 10000],
    [750, 8, 10000],
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
                let quit = false;
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
                        const comets = [];

                        for (let j = 0; j < comet; j++) {
                            const direction = Math.floor(Math.random() * 4);
                            const index = Math.floor(Math.random() * 10);

                            comets.push({
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

                                        if (session.game.x == x && session.game.y == y) {
                                            session.game.dead = true;
                                            session.game.death = { 
                                                time: Date.now(),
                                                stage, x, y
                                            };
                                            session.room.broadcast("comet_dodge.hit", session.id);

                                            if (room.clients.every(client => client.game.dead)) {
                                                room.clients.sort((a, b) => a.game.death.time - b.game.death.time);
                            
                                                room.broadcast("comet_dodge.end", room.clients.map(client => ({
                                                    id: client.id,
                                                    death: client.game.death
                                                })));

                                                quit = true;
                                                return;
                                            }
                                        }
                                    }
                                }

                                await sleep(50);
                            }, prep);

                            if (quit) return;
                        }

                        room.broadcast("comet_dodge.comet", comets);

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