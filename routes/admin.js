var express = require('express');
const userHelpers = require('../helpers/user-helpers');
var router = express.Router();



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

// jgfjgklf





router.post('/dash', function (req, res, next) {
  const adminKey = { username, password } = req.body
  if (username === adminUser && password === adminPassword) {
    req.session.admin = adminKey
    res.redirect('/admin/dash');
  } else {
    res.redirect('/admin/dash');
    // res.render('admin/admin-login',{layout: 'admin-layout',login:true});   

  }
});

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
router.get('/view-products', verifyAdmin, (req, res, next) => {
  res.render('admin/view-products', { layout: 'admin-layout' })
})

router.get('/addProduct', verifyAdmin, (req, res, next) => {

  res.render('admin/addProduct', { layout: 'admin-layout' })
})







module.exports = router;
