var express = require('express');
var router = express.Router();
const userHelpers = require('../helpers/user-helpers')
const productHelpers = require('../helpers/product-helpers');
const categoryHelpers = require('../helpers/category-helpers');
const otpHelpers = require("../helpers/otp-helpers")
const wishlistHelper = require("../helpers/wishList-helper")
const { uid } = require('uid')
const { response } = require('express');
const paypal = require('paypal-rest-sdk');
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'ASAocgRIGuweasCF3uKZWPyapBhyFM7ulfBYknuDfGVp2knZIHyY24Bazj88u9g2hCmP5BWVAc0b33uX',
  'client_secret': 'EO-LQBODL7aJNl4krjvmClOiPrv8CwH-OAuPjPJp6MiaQsZieE1VXEbpxxRjsgQk7nem8_TAJeTvlBB7'
});



//session verifying

const verifyUser = (req, res, next) => {
  req.session.returnTo = req.url
  if (req.session.user) {
    next();
  } else {
    res.render('users/login-signUp');
  }
}
router.get('/login-register', verifyUser, (req, res, next) => {
  res.redirect('/');
});

router.get('/login', (req, res, next) => {
  res.redirect('/');
});


router.get('/logOut', (req, res, next) => {
  req.session.loggedIn = false
  req.session.user = null
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
  let number = (req.body.one + req.body.two + req.body.three + req.body.four + req.body.five + req.body.six)
  OTP = (number)
  otpHelpers.verifyOTP(OTP).then(async (response) => {
    if (response.status) {
      mobileNumber = req.session.mobileNumber
      req.session.mobileNumber = null
      req.session.user = await userHelpers.otpLogin(mobileNumber)
      res.redirect('/'); ``
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
      req.session.user = response.user
      res.redirect('/enterCoupon')   // need to login with password agin to 
    }
  })
})

router.get('/enterCoupon', (req, res, next) => {
  res.render('users/enterCoupon', { referralIdError: req.session.referralIdError })
  req.session.referralIdError = null
});

router.post('/verifyReferralID', async (req, res, next) => {
  let apply = await userHelpers.applyReferral(req.body.referralId, req.session.user._id)
  console.log(apply.status);
  if (apply.status) {
    res.redirect('/');
  } else {
    req.session.referralIdError = "The Entered referral code is Invalid"
    res.redirect('/enterCoupon')
  }
});


router.post('/logIn', (req, res) => {
  userHelpers.doLogin(req.body).then(async (response) => {
    console.log("after dologin", response.status);
    if (response.status == false) {
      res.render('users/login-signUp', { 'emailError': "Invalid Credentials! " })
    } else if (response.active == false) {
      res.render('users/login-signUp', { 'emailError': "Your Account is Blocked!" })
    }
    else {
      req.session.loggedIn = true
      req.session.user = response.user
      cartCount = await userHelpers.getCartCount(req.session.user._id)
      const headerDetails = await userHelpers.getHeaderDetails(req.session.user._id)
      res.redirect(req.session.returnTo)
    }
  })
})



/* GET home page. */
router.get('/', async function (req, res, next) {
  const bannerTop_main = await productHelpers.getBannerTop_main()

  const topDiscounted = await productHelpers.getTopDiscounted()
  const allProducts = await productHelpers.getAllProducts()
  const categoryProducts = await productHelpers.getCategoryProductsHome()
  categoryProducts.topDiscounted = topDiscounted
  categoryProducts.allProducts = allProducts

  let headerDetails = await userHelpers.getHeaderDetails(req.session.user?._id)
  res.render('users/user-home', { headerDetails, bannerTop_main, categoryProducts })
});


/************************* VIEW ALL PRODUCTS ***************************************/
router.get('/viewAll', async function (req, res, next) {
  if (req.session.productsTemp == null) req.session.productsTemp = await productHelpers.getAllProducts()

  const products = req.session.productsTemp
  const range = req.session.range
  req.session.productsTemp = null
  req.session.range = null

  const headerDetails = await userHelpers.getHeaderDetails(req.session.user?._id)
  res.render('users/user-viewAll', { products, headerDetails, range })
});

//view Products by category
router.get('/viewAll/:id', function (req, res, next) {
  console.log("inside the view all withgid");
  productHelpers.getCategoryProducts(req.params.id).then((products) => {
    req.session.productsTemp = products  // using this session in viewAll
    res.redirect('/viewAll')
  })
});

router.get('/viewAllByRange', function (req, res, next) {
  let range = {}
  range.min = parseInt(req.query.range1),
    range.max = parseInt(req.query.range2)
  productHelpers.filterPrice(req.query).then(async (products) => {
    req.session.productsTemp = products  // using this session in viewAll
    req.session.range = range
    res.redirect('/viewAll')
  })
});

// while add to cart users verify through this route
router.get('/viewAllVerify', verifyUser, function (req, res, next) {
  res.redirect('/viewAll')
});

// router.get('/getSearchViewAll/:key', function (req, res, next) {
//   console.log("inside getSearchViewAll **********************************");

//   let products=req.params.key
//   console.log(products);
//   if (req.session.user) {
//     console.log("inside getSearchViewAll **************** logeed******************");
//     console.log(products);
//       categoryHelpers.getAllCategory().then(async (category) => {
//         const headerDetails = await userHelpers.getHeaderDetails(req.session.user._id)
//         res.render('users/user-viewAll', { products, category, headerDetails })
//       })

//   } else {

//       console.log("inside getSearchViewAll ****************not logeed******************");
//       console.log(products);
//       categoryHelpers.getAllCategory().then((category) => {
//         res.render('users/user-viewAll', { products, category })
//       })

//   }
// });


/************************ VIEW PRODUCT DETAILS ******************************************/
router.get('/details/:id', async (req, res, next) => {
  let productId = req.params.id   //to get the clicked item id
  const headerDetails = await userHelpers.getHeaderDetails(req.session.user?._id)
  productHelpers.getProductDetails(productId).then((product) => {
    let category = product.category
    productHelpers.getProductCategory(category).then((categoryName) => {   // for showing top of the page
      productHelpers.getCategoryProducts(category).then((categoryTitle) => { //for showing down side of the page
        res.render('users/product-details', { product, categoryTitle, categoryName, headerDetails });
      })
    })
  })
});

//if user not verified while add to cart it will route to this route and verify , then reload same page
router.get('/detailsVerify/:id', verifyUser, async (req, res, next) => {
  let productId = req.params.id   //to get the clicked item id
  const headerDetails = await userHelpers.getHeaderDetails(req.session.user?._id)
  productHelpers.getProductDetails(productId).then((product) => {
    let category = product.category
    productHelpers.getProductCategory(category).then((categoryName) => {
      productHelpers.getCategoryProducts(category).then((categoryTitle) => {
        res.render('users/product-details', { product, categoryTitle, categoryName, headerDetails });
      })
    })
  })
});
/******************************************************************************************/



router.get('/account', verifyUser, async (req, res, next) => {
  const orders = await userHelpers.getUserOrders(req.session.user._id)
  const headerDetails = await userHelpers.getHeaderDetails(req.session.user._id)
  const userDetails = await userHelpers.getUserDetails(req.session.user._id)
  const address = await userHelpers.getAllAddress(req.session.user._id)
  const wallet = await userHelpers.getWallet(req.session.user._id)
  res.render('users/account', { orders, headerDetails, userDetails, address, wallet });
});

router.get('/addAddress', verifyUser, async (req, res, next) => {
  const headerDetails = await userHelpers.getHeaderDetails(req.session.user._id)
  res.render('users/addAddress', { headerDetails });
});

router.post('/postAddress', verifyUser, async (req, res, next) => {
  const add = await userHelpers.addNewAddress(req.body, req.session.user._id)
  res.redirect('/account')
});
router.get('/editAddress/:position', verifyUser, async (req, res, next) => {
  let position = req.params.position
  const headerDetails = await userHelpers.getHeaderDetails(req.session.user._id)
  const getOneAddress = await userHelpers.getOneAddress(req.session.user._id, position)
  res.render('users/editAddress', { headerDetails, getOneAddress, position });
});
router.get('/getAddress', verifyUser, async (req, res, next) => {
  let addressId = req.query.addressId
  if (addressId != "Select") {
    let getOneAddress = await userHelpers.getOneAddressById(req.session.user._id, addressId)
    console.log(getOneAddress);
    let response = getOneAddress.Address
    response.status = true
    res.json(response)
  } else {
    res.json({ status: false })
  }
});

router.post('/updateAddress', verifyUser, async (req, res, next) => {
  const update = await userHelpers.updateAddress(req.body, req.session.user._id,)
  res.redirect('/account')
});
router.get('/deleteAddress', verifyUser, async (req, res, next) => {
  const deleteAddress = await userHelpers.deleteAddress(req.session.user._id, req.query.addressId)
  res.json(response)
});

router.post('/updateProfile', verifyUser, async (req, res) => {
  let updatedUser = await userHelpers.updateAndFetchProfile(req.body)
  response.UserName = updatedUser.UserName
  response.UserEmail = updatedUser.UserName
  response.MobileNo = updatedUser.MobileNo
  res.json(response)
})


router.get('/cart', verifyUser, async (req, res, next) => {
  let userId = req.session.user._id                                              //also need to pass to hbs
  const headerDetails = await userHelpers.getHeaderDetails(req.session.user._id)
  userHelpers.getCartProducts(req.session.user._id).then(async (products) => {
    res.render('users/cart', { products, userId, headerDetails });
  })
});

router.get('/add-to-cart/:id', verifyUser, async (req, res, next) => {
  if (req.session.user == null) {
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


router.get('/wishlist', verifyUser, async (req, res, next) => {
  const headerDetails = await userHelpers.getHeaderDetails(req.session.user._id)
  const productDetails = await wishlistHelper.getWishList(req.session.user._id)
  res.render('users/wishlist', {  headerDetails, productDetails });
});

router.get('/add-to-wishlist/:id', verifyUser, async (req, res, next) => {
  if (req.session.user == null) {
    res.json({ status: false })
  } else {
    wishlistHelper.addToWishList(req.params.id, req.session.user._id).then(async () => {
      res.json({ status: true })
    })
  }
})

router.post('/removeWishlist', verifyUser, async (req, res, next) => {
  if (req.session.user == null) {
    res.json({ status: false })
  } else {
    wishlistHelper.deleteWishList(req.body).then(async (response) => {
      res.json({ status: true })
    })
  }
})

router.post('/addToCartWishlist', verifyUser, async (req, res, next) => {
  let proId = req.body.proId
  if (req.session.user == null) {
    res.json({ status: false })
  } else {
    userHelpers.addToCart(proId, req.session.user._id).then(async () => {
      const headerDetails = await userHelpers.getHeaderDetails(req.session.user._id)
      cartCount = await userHelpers.getCartCount(req.session.user._id)
      wishlistHelper.deleteWishList(req.body).then(async (response) => {
        res.json({ status: true })
      })
    })
  }
})




router.post('/change-product-quantity', verifyUser, (req, res, next) => {
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalAmount(req.body.user)
    res.json(response)
  })
})

router.post('/removeProduct', verifyUser, (req, res, next) => {
  userHelpers.removeProduct(req.body).then(async (response) => {
    // response.total = await userHelpers.getTotalAmount(req.body.user)
    res.json(response)
  })
})

router.get('/ProceedToCheckOut', verifyUser, async (req, res) => {
  const products = await userHelpers.getCartProducts(req.session.user._id)
  const headerDetails = await userHelpers.getHeaderDetails(req.session.user._id)
  const address = await userHelpers.getAllAddress(req.session.user._id)
  res.render('users/placeOrder', { products, headerDetails, address })
})

router.post('/placeOrder', verifyUser, async (req, res) => {
  const couponApplied = parseInt(req.body.couponApplied)
  const products = await userHelpers.getCartProductsList(req.body.userId)
  const totalPrice = await userHelpers.getTotalAmount(req.body.userId)
  const cartDetailsWithOffer = await userHelpers.getCartProductsWithOffer(req.body.userId, totalPrice, req.body.couponApplied) //passing for implementing the coupon discount product level
  userHelpers.placeOrder(req.body, products, cartDetailsWithOffer, totalPrice, couponApplied).then((orderId) => {
    if (req.body['payment_method'] === 'COD') {
      cartCount = 0
      response.orderId = orderId
      response.codSuccess = true
      res.json(response)
    } else if (req.body['payment_method'] === 'ONLINE') {
      userHelpers.generateRazorpay(orderId, totalPrice).then((response) => {
        response.razor = true
        res.json(response)
      })

    } else if (req.body['payment_method'] === 'PAYPAL') {
      let payment = {
        "intent": "authorize",
        "payer": {
          "payment_method": "paypal"
        },
        "redirect_urls": {
          "return_url": "http://localhost:3000/orderSuccess/" + orderId,
          "cancel_url": "http://localhost:3000/paymentFailed/" + orderId
        },
        "transactions": [{
          "amount": {
            "total": totalPrice,
            "currency": "USD"
          },
          "description": orderId
        }]
      }
      userHelpers.createPay(payment).then((transaction) => {
        var id = transaction.id;
        var links = transaction.links;
        var counter = links.length;
        while (counter--) {
          if (links[counter].rel == 'approval_url') {
            transaction.payPal = true
            transaction.linkto = links[counter].href
            transaction.orderId = orderId
            res.json(transaction)

          }
        }
      })
        .catch((err) => {
          console.log(err);
          res.redirect('/err');
        });


    }
  })
})

router.get('/paymentFailed/:orderId', verifyUser, async (req, res) => {
  const deletePendingOrder = await userHelpers.deletePendingOrder(req.params.orderId)
  const headerDetails = await userHelpers.getHeaderDetails(req.session.user._id)
  res.render('users/paymentFailed', { headerDetails})
})

router.post('/verify-payment', (req, res) => {
  userHelpers.verifyPayment(req.body).then(() => {
    response.orderId = req.body['order[receipt]']
    response.status = true
    res.json(response)
  }).catch((err) => {
    console.log(err);
    res.json({ status: false })
  })
})

router.get('/clearCart', verifyUser, (req, res) => {
  userHelpers.clearCart(req.session.user._id).then(() => {
    res.redirect('/cart')
  })
})

router.get('/orderSuccess/:orderId', verifyUser, async (req, res) => {
  const changeStatus = await userHelpers.changePaymentStatus(req.params.orderId, req.session.user._id)
  const headerDetails = await userHelpers.getHeaderDetails(req.session.user._id)
  res.render('users/orderSuccess', { headerDetails })
})

router.get('/viewOrders', verifyUser, async (req, res) => {
  res.redirect('/account')
})

router.get('/orderDetails/:id', verifyUser, async (req, res) => {
  //let productDetails = await userHelpers.orderProductDetails(req.params.id)
  const headerDetails = await userHelpers.getHeaderDetails(req.session.user._id)
  let orderDetails = await userHelpers.getOrderDetails(req.params.id)
  let oldProductDetails = await userHelpers.oldProductDetails(req.params.id)
  oldProductDetails.forEach(cartDetails => {
    cartDetails.orderId = orderDetails._id
  })//added order id in to  the 'oldProductDetails' for accessing while on button click
  res.render('users/orderDetails', {  orderDetails, oldProductDetails, headerDetails })
})

router.get('/cancelTheOrder', verifyUser, (req, res) => {
  let Id = {}
  Id.proId = req.query.proId,
    Id.orderId = req.query.orderId
  userHelpers.cancelOrder(Id).then(() => {
    res.json(response)
  })
})

router.get('/getSearch', async (req, res) => {
  let response = await productHelpers.getProductsBySearch(req.query.searchKey)
  res.json(response)
})

module.exports = router;
