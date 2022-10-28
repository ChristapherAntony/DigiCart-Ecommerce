var express = require('express');
var router = express.Router();
const userHelpers=require('../helpers/user-helpers')
const productHelpers = require('../helpers/product-helpers');
const categoryHelpers = require('../helpers/category-helpers');

/* GET home page. */
router.get('/', function(req, res, next) {
  categoryHelpers.getAllCategory().then((category) => {
    //productHelpers.getAllProducts().then(())
    res.render('users/user-home',  {category} )
  })
});

router.get('/viewAll', function(req, res, next) {
  productHelpers.getAllProducts().then((products) => {
    categoryHelpers.getAllCategory().then((category) => {
      res.render('users/user-viewAll', { products,category })
    })
  })
}); 
router.get('/viewAll/:category', function(req, res, next) {
  let category=req.params.category
  productHelpers.getCategoryProducts(category).then((products) => {
    categoryHelpers.getAllCategory().then((category) => {
      res.render('users/user-viewAll', { products,category })
    })
  })
});

router.get('/details/:id', (req, res, next)=> {
  let productId = req.params.id   //to get the clicked item id
  productHelpers.getProductDetails(productId).then((product)=>{
    let category=product.category
    console.log(category);
    productHelpers.getCategoryProducts(category).then((products) => {
      
      res.render('users/product-details',{product,products});

    })
    // res.render('users/product-details',{product});
  })
  
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
