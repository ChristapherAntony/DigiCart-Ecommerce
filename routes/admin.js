const { request, response } = require('express');
var express = require('express');
const { ProfilingLevel } = require('mongodb');
const userHelpers = require('../helpers/user-helpers');
var router = express.Router();
const userHelper = require('../helpers/user-helpers')
const productHelpers = require('../helpers/product-helpers');
const categoryHelpers = require('../helpers/category-helpers');
const adminHelpers = require('../helpers/admin-helpers');
const multer = require('multer')

/***********multer for products imgs*/
const multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images/product-img");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
})
const upload = multer({ storage: multerStorage });
const uploadMultiple = upload.fields([{ name: 'image1', maxCount: 1 }, { name: 'image2', maxCount: 1 }, { name: 'image3', maxCount: 1 }, { name: 'image4', maxCount: 1 }])
/************************multer  */
const multerStorageCategory = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images/category-img");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
})
const uploadOne = multer({ storage: multerStorageCategory });
const uploadSingleFile = uploadOne.fields([{ name: 'image', maxCount: 1 }])

/****************************** */

const verifyAdmin = (req, res, next) => {
  if (req.session.admin) {
    next();
  } else {
    next();

    //res.render('admin/admin-login', { layout: 'admin-layout', login: true });
  }
}
/* GET users listing. */

router.get('/', verifyAdmin, async function (req, res, next) {

  res.redirect('/admin/dash');
});


router.post('/dash', (req, res) => {
  userHelper.adminLogin(req.body).then((response) => {
    if (response.status) {
      //req.session.loggedIn = true
      req.session.admin = response.user

      res.redirect('/admin/dash')
    } else {
      res.redirect('/admin/dash')
    }
  })
})

router.get('/dash', verifyAdmin, async function (req, res, next) {
  const DashDetails = await adminHelpers.getDashDetails()
  const SalesReport = await adminHelpers.getSalesReport()
  const products = await productHelpers.getAllProductsLookUP()
  const TopSelling = await adminHelpers.topSelling()
  const OrderHistory = await adminHelpers.getRecentOrderHistory()
  console.log('this is a order Histry');
  console.log(OrderHistory);
  res.render('admin/dash', { layout: 'admin-layout', DashDetails, SalesReport, products, TopSelling, OrderHistory });
});

router.get('/view-users', verifyAdmin, (req, res, next) => {
  userHelpers.getAllUsers().then((users) => {
    res.render('admin/view-users', { users, layout: 'admin-layout' })
  })
})

router.get('/block/:id', verifyAdmin, function (req, res) {
  let userID = req.params.id
  userHelpers.blockUser(userID)
  res.redirect('/admin/view-users')
})

router.get('/unBlock/:id', verifyAdmin, function (req, res) {
  let userID = req.params.id
  userHelpers.unBlockUser(userID)
  res.redirect('/admin/view-users')

})

router.get('/signOut', verifyAdmin, (req, res, next) => {
  req.session.destroy()
  res.redirect('/admin')
})

// product section starts here

//category----starts here<<<<<<<<<


router.get('/product-category', verifyAdmin, (req, res, next) => {
  categoryHelpers.getAllCategory().then((category) => {
    res.render('admin/product-category', { layout: 'admin-layout', category })
  })
})

router.get('/add-category', verifyAdmin, (req, res, next) => {
  res.render('admin/add-category', { layout: 'admin-layout' })
})


router.post('/addNewCategory', uploadSingleFile, (req, res, next) => {
  req.body.image = req.files.image[0].filename
  categoryHelpers.addCategory(req.body)
  res.redirect("/admin/product-category")

})

router.get('/edit-category/:id', async (req, res) => {
  let categoryId = req.params.id
  let categoryDetails = await categoryHelpers.getCategoryDetails(categoryId)
  res.render('admin/edit-category', { categoryDetails, layout: 'admin-layout' })
})

router.post('/update-category/:id', uploadSingleFile, async (req, res) => {
  if (req.files.image == null) {
    Image1 = await productHelpers.fetchImage(req.params.id)
  } else {
    Image1 = req.files.image[0].filename
  }
  req.body.image = Image1
  categoryHelpers.updateCategory(req.params.id, req.body).then(() => {
    res.redirect('/admin/product-category')


  })
})

router.get('/delete-category/:id', verifyAdmin, (req, res, next) => {
  let categoryId = req.params.id
  categoryHelpers.deleteCategory(categoryId).then((response) => {
    res.redirect('/admin/product-category')
  })
})


//category section ends here>>>>>>>

//products----starts here<<<<<<<<<
router.get('/view-products', verifyAdmin, (req, res, next) => {
  productHelpers.getAllProductsLookUP().then((products) => {

    res.render('admin/view-products', { layout: 'admin-layout', products })
  })
})

/*********** */

/********** */



router.get('/add-product', verifyAdmin, (req, res, next) => {
  categoryHelpers.getAllCategory().then((category) => {
    res.render('admin/add-product', { layout: 'admin-layout', category })
  })
})
router.get('/getCategoryDiscount', verifyAdmin, (req, res, next) => {
  console.log(req.query.categoryName);
  console.log("api call");
  categoryHelpers.getCategoryDiscount(req.query.categoryName).then((response) => {
    console.log(req.query.categoryName, "===", response);
    res.json(response)
  })
})


router.post('/add-products', uploadMultiple, (req, res) => {
  req.body.image1 = req.files.image1[0].filename
  req.body.image2 = req.files.image2[0].filename
  req.body.image3 = req.files.image3[0].filename
  req.body.image4 = req.files.image4[0].filename

  req.body.costPrice = parseInt(req.body.costPrice),
    req.body.MRP = parseInt(req.body.MRP),
    req.body.categoryDiscount = parseInt(req.body.categoryDiscount),
    req.body.productDiscount = parseInt(req.body.productDiscount),
    req.body.totalDiscount = parseInt(req.body.totalDiscount),
    req.body.offerPrice = parseInt(req.body.offerPrice),
    req.body.stock = parseInt(req.body.stock)

  productHelpers.addProduct(req.body)
  res.redirect('/admin/view-products')
})



router.get('/edit-product/:id', verifyAdmin, async (req, res, next) => {
  let productId = req.params.id   //to get the clicked item id
  let product = await productHelpers.getProductDetails(productId)
  let productCategory = await productHelpers.getProductCategory(product.category)
  productCategoryName = productCategory.category
  categoryHelpers.getAllCategory().then((category) => {
    res.render('admin/edit-product', { category, layout: 'admin-layout', product, productCategoryName })
  })

})

router.post('/update-product/:id', uploadMultiple, async (req, res) => {

  if (req.files.image1 == null) {
    Image1 = await productHelpers.fetchImage1(req.params.id)
  } else {
    Image1 = req.files.image1[0].filename
  }
  if (req.files.image2 == null) {
    Image2 = await productHelpers.fetchImage2(req.params.id)
  } else {
    Image2 = req.files.image2[0].filename
  }
  if (req.files.image3 == null) {
    Image3 = await productHelpers.fetchImage3(req.params.id)
  } else {
    Image3 = req.files.image3[0].filename
  }
  if (req.files.image4 == null) {
    Image4 = await productHelpers.fetchImage4(req.params.id)
  } else {
    Image4 = req.files.image4[0].filename
  }
  req.body.image1 = Image1
  req.body.image2 = Image2
  req.body.image3 = Image3
  req.body.image4 = Image4

  productHelpers.updateProduct(req.params.id, req.body).then(() => {
    res.redirect('/admin/view-products')
  })
})


router.get('/delete-product/:id', verifyAdmin, (req, res, next) => {
  productHelpers.deleteProduct(req.params.id).then((response) => {
    res.redirect('/admin/view-products',)
  })
})

router.get('/viewOrders', verifyAdmin, (req, res, next) => {
  adminHelpers.getOrderHistory().then((OrderHistory) => {
    res.render('admin/View_Orders', { layout: 'admin-layout', OrderHistory })
  })
})


router.get('/viewOrdersDetails/:id', verifyAdmin, async (req, res, next) => {
  let orderDetails = await adminHelpers.getOrderDetails(req.params.id)
  //let orderDetailsProducts = await adminHelpers.orderDetailsProducts(req.params.id) // old method chnaged to static
  let orderProductsDetails = await userHelpers.oldProductDetails(req.params.id)
  console.log(orderProductsDetails);
  console.log('hello');
  console.log(orderDetails);


  orderProductsDetails.forEach(cartDetails => {
    cartDetails.orderId = orderDetails._id
  })//added order id in to  the 'oldProductDetails' for accessing while on button click
  console.log(orderProductsDetails);
  res.render('admin/View_Order_Details', { layout: 'admin-layout', orderDetails, orderProductsDetails })
})

router.post('/changeDeliveryStatus', verifyAdmin, (req, res) => {
  adminHelpers.changeDeliveryStatus(req.body).then((response) => {
    res.json({ status: true })

  })
})

router.get('/view_Sales_Report', verifyAdmin, async (req, res, next) => {

  const SalesReport = await adminHelpers.getSalesReport()
  res.render('admin/view_Sales_Report', { layout: 'admin-layout', SalesReport })

})
router.post('/searchByDate', verifyAdmin, async (req, res, next) => {
  let dateRange = {}
  if (req.body.fromDate === "" || req.body.toDate === "") {
    res.redirect('/admin/view_Sales_Report')
  } else {
    dateRange.fromDate = req.body.fromDate
    dateRange.toDate = req.body.toDate
  }
  const SalesReport = await adminHelpers.getSalesReportByDate(dateRange)
  res.render('admin/view_Sales_Report', { layout: 'admin-layout', SalesReport })

})


// view Profile
router.get('/profile', verifyAdmin, (req, res, next) => {
  res.render('admin/profile', { layout: 'admin-layout' })
})
// view Settingds


module.exports = router;
