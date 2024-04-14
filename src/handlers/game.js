const handled_types = ["game.ready", "game.wheel.ready", "game.leaderboard.ready"]
const [
    CometDodge,
    HotPotato,
    Trivia
] = [
        require('./games/cometDodge.js'),
        require('./games/hotPotato.js'),
        require('./games/trivia.js'),
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
                },
                {
                    image: "assets/games/trivia.webp",
                    name: "Trivia",
                    type: "team",
                    screen: "trivia",
                    handler: new Trivia(server)
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

        if (game.handler.handleBroadcast) game.handler.handleBroadcast(room, type, data);
    }

    handle(session, type, data) {
        const room = session.room;
        if (!room) return session.send("error", {
            title: "Dispatcher Error",
            message: "You are not in a room. If you believe this is a mistake please report NR00/401."
        });

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
                session.game = null;

                for (const client of room.clients) {
                    if (client.gameReady != 2) return;
                }

                const index = 0; // || Math.floor(Math.random() * this.games.length);
                const game = this.games[index];

                session.room.game = game;
                
                room.broadcast("game.wheel.ready", JSON.stringify([
                    index,
                    this.gamesWithoutHandler
                ]));
                break;
            case "game.leaderboard.ready":
                if (session.gameReady == "leaderboard") return;

                session.gameReady = "leaderboard";
                
                for (const client of room.clients) {
                    if (client.gameReady != "leaderboard") return;
                }

                room.broadcast("game.leaderboard", [...room.clients.map(player => {
                    return {
                        id: player.id,
                        step: player.profile.step,
                    };
                })]);
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