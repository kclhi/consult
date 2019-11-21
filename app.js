const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const logger = require('./config/winston');
const ldap = require('ldapjs');
const uuidv1 = require('uuid/v1');

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

const { patient, updateLDAPClient } = require('./routes/patient');
const observation = require('./routes/observation');
const questionnaireResponse = require('./routes/questionnaire-response');
const clinicalImpression = require('./routes/clinical-impression');
const auditEvent = require('./routes/audit-event');
const tips = require('./routes/tips');

// Route setup involving async
function init(callback) {

  var ldapClient = ldap.createClient({

    url: config.get("ldap_server.PROTOCOL") + "://" + config.get("ldap_server.HOST") + "/dc=consult,dc=kcl,dc=ac,dc=uk"

  });

  ldapClient.on('close', close => {

    logger.debug("Connection closed by LDAP server. Reconnecting...");
    init(()=>{});

  });

  ldapClient.on('error', error => {

    logger.error("Error connecting to LDAP server: " + error);
    setTimeout(init, 5000, callback);

  });

  ldapClient.on('connect', connect => {

    updateLDAPClient(ldapClient);
    logger.info("Connected to LDAP server.");
    callback();

  });

}

init(function() {

  app.use('/Patient', patient);
  app.use('/Observation', observation);
  app.use('/QuestionnaireResponse', questionnaireResponse);
  app.use('/ClinicalImpression', clinicalImpression);
  app.use('/AuditEvent', auditEvent);

  app.use('/tips', tips);

  // Add errors routes after async routes added.

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

    app.listen(process.env.PORT || '3005');
    logger.info("Main app started.");

  } catch(err) {

    console.error(err);

  }

});

module.exports = app;
