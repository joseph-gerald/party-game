const express = require('express');
const router = express.Router();
const errorController = require('./controllers/errorController');
const apiController = require('./controllers/apiController');

// webcrawlers
router.get('/robots.txt', apiController.getRobots);
router.get('/robots.min.txt', apiController.getRobotsMinified);

// api logic
router.post('/api/v1/query', apiController.query);
router.post('/api/v1/ping', apiController.ping);

router.use((req, res, next) => {
    if (req.method === 'GET') {
        errorController.get404Page(req, res);
    } else {
        res.status(404).send("Could not find anything for \"" + req.path + "\"");
    }
});


module.exports = router;