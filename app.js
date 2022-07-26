const createError = require('http-errors');
const express = require('express');

const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const hbs = require('express-handlebars');

const fileUpload = require('express-fileupload');
const db = require('./config/connection');
const session = require('express-session');

const usersRouter = require('./routes/users');
const adminRouter = require('./routes/admin');

const app = express();
const dotenv = require('dotenv')
  .config()
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs.engine({
  helpers:{
    inc:(value)=>{
      return parseInt(value)+1
    }
  },
  extname: 'hbs', defaultLayout: 'admin-layout', layoutsDir: __dirname + '/views/layouts/', partialsDir: __dirname + '/views/partials/' }));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());
app.use(session({ secret: "key", resave: false, saveUninitialized: true, cookie: { maxAge: 6000000 } }));

db.connect((err) => {
  if (err) console.log("Connection error" + err);
  else console.log("Database connected to port 27017");
}
);

app.use('/', usersRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  res.render('error/404')
  // next(createError(404))
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500)
  res.render('error/500');
});



module.exports = app;
