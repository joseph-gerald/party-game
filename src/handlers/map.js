const handled_types = ["room.start"]

maps = [
    {
        image_url: "assets/maps/sunflower.webp",
        steps: 12
    },
    {
        image_url: "assets/maps/fortnite.jpg",
        steps: 40
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
        console.log("ASDAISDOJAOISDJ")
        switch (type) {
            case "room.start":
                if (!session.host) return session.send("server.error.401", "You are not the host");
                setTimeout(() => {
                    session.room.broadcast("map.spin.prepare", JSON.stringify(maps));

                    setTimeout(() => {
                        const index = Math.floor(Math.random() * 100 * maps.length);
                        const map = maps[index % maps.length];
                        session.room.broadcast("map.spin", index);
                        console.log(map)
                    }, 1000);
                }, 250);
        }
    }
};