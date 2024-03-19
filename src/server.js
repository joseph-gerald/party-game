let clients = [];

function handleConnection(client, request) {
    const headers = request.headers;

    clients.push(client);

    function onClose() {
        console.log(`Connection Closed`);
        
        var position = clients.indexOf(client);
        clients.splice(position, 1);
    }

    function onMessage(data) {
        if (data.indexOf("keepalive") == 0) {
            const count = data.split("/")[1];

            if (isNaN(parseInt(count))) throw Error("Invalid Keepalive");
            return;
        }


    }

    client.on('message', data => {
        try {
            onMessage(data.toString())
        } catch (error) {
            client.close();
            console.log(error)
        }
    });

    client.on('close', onClose);
}

module.exports = handleConnection;