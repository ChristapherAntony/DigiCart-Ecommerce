var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('users/user-home');
});

router.get('/viewAll', function(req, res, next) {
  res.render('users/user-viewAll');
});



module.exports = router;
