var express = require('express');
var router = express.Router();

const adminUser = "admin"
const adminPassword ="123"

const verifyAdmin=(req,res,next)=>{
  if(req.session.admin){
    next();
  }else{
    res.render('admin/admin-login',{layout: 'admin-layout',admin:true});
  }
}



/* GET users listing. */

router.get('/',verifyAdmin, function(req, res, next) {
  res.redirect('/admin/dash'); 
});
 

router.post('/dash', function(req, res, next) {
  const adminKey= {username,password}=req.body
  if(username === adminUser && password === adminPassword){
    req.session.admin=adminKey
    res.redirect('/admin/dash');   
  }else{
    res.redirect('/admin');
  }
});

router.get('/dash',verifyAdmin, function(req, res, next) {
    res.render('admin/dash', {layout: 'admin-layout'});
});

router.get('/view-users',verifyAdmin,(req,res,next)=>{
  res.render('admin/view-users',{layout: 'admin-layout'})
})

router.get('/view-products',verifyAdmin,(req,res,next)=>{
  res.render('admin/view-products',{layout: 'admin-layout'})
})
router.get('/signOut',verifyAdmin,(req,res,next)=>{
  req.session.destroy()
  res.redirect('/admin')
})
 






module.exports = router;  
  