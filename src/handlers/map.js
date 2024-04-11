const handled_types = ["room.start", "map.spin.ready", "map.spin.prepare"]

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
    },
    {
        image_url: "assets/maps/hotland.png",
        step_map: "data/maps/hotland.json",
        name: "Hotland",
        steps: 12,
        dice: {
            min: 1,
            max: 3
        }
    },
    {
        image_url: "assets/maps/cow_palace.png",
        step_map: "data/maps/cow_palace.json",
        name: "Cow Palace",
        steps: 21,
        dice: {
            min: 1,
            max: 6
        }
    },
    {
        image_url: "assets/maps/cat_island.png",
        step_map: "data/maps/cat_island.json",
        name: "Cat Island",
        steps: 11,
        dice: {
            min: 1,
            max: 3
        }
    },
    {
        image_url: "assets/maps/shark_map.webp",
        step_map: "data/maps/shark_map.json",
        name: "Shark Map",
        steps: 10,
        dice: {
            min: 1,
            max: 3
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
        switch (type) {
            case "room.start":
                if (!session.host) return session.send("server.error.401", "You are not the host");
                break;

            case "map.spin.prepare":
                session.send("map.spin.prepare", JSON.stringify(maps));
                break;

            case "map.spin.ready":
                const room = session.room;

                session.state = "map.spin";

                for (const client of room.clients) {
                    if (client.state != "map.spin") return;
                }

                const noGo = 100 * 1.5 * maps.length * 0.5;
                const range = 60;

                let index = noGo;
                let map = null;

                while (Math.abs(index - noGo) < range) {
                    index = Math.floor(Math.random() * 100 * maps.length);
                    map = maps[index % maps.length];
                }

                setTimeout(() => {
                    session.room.broadcast("map.spin", index);
                }, 1000);
        }
    }
};