// Imports
const express = require('express');
const session = require('express-session')
const path = require('path');
const favicon = require('serve-favicon');
const morgan = require('morgan');
const logger = require('./config/winston');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const request = require('request');
const auth = require('basic-auth');
const grant = require('grant-express')

// Environment variables
require('dotenv').config()

// Config
const config = require('config');

// Models
const models = require('./models');

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
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(morgan('combined', { stream: logger.stream }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

///////////////////////////

const grantConfig = require('./grant-config.json');
grantConfig["garmin"]["key"] = config.get('garmin.CONSUMER_KEY');
grantConfig["garmin"]["secret"] = config.get('garmin.SECRET');
app.use('/garmin', grant(grantConfig));

///////////////////////////

// Routes
const register = require('./routes/register');
const connect = require('./routes/connect');
const data = require('./routes/data');
const ping = require('./routes/ping');
const simulate = require('./routes/simulate');

const amqp = require('amqplib');
const QueueMessage = require('./lib/messages/queueMessage');
const HTTPMessage = require('./lib/messages/httpMessage');

// Route setup involving async
function init() {

  if ( config.get('message_queue.ACTIVE') == true ) {

    amqp.connect('amqp://' + config.get('message_queue.HOST')).then(function(connection) {

      logger.info("Connected to " + config.get('message_queue.HOST'));
      router.use('/simulate', simulate(new QueueMessage(connection, config.get('message_queue.NAME'))));
      router.use('/', ping(new QueueMessage(connection, config.get('message_queue.NAME'))));
      start();

    }).catch(function(error) {

      logger.info(error);
      // Retry connection if server is not ready.
      setTimeout(init, 5000);

    });

  } else {

    router.use('/simulate', simulate(new HTTPMessage()));
    router.use('/', ping(new HTTPMessage()));
    start();

  }

}

function start() {

  router.use('/', connect);

  router.use('/', function(req, res, next) {

    const credentials = auth(req)

    if ( !credentials || credentials.name !== config.get('credentials.USERNAME') || credentials.pass !== config.get('credentials.PASSWORD') ) {

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

    logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

    // render the error page
    res.status(err.status || 500);
    res.render('error');
  });

  try {
    app.listen(process.env.PORT || '3001')
  } catch(err) {
    logger.error(err);
  }

}

init();

module.exports = app;
