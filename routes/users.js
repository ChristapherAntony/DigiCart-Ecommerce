var express = require('express');
var router = express.Router();
const userHelpers = require('../helpers/user-helpers')
const productHelpers = require('../helpers/product-helpers');
const categoryHelpers = require('../helpers/category-helpers');
const otpHelpers = require("../helpers/otp-helpers")
const { response } = require('express');
let cartCount = 0
let userName = null
const headerDetails = null



//session verifying

const verifyUser = (req, res, next) => {
  console.log(req.url);
  req.session.returnTo = req.url
  if (req.session.user) {
    next();
  } else {
    //next();
    cartCount = 0
    userName = null
    res.render('users/login-signUp');
  }
}
router.get('/login-register', verifyUser, (req, res, next) => {
  res.redirect('/');
});
router.get('/login', (req, res, next) => {
  req.session.loggedIn = false
  req.session.user = null
  //req.session.destroy()
  cartCount = 0
  userName = null
  res.redirect('/');
});


router.get('/logOut', (req, res, next) => {
  req.session.loggedIn = false
  req.session.user = null
  //req.session.destroy()
  cartCount = 0
  userName = null

  res.redirect('/');
});

router.get('/otpLogin', (req, res, next) => {
  res.render('users/otpLogin', { mobileError: req.session.mobileError });
  req.session.mobileError = null;
});

router.get('/otpVerify', (req, res, next) => {
  res.render('users/enterOtp', { otpError: req.session.otpError })
  req.session.otpError = null;

});

router.post('/enterOtp', (req, res, next) => {
  userHelpers.verifyMobile(req.body.mobile).then((response) => {
    if (response.status == false) {
      req.session.mobileError = "Please Enter a Registered Mobile Number! ";
      res.redirect('/otpLogin');
    } else if (response.active == false) {
      req.session.mobileError = "Your account is Blocked!";
      res.redirect('/otpLogin');
    } else {
      req.session.mobileNumber = req.body.mobile
      mobile = `+91${req.body.mobile}`
      otpHelpers.sendOTP(mobile).then((data) => {
        res.render('users/enterOtp')
      })
    }
  })
  //////////////////////////
  // res.render('users/enterOtp') //bypass otp

})

router.post('/verifyOtp', (req, res, next) => {
  console.log(req.body);
  let number = (req.body.one + req.body.two + req.body.three + req.body.four + req.body.five + req.body.six)
  OTP = (number)
  otpHelpers.verifyOTP(OTP).then(async (response) => {
    if (response.status) {
      mobileNumber = req.session.mobileNumber
      req.session.mobileNumber = null
      req.session.user = await userHelpers.otpLogin(mobileNumber)
      res.redirect('/');
    }
    else {
      req.session.otpError = "Invalid OTP";
      res.redirect('/otpVerify');
    }
  })
  //res.redirect('/'); //bypass otp

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
      res.redirect('/login-register')   // need to login with password agin to 
    }
  })
})

router.post('/logIn', (req, res) => {

  userHelpers.doLogin(req.body).then(async (response) => {
    if (response.status == false) {
      res.render('users/login-signUp', { 'emailError': "Invalid Credentials! " })
    } else if (response.active == false) {
      res.render('users/login-signUp', { 'emailError': "Your Account is Blocked!" })
    }
    else {
      req.session.loggedIn = true
      req.session.user = response.user
      cartCount = await userHelpers.getCartCount(req.session.user._id)
      userName = req.session.user.UserName
      const headerDetails = await userHelpers.getHeaderDetails(req.session.user._id)

      res.redirect(req.session.returnTo)
    }
  })
})



/* GET home page. */
router.get('/', async function (req, res, next) {
  let userData = req.session.user
  if (userData) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
    userName = req.session.user.UserName
    let headerDetails = await userHelpers.getHeaderDetails(req.session.user._id)
    categoryHelpers.getAllCategory().then(async (category) => {
      res.render('users/user-home', { category, userName, cartCount, headerDetails })
    })
  } else {
    categoryHelpers.getAllCategory().then(async (category) => {
      res.render('users/user-home', { category })
    })
  }

});
/************************* VIEW ALL PRODUCTS ***************************************/
router.get('/viewAll', async function (req, res, next) {
  if (req.session.user) {
    productHelpers.getAllProducts().then((products) => {
      categoryHelpers.getAllCategory().then(async (category) => {
        let headerDetails = await userHelpers.getHeaderDetails(req.session.user._id)
        res.render('users/user-viewAll', { products, category, userName, cartCount, headerDetails })
      })
    })
  } else {
    productHelpers.getAllProducts().then((products) => {
      categoryHelpers.getAllCategory().then(async (category) => {
        res.render('users/user-viewAll', { products, category })
      })
    })
  }
});
router.get('/viewAll/:id', function (req, res, next) {
  let categoryId = req.params.id
  if (req.session.user) {
    productHelpers.getCategoryProducts(categoryId).then((products) => {
      categoryHelpers.getAllCategory().then(async (category) => {
        const headerDetails = await userHelpers.getHeaderDetails(req.session.user._id)
        res.render('users/user-viewAll', { products, category, userName, cartCount, headerDetails })
      })
    })
  } else {
    productHelpers.getCategoryProducts(categoryId).then((products) => {
      categoryHelpers.getAllCategory().then((category) => {
        res.render('users/user-viewAll', { products, category })
      })
    })
  }

});
router.get('/viewAllVerify', verifyUser, function (req, res, next) {
  res.redirect('/viewAll')
});
/************************ VIEW PRODUCT DETAILS ******************************************/
router.get('/details/:id', async (req, res, next) => {
  let productId = req.params.id   //to get the clicked item id
  //const headerDetails = await userHelpers.getHeaderDetails(req.session.user._id)

  productHelpers.getProductDetails(productId).then((product) => {
    let category = product.category
    productHelpers.getProductCategory(category).then((categoryName) => {
      productHelpers.getCategoryProducts(category).then((categoryTitle) => {
        res.render('users/product-details', { product, categoryTitle, categoryName, userName, cartCount, headerDetails });
      })
    })
  })
});
router.get('/detailsVerify/:id', verifyUser, async (req, res, next) => {
  let productId = req.params.id   //to get the clicked item id
  const headerDetails = await userHelpers.getHeaderDetails(req.session.user._id)

  productHelpers.getProductDetails(productId).then((product) => {
    let category = product.category
    productHelpers.getProductCategory(category).then((categoryName) => {
      productHelpers.getCategoryProducts(category).then((categoryTitle) => {
        res.render('users/product-details', { product, categoryTitle, categoryName, userName, cartCount, headerDetails });
      })
    })
  })
});
/******************************************************************************************/
router.get('/wishlist', verifyUser, async (req, res, next) => {
  const headerDetails = await userHelpers.getHeaderDetails(req.session.user._id)

  res.render('users/wishlist', { cartCount, userName, headerDetails });
});


router.get('/account', verifyUser, async (req, res, next) => {
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  const headerDetails = await userHelpers.getHeaderDetails(req.session.user._id)


  res.render('users/account', { orders, userName, cartCount, account: true, headerDetails });
});


router.get('/cart', verifyUser, async (req, res, next) => {
  let userId = req.session.user._id
  const headerDetails = await userHelpers.getHeaderDetails(req.session.user._id)

  userHelpers.getCartProducts(req.session.user._id).then((products) => {
    userHelpers.getCartCount(req.session.user._id).then(async (response) => {
      cartCount = response
      let totalValue = 0
      if (products.length > 0) {
        totalValue = await userHelpers.getTotalAmount(req.session.user._id)
        res.render('users/cart', { products, userName, userId, cartCount, totalValue, headerDetails });
      } else {
        res.render('users/cartIsEmpty', { cartCount, userName })
      }
    })
  })
});


router.get('/add-to-cart/:id', verifyUser, async (req, res, next) => {
  if (userName == null) {
    res.json({ status: false })
  } else {
    userHelpers.addToCart(req.params.id, req.session.user._id).then(async () => {
      const headerDetails = await userHelpers.getHeaderDetails(req.session.user._id)

      userHelpers.getCartCount(req.session.user._id).then((response) => {
        cartCount = response
        res.json({ status: true })
      })
    })
  }
})

router.post('/change-product-quantity', (req, res, next) => {
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    const headerDetails = await userHelpers.getHeaderDetails(req.session.user._id)
    response.total = await userHelpers.getTotalAmount(req.body.user)
    res.json(response)
  })
})

router.post('/removeProduct', (req, res, next) => {
  userHelpers.removeProduct(req.body).then(async (response) => {
    const headerDetails = await userHelpers.getHeaderDetails(req.session.user._id)

    // response.total = await userHelpers.getTotalAmount(req.body.user)
    res.json(response)
  })
})




router.get('/ProceedToCheckOut', verifyUser, async (req, res) => {
  let user = req.session.user
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  let products = await userHelpers.getCartProducts(req.session.user._id)
  const headerDetails = await userHelpers.getHeaderDetails(req.session.user._id)

  res.render('users/placeOrder', { cartCount, total, user, userName, products, headerDetails })
})

router.post('/placeOrder', verifyUser, async (req, res) => {
  let products = await userHelpers.getCartProductsList(req.body.userId)
  let totalPrice = await userHelpers.getTotalAmount(req.body.userId)
  userHelpers.placeOrder(req.body, products, totalPrice).then((orderId) => {
    if (req.body['payment_method'] === 'COD') {
      cartCount = 0
      res.json({ codSuccess: true })

    } else {
      userHelpers.generateRazorpay(orderId, totalPrice).then((response) => {
        console.log(response.amount, "/---------------------------");

        res.json(response)
      })

    }


  })

  //res.render('/')
})

router.post('/verify-payment', (req, res) => {
  console.log(req.body);
  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      console.log('payment Status ');
      res.json({ status: true })
    })
  }).catch((err) => {
    console.log(err);
    res.json({ status: false })
  })
})

router.get('/clearCart', verifyUser, (req, res) => {
  userHelpers.clearCart(req.session.user._id).then(() => {
    cartCount = 0
    res.redirect('/cart')
  })
})

router.get('/orderSuccess', verifyUser, async (req, res) => {
  const headerDetails = await userHelpers.getHeaderDetails(req.session.user._id)

  res.render('users/orderSuccess', { userName, cartCount })
})
router.get('/viewOrders', verifyUser, async (req, res) => {
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  const headerDetails = await userHelpers.getHeaderDetails(req.session.user._id)


  res.render('users/viewOrders', { userName, cartCount, orders, headerDetails })
})

router.get('/orderDetails/:id', verifyUser, async (req, res) => {

  let productDetails = await userHelpers.orderProductDetails(req.params.id)
  const headerDetails = await userHelpers.getHeaderDetails(req.session.user._id)
  let orderDetails = await userHelpers.getOrderDetails(req.params.id)
  console.log(productDetails);
  console.log(orderDetails);


  res.render('users/orderDetails', { userName, cartCount, orderDetails, productDetails, headerDetails })
})


module.exports = router;
