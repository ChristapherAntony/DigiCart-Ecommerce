const { request } = require('express');
var express = require('express');
const { ProfilingLevel } = require('mongodb');
const userHelpers = require('../helpers/user-helpers');
var router = express.Router();
const userHelper = require('../helpers/user-helpers')
const productHelpers = require('../helpers/product-helpers');
const categoryHelpers = require('../helpers/category-helpers');


const verifyAdmin = (req, res, next) => {
  if (req.session.admin) {
    next();
  } else {
    next();
    // rs
    res.render('admin/admin-login', { layout: 'admin-layout', login: true });
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

router.get('/block/:id', function (req, res) {
  let userID = req.params.id
  userHelpers.blockUser(userID)
  res.redirect('/admin/view-users')
})

router.get('/unBlock/:id', function (req, res) {
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
router.post('/add-category', verifyAdmin, (req, res, next) => {
  categoryHelpers.addCategory(req.body, (id) => {
    let image = req.files?.image
    console.log(image);
    if (image)
      image.mv('./public/images/category-img/' + id + '.jpg', (err) => {
        if (!err) {
          res.redirect("/admin/product-category")
        } else {
          console.log(err);
        }
      })
    else
      res.redirect("/admin/product-category")
  })
})

router.get('/edit-category/:id', async (req, res) => {
  let categoryId = req.params.id 
  let categoryDetails = await categoryHelpers.getCategoryDetails(categoryId)    
  res.render('admin/edit-category', {categoryDetails, layout: 'admin-layout' }) 
})

router.post('/update-category/:id', (req, res) => {
  let categoryId = req.params.id
  categoryHelpers.updateCategory(categoryId, req.body).then(() => {
    res.redirect('/admin/product-category')
    //to update img
    if (req.files?.image) {
      let image = req.files.image
      image.mv('./public/images/category-img/' + categoryId + '.jpg')
    }
  })
})


router.get('/delete-category/:id', verifyAdmin, (req, res, next) => {
  let categoryId = req.params.id
  categoryHelpers.deleteCategory(categoryId).then((response) => {
    console.log(response);
    res.redirect('/admin/product-category')
  })
})


//category section ends here>>>>>>>

//products----starts here<<<<<<<<<
router.get('/view-products', verifyAdmin, (req, res, next) => {
  res.render('admin/view-products', { layout: 'admin-layout' })
})

router.get('/add-Product', verifyAdmin, (req, res, next) => {

  res.render('admin/add-Product', { layout: 'admin-layout' })
})
//products section ends here>>>>>>>>>












// view Profile
router.get('/profile', verifyAdmin, (req, res, next) => {
  res.render('admin/profile', { layout: 'admin-layout' })
})
// view Settingds


module.exports = router;
