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
router.get('/signUp', (req, res, next)=> {
  res.render('users/signUp');
});

router.post('/signUp',(req,res)=>{
  console.log(req.body);
  userHelpers.doSignUP(req.body).then((response)=>{
    if(response.status==false){                 
      res.render('users/signUp',{'emailError':"Email / Mobile Number Already Exists"})
    }else{                                 
      res.redirect('/login-register')
    }
  })
})

router.post('/logIn',(req,res)=>{

  userHelpers.doLogin(req.body).then((response)=>{
    if(response.status==false){     
      res.render('users/login-signUp',{'emailError':"Invalid Credentials! "})
    }else if(response.active==false){
      res.render('users/login-signUp',{'emailError':"Your Account is Blocked!"})
    }
    else{                               
      res.redirect('/')
    }
  }) 
})




router.get('/account', (req, res, next)=> {
  res.render('users/account');
}); 
 



module.exports = router;
