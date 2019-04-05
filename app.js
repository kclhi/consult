const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const logger = require('./config/winston');
const ldap = require('ldapjs');

// Environment variables
require('dotenv').config();

const config = require('config');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(morgan('combined', { stream: logger.stream }));
app.use(express.json({ type: "application/fhir+json"}));
app.use(express.json({ type: "application/json"}));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const observation = require('./routes/observation');
const patient = require('./routes/patient');

// Route setup involving async
function init() {

  var ldapClient = ldap.createClient({

    url: config.get("ldap_server.PROTOCOL") + "://" + config.get("ldap_server.HOST") + "/dc=consult,dc=kcl,dc=ac,dc=uk"

  });

  ldapClient.on('error', error => {

    logger.error(error);
    return setTimeout(init, 5000);

  });

  ldapClient.on('connect', connect => {

    ldapClient.bind('cn=admin,dc=consult,dc=kcl,dc=ac,dc=uk', process.env.LDAP_MANAGER_PASSWORD, function(error) {

      if (error) {

        logger.error(error);
        return setTimeout(init, 5000);

      } else {

        app.use('/Patient', patient(ldapClient));
        logger.info("Connected to LDAP server.");
        start();

      }

    });

  });

}

// Add errors routes after async routes added.
function start() {

  app.use('/Observation', observation);

  // catch 404 and forward to error handler
  app.use(function(req, res, next) {

    next(createError(404));

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
    app.listen(process.env.PORT || '3005')
  } catch(err) {
    console.error(err);
  }

}

init();

module.exports = app;
