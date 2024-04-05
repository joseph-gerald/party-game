const handled_types = ["game.ready", "game.wheel.ready"]
const [
    CometDodge,
    HotPotato
] = [
        require('./games/cometDodge.js'),
        require('./games/hotPotato.js'),
    ];

module.exports = class {
    constructor(server) {
        this.server = server;

        this.games = [
                {
                    image: "assets/games/hot_potato.webp",
                    name: "Hot Potato",
                    type: "individual",
                    screen: "hot_potato",
                    handler: new HotPotato(server)
                },
                {
                    image: "assets/games/comet_dodge.webp",
                    name: "Comet Dodge",
                    type: "individual",
                    screen: "comet_dodge",
                    handler: new CometDodge(server)
                }
            ];

        this.gamesWithoutHandler = this.games.map(game => {
            const { handler, ...rest } = game;
            return rest;
        });
    }

    handles(type) {
        return handled_types.includes(type) || this.games.find(game => game.handler.handles(type));
    }

    handleBroadcast(room, type, data) {
        const game = room.game;
        if (!game) return;

        game.handler.handleBroadcast(room, type, data);
    }

    handle(session, type, data) {
        const room = session.room;
        if (!room) return session.send("error", "You are not in a room");

        switch (type) {
            case "game.ready":
                // prevent people abusing an event by sending dupes or bad client code
                if (session.gameReady == data) return;

                session.gameReady = data;
                
                for (const client of room.clients) {
                    if (client.gameReady != data) return;
                }

                room.broadcast("game.ready."+data);
                break;
            case "game.wheel.ready":
                if (session.gameReady == 2) return;

                session.gameReady = 2;

                for (const client of room.clients) {
                    if (client.gameReady != 2) return;
                }

                const index = 1 || Math.floor(Math.random() * this.games.length);
                const game = this.games[index];

                session.room.game = game;
                session.game = null;
                
                room.broadcast("game.wheel.ready", JSON.stringify([
                    index,
                    this.gamesWithoutHandler
                ]));
                break;
            default:
                {
                    const game = session.room.game;
                    if (!game) return;
    
                    game.handler.handle(session, type, data);
                }
        }
    }
};