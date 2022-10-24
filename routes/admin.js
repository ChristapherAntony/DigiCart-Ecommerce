var express = require('express');
var router = express.Router();

/* GET users listing. */

router.get('/', function(req, res, next) {
  res.render('admin/admin-login',{layout: 'admin-layout',admin:true});
  
});



router.get('/dash', function(req, res, next) {
  res.render('admin/dash', {layout: 'admin-layout'});
});

module.exports = router;  
  