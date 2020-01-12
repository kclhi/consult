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
const schedule = require('node-schedule');

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

// Routes
const simulate = require('./routes/simulate');
const register = require('./routes/register');
const medi = require('./lib/medi');

const amqp = require('amqplib');
const QueueMessage = require('./lib/messages/queueMessage');
const HTTPMessage = require('./lib/messages/httpMessage');

function pollMedi(messageObject) {

  var poll = schedule.scheduleJob("*/" + config.get("vitalpatch.POLL_INTERVAL") + " * * * *", function(){

    models.users.findAll({raw: true}).then(function(users) {

      users.forEach(function(user) {

        medi.getAndForward(user.patientId, config.get("ehr.DEFAULT_PRACTITIONER_ID"), user.patchId, messageObject);

      });

    });

  });

}

// Route setup involving async
function init() {

  if ( config.get('message_queue.ACTIVE') == true ) {

    return amqp.connect('amqp://' + config.get('message_queue.HOST')).then(function(connection) {

      console.log("Connected to " + config.get('message_queue.HOST'));
      router.use('/simulate', simulate(new QueueMessage(connection, config.get('message_queue.NAME'))));
      router.use('/register', register(new QueueMessage(connection, config.get('message_queue.NAME'))));
      pollMedi(messageObject);

    }).catch(function(error) {

      console.log(error);
      return setTimeout(init, 5000);

    });

  } else {

    router.use('/simulate', simulate(new HTTPMessage()));
    router.use('/register', register(new HTTPMessage()));
    pollMedi(new HTTPMessage());
    return Promise.resolve();

  }

}

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

app.use('/vitalpatch', router);

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

init().then(() => app.listen(process.env.PORT || '3008')).catch(err => console.error(err));

module.exports = app;
