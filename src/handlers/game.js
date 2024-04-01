const handled_types = ["game.ready", "game.wheel.ready"]

games = [
    {
        image: "assets/games/hot_potato.webp",
        name: "Hot Potato",
        type: "individual",
    },
    {
        image: "assets/games/comet_dodge.webp",
        name: "Comet Dodge",
        type: "individual",
    }
]

module.exports = class {
    constructor(server) {
        this.server = server;
    }

    handles(type) {
        return handled_types.includes(type);
    }

    handle(session, type, data) {
        const room = session.room;
        if (!room) return session.send("error", "You are not in a room");

        switch (type) {
            case "game.ready":
                if (session.gameReady == 1) return;

                session.gameReady = 1;

                for (const client of room.clients) {
                    if (!client.gameReady) return;
                }

                room.broadcast("game.ready");
                break;
            case "game.wheel.ready":
                if (session.gameReady == 2) return;

                session.gameReady = 2;

                for (const client of room.clients) {
                    if (client.gameReady != 2) return;
                }

                const index = Math.floor(Math.random() * games.length);
                const game = games[index];

                session.room.game = game;

                room.broadcast("game.wheel.ready", JSON.stringify([
                    index,
                    games
                ]));
                break;
        }
    }
};