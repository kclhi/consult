// Imports
var express = require('express');
var session = require('express-session')
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var request = require('request');
var auth = require('basic-auth');
var grant = require('grant-express')
var auth = require('basic-auth');

// Environment variables
require('dotenv').config()

// Models
var models = require('./models');

// Libs
const config = require('./lib/config');

// Express app and master router
var app = express();
var router = express.Router();

// Session
var session = require('express-session');
app.use(session({
    resave: true,
    saveUninitialized: true,
    name: "name",
    secret: "secret"
}));

// Views
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Default use
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

///////////////////////////

var grantConfig = require('./grant-config.json');
grantConfig["garmin"]["key"] = config.GARMIN_CONSUMER_KEY;
grantConfig["garmin"]["secret"] = config.GARMIN_SECRET;
app.use('/garmin', grant(grantConfig));

///////////////////////////

var register = require('./routes/register');
var connect = require('./routes/connect');
var data = require('./routes/data');
var ping = require('./routes/ping');

router.use('/', ping);
router.use('/', connect);

router.use('/', function(req, res, next) {

  var credentials = auth(req)

  if ( !credentials || credentials.name !== config.USERNAME || credentials.pass !== config.PASSWORD ) {

      res.status(401);
      res.header('WWW-Authenticate', 'Basic realm="forbidden"');
      res.send('Access denied');

  } else {

      next();

  }

});

router.use('/register', register);
router.use('/data', data);

app.use('/garmin', router);

///////////////////////////

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
