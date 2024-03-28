const handled_types = ["avatar.reroll"]

module.exports = class {
    constructor(server) {
        this.server = server;
    }

    handles(type) {
        return handled_types.includes(type);
    }

    handle(session, type, data) {
        console.log(data)
        switch (type) {
            case "avatar.reroll":
                session.profile.avatar_id = Math.ceil(Math.random() * 20);
                session.room?.broadcast("avatar.update",{
                    id: session.id,
                    avatar_id: session.profile.avatar_id
                })
        }
    }
};