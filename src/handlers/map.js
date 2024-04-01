const handled_types = ["room.start"]

maps = [
    {
        image_url: "assets/maps/sunflower.webp",
        step_map: "data/maps/sunflower.json",
        name: "Sunflower",
        steps: 12,
        dice: {
            min: 1,
            max: 3
        }
    },
    {
        image_url: "assets/maps/skibidi_land.png",
        step_map: "data/maps/skibidi_land.json",
        name: "Skibidi Land",
        steps: 27,
        dice: {
            min: 1,
            max: 6
        }
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
                        const noGo = 100 * 1.5 * maps.length * 0.5;
                        const range = 60;

                        let index = noGo;

                        while (Math.abs(index - noGo) < range) {
                            index = Math.floor(Math.random() * 100 * maps.length);
                        }

                        const map = maps[index % maps.length];

                        session.room.broadcast("map.spin", index);
                        console.log(map)
                    }, 1000);
                }, 250);
        }
    }
};