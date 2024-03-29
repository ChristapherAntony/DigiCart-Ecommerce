var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs = require('express-handlebars');
var usersRouter = require('./routes/users');
var adminRouter = require('./routes/admin');
var app = express();
var session = require('express-session')  // session npm 
const nocache = require("nocache");



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs.engine({
  extname: 'hbs', defaultLayout: 'layout',
  layoutsDir: __dirname + '/views/layout/',
  partialsDir: __dirname + '/views/partials',
  helpers: {
    isEqual: (status, value, options) => {
      if (status == value) {
        return options.fn(this)
      }
      return options.inverse(this)
    }
  }
}))
//app.engine('hbs', hbs.engine({ extname: 'hbs', defaultLayout: 'admin-layout', layoutsDir: __dirname + '/views/admin-layout/', partialsDir: __dirname + '/views/partials' }))

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ resave: true, saveUninitialized: true, secret: "Key", cookie: { maxAge: 6000000 } })) // session use
app.use(nocache());



app.use('/', usersRouter);
app.use('/admin', adminRouter);
// app.get('*',(req,res)=>{
//   res.render('error')
// })

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  // res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
