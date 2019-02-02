var express = require('express');
var router = express.Router();

/* GET home page. */
router.post('/', function(req, res, next) {

    console.log(req.body);
    res.end();
    //res.render('index', { title: 'Express' });

});

module.exports = router;
