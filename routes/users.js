var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('users/user-home');
});

router.get('/viewAll', function(req, res, next) {
  res.render('users/user-viewAll');
});

router.get('/details', function(req, res, next) {
  res.render('users/product-details');
});

router.get('/cart', (req, res, next)=> {
  res.render('users/cart');
});

router.get('/wishlist', (req, res, next)=> {
  res.render('users/wishlist');
});

router.get('/login-register', (req, res, next)=> {
  res.render('users/login-signUp');
});
router.get('/account', (req, res, next)=> {
  res.render('users/account');
});
 



module.exports = router;
