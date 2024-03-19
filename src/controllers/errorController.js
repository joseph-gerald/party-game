const path = require('path');

exports.get404Page = (req, res) => {
    try {
        res.sendFile(path.join(__dirname, '..', 'public', 'error', '404.html'));
    } catch (error) {
        console.error('Error serving 404.html:', error);
        res.status(404).send('404 Not Found');
    }
};