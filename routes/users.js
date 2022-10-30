var express = require('express');
var router = express.Router();
const userHelpers = require('../helpers/user-helpers')
const productHelpers = require('../helpers/product-helpers');
const categoryHelpers = require('../helpers/category-helpers');
const otpHelpers = require("../helpers/otp-helpers")
const { response } = require('express');

/* GET home page. */
router.get('/', function (req, res, next) {
  categoryHelpers.getAllCategory().then((category) => {
    //productHelpers.getAllProducts().then(())
    res.render('users/user-home', { category })
  })
});

router.get('/viewAll', function (req, res, next) {
  productHelpers.getAllProducts().then((products) => {
    categoryHelpers.getAllCategory().then((category) => {
      
      res.render('users/user-viewAll', { products, category })
    })
  })
});
router.get('/viewAll/:id', function (req, res, next) {
  console.log(req.params);
  let categoryId = req.params.id
 
  console.log(categoryId)
  console.log("+++++++++++++++++++++++++++++++++");
  productHelpers.getCategoryProducts(categoryId).then((products) => {
    categoryHelpers.getAllCategory().then((category) => {
      
      console.log("++++++++++++++++last before render");
      console.log(products);
   

      res.render('users/user-viewAll', { products, category })
    })
  })
});

router.get('/details/:id', (req, res, next) => {
  let productId = req.params.id   //to get the clicked item id
  //let productCategory = await productHelpers.getProductCategory(product.category)
  productHelpers.getProductDetails(productId).then((product) => {
    let category = product.category
    console.log("****#############################################");
    console.log(category);
    productHelpers.getProductCategory(category).then((categoryName)=>{
      productHelpers.getCategoryProducts(category).then((categoryTitle) => {
        console.log("************the whole data sending");
        console.log(categoryTitle.category);
  
        res.render('users/product-details', { product ,categoryTitle,categoryName});
  
      })
      // res.render('users/product-details',{product});



    })

  })

});

router.get('/cart', (req, res, next) => {
  res.render('users/cart');
});

router.get('/wishlist', (req, res, next) => {
  res.render('users/wishlist');
});

router.get('/login-register', (req, res, next) => {
  res.render('users/login-signUp');
});
router.get('/otpLogin', (req, res, next) => {
  res.render('users/otpLogin', { mobileError: req.session.mobileError });
  req.session.mobileError = null;
});
router.get('/otpVerify', (req, res, next) => {

  res.render('users/enterOtp', { otpError: req.session.otpError })
  req.session.otpError = null;

});
// router.post('/enterOtp',(req,res,next)=>{
//   userHelpers.verifyMobile(req.body.mobile).then((response)=>{
//     mobile=`+91${req.body.mobile}`
//     console.log(mobile);
//     if(response.status){
//       otpHelpers.sendOTP(mobile).then((data)=>{
//         res.render('users/enterOtp')
//       })
//     }else{
//       req.session.mobileError="Please Enter a Registered Mobile Number! ";
//       res.redirect('/otpLogin');

//     }
//   })
//   ////////////////////////////
//  // res.render('users/enterOtp') bypass otp

// })
router.post('/enterOtp', (req, res, next) => {
  userHelpers.verifyMobile(req.body.mobile).then((response) => {
    if (response.status == false) {
      req.session.mobileError = "Please Enter a Registered Mobile Number! ";
      res.redirect('/otpLogin');
    } else if (response.active == false) {
      req.session.mobileError = "Your account is Blocked!";
      res.redirect('/otpLogin');
    } else {
      mobile = `+91${req.body.mobile}`
      console.log(mobile);
      otpHelpers.sendOTP(mobile).then((data) => {
        res.render('users/enterOtp')
      })
    }
  })
  ////////////////////////////
  // res.render('users/enterOtp') bypass otp

})



router.post('/verifyOtp', (req, res, next) => {
  let number = (req.body.one + req.body.two + req.body.three + req.body.four + req.body.five + req.body.six)
  OTP = (+number) // to convert string type to number format
  otpHelpers.verifyOTP(OTP).then((response) => {
    if (response.status) {
      res.redirect('/');
    }
    else {
      req.session.otpError = "Invalid OTP";
      res.redirect('/otpVerify');
    }
  })
  //   res.redirect('/'); //for with out otp

});

router.get('/signUp', (req, res, next) => {
  res.render('users/signUp')
});


router.post('/signUp', (req, res) => {
  console.log(req.body);
  userHelpers.doSignUP(req.body).then((response) => {
    if (response.status == false) {
      res.render('users/signUp', { 'emailError': "Email / Mobile Number Already Exists" })
    } else {
      res.redirect('/login-register')
    }
  })
})

router.post('/logIn', (req, res) => {

  userHelpers.doLogin(req.body).then((response) => {
    if (response.status == false) {
      res.render('users/login-signUp', { 'emailError': "Invalid Credentials! " })
    } else if (response.active == false) {
      res.render('users/login-signUp', { 'emailError': "Your Account is Blocked!" })
    }
    else {
      res.redirect('/')
    }
  })
})




router.get('/account', (req, res, next) => {
  res.render('users/account');
});




module.exports = router;
