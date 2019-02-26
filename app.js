const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const async = require('async');
const fs = require('fs')

const utils = require('./lib/utils.js')
const config = require('./lib/config.js')

// Environment variables
require('dotenv').config()

var indexRouter = require('./routes/index');

var app = express();
var router = express.Router();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

router.use('/', indexRouter);

app.use('/convert', router);

app.post('/populate', function(req, res, next) {

  fhirResources = [["Organization", "organization"],
                   ["Practitioner",	"practitioner"],
                   ["Patient", "patient"],
                   ["Condition", "condition-oa"],
                   ["Condition", "condition-hypertension"],
                   ["Medication", "medication-nsaid"],
                   ["Medication", "medication-thiazide"],
                   ["MedicationDispense", "medication-dispense-nsaid"],
                   ["MedicationDispense", "medication-dispense-thiazide"],
                   ["Subscription", "subscription"]];

  async.eachSeries(fhirResources, function (resource, next){

    const url = config.FHIR_SERVER_URL + config.FHIR_REST_ENDPOINT + resource[0] + "?_format=json";

    utils.callFHIRServer(url, fs.readFileSync("fhir-json-templates/" + resource[1] + ".json", 'utf8'), function(statusCode) {

      console.log(resource[1] + ": " + statusCode);
      next();

    });

  }, function(err) {

    res.sendStatus(200);

  });

});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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
