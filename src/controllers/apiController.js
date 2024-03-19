const path = require('path');

exports.ping = (req, res) => {
    res.send('pong');
};

exports.getRobots = async (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'robot/robots.txt'));
};

exports.getRobotsMinified = async (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'robot/robots.min.txt'));
};

exports.query = async (req, res) => {
    const query_url = `https://api.jooo.tech/encode?input=${encodeURI(req.query.query_text)}`;
    const response = await fetch(query_url);
    const output = await response.json();
    res.send(output.Output);
};