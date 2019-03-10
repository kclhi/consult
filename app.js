// Imports
const express = require('express');
const session = require('express-session')
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const request = require('request');
const auth = require('basic-auth');
const grant = require('grant-express')

// Environment variables
require('dotenv').config()

// Models
const models = require('./models');

// Libs
const config = require('./lib/config');

// Express app and master router
const app = express();
const router = express.Router();

// Session
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

const grantConfig = require('./grant-config.json');
grantConfig["garmin"]["key"] = config.GARMIN_CONSUMER_KEY;
grantConfig["garmin"]["secret"] = config.GARMIN_SECRET;
app.use('/garmin', grant(grantConfig));

///////////////////////////

// Routes
const register = require('./routes/register');
const connect = require('./routes/connect');
const data = require('./routes/data');
const ping = require('./routes/ping');
const simulate = require('./routes/simulate');

// Route setup involving async
function init() {

  if ( config.MESSAGE_QUEUE == true ) {

    var amqp = require('amqplib');
    var QueueMessage = require('./lib/messages/queueMessage');

    return amqp.connect('amqp://localhost').then(function(connection) {

      router.use('/simulate', simulate(new QueueMessage(connection, config.RABBIT_QUEUE)));

    }).catch(console.warn);

  } else {

    var HTTPMessage = require('./lib/messages/httpMessage');
    router.use('/simulate', simulate(new HTTPMessage()));
    return Promise.resolve();

  }

}

router.use('/', ping);
router.use('/', connect);

router.use('/', function(req, res, next) {

  const credentials = auth(req)

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

init().then(() => app.listen(process.env.PORT || '3000')).catch(err => console.error(err));

module.exports = app;
