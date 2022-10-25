var express = require('express');
var router = express.Router();
const userHelpers=require('../helpers/user-helpers')

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

router.post('/signUp',(req,res)=>{
  console.log(req.body);
  userHelpers.doSignUP(req.body).then((response)=>{
    if(response.status==false){                 
      res.render('user/signup',{'emailError':"Email / Mobile Number Already Exists"})
    }else{                               
      res.render('user/login')
    }
  })
})

router.post('/logIn',(req,res)=>{
  console.log(req.body);
  userHelpers.doLogin(req.body).then((data)=>{
    console.log(data);
  }) 


})




router.get('/account', (req, res, next)=> {
  res.render('users/account');
}); 
 



module.exports = router;
