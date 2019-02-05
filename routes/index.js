var express = require('express');
var router = express.Router();

router.put('/:type/:id', function(req, res, next) {

  console.log(req.body);
  res.sendStatus(200);

});

module.exports = router;
