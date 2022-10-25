const { request } = require('express');
var express = require('express');
const userHelpers = require('../helpers/user-helpers');
var router = express.Router();
const userHelper=require('../helpers/user-helpers')


const adminUser = "admin"
const adminPassword = "123"

const verifyAdmin = (req, res, next) => {
  if (req.session.admin) {
    next();
  } else {
    //  next();  
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
  res.render('admin/dash',{ layout: 'admin-layout' });
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
router.get('/view-products', verifyAdmin, (req, res, next) => {
  res.render('admin/view-products', { layout: 'admin-layout' })
})

router.get('/addProduct', verifyAdmin, (req, res, next) => {

  res.render('admin/addProduct', { layout: 'admin-layout' })
})







module.exports = router;
