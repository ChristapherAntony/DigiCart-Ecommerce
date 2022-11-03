const { request } = require('express');
var express = require('express');
const { ProfilingLevel } = require('mongodb');
const userHelpers = require('../helpers/user-helpers');
var router = express.Router();
const userHelper = require('../helpers/user-helpers')
const productHelpers = require('../helpers/product-helpers');
const categoryHelpers = require('../helpers/category-helpers');
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

router.get('/', verifyAdmin, function (req, res, next) {
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

router.get('/dash', verifyAdmin, function (req, res, next) {
  res.render('admin/dash', { layout: 'admin-layout' });
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


router.post('/add-products', uploadMultiple, (req, res) => {
  req.body.image1 = req.files.image1[0].filename
  req.body.image2 = req.files.image2[0].filename
  req.body.image3 = req.files.image3[0].filename
  req.body.image4 = req.files.image4[0].filename
  
  req.body.actualPrice=parseInt(req.body.actualPrice) ,
  req.body.sellingPrice=parseInt(req.body.sellingPrice),
  req.body.discount=parseInt(req.body.discount) ,
  req.body.offerPrice=parseInt(req.body.offerPrice),
  req.body.stock=parseInt(req.body.stock)
  
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








//products section ends here>>>>>>>>>












// view Profile
router.get('/profile', verifyAdmin, (req, res, next) => {
  res.render('admin/profile', { layout: 'admin-layout' })
})
// view Settingds


module.exports = router;
