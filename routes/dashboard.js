var express = require('express');
var request = require('request');
var router = express.Router();
const config = require('../lib/config');
const util = require('../lib/util');
const nokiaUtil= require('../lib/nokiaUtil');
var models = require('../models');

function getData(req, res, user, address, action, extra_params, jsonID) {

		nokiaUtil.getData(req, res, user, address, action, extra_params, function(data) {

				console.log(data);

				if ( data.length > 0 ) {

						var parsedBody = JSON.parse(nokiaUtil.translateNokiaData(data))["body"][jsonID];

						for ( element in parsedBody ) {

								if ( parsedBody[element]["date"] != undefined ) {

								    if ( util.unixTimestamp(parsedBody[element]["date"]) ) {

		                    var date = new Date(parseInt(parsedBody[element]["date"]) * 1000);

		                    var hours = date.getHours();

		                    var minutes = "0" + date.getMinutes();

		                    var seconds = "0" + date.getSeconds();

		                    var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);

		                    parsedBody[element]["date"] = formattedTime + " " + date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();

		                }

								}

						}

						res.send( JSON.stringify(parsedBody) );

				} else {

						res.send( "User not found." );

				}

		});

}

function queryAction(req, res, action) {

	  models.users.findOne({

		    where: {

		      patientID: req.params.patientID

		    },

	  }).then(function(user) {

	  		params = {};
	      //params["meastype"] = 11
	  		getData(req, res, user, config.URLS[action], action, params, config.TYPES[action]);

	  });

}

router.get('/:patientID', function(req, res, next) {

    queryAction(req, res, "getmeas");

});

router.get('/:patientID/:action', function(req, res, next) {

    queryAction(req, res, req.params.action);

});

router.get('/:patientID/:action/:date', function(req, res, next) {

	  var patientID = req.params.patientID;

	  models.users.findOne({

		    where: {

		      patientID: patientID

		    },

	  }).then(function(user) {

		    params = {};
		    params["date"] = req.params.date;
				getData(req, res, user, config.URLS[req.params.action], req.params.action, params, config.TYPES[req.params.action]);

	  });

});

router.get('/:patientID/:action/:start/:end', function(req, res, next) {

    var patientID = req.params.patientID;

    models.users.findOne({

	      where: {

	        	patientID: patientID

	      },

    }).then(function(user) {

				// To accomodate different date formats for different endpoints.
	      if ( !config.START[req.params.action].includes("ymd") && (!util.unixTimestamp(req.params.start) || !util.unixTimestamp(req.params.end) ) ) {

	          req.params.start = new Date(req.params.start).getTime() / 1000;
	          req.params.end = new Date(req.params.end).getTime() / 1000;

	      }

		    params = {};
		    params[config.START[req.params.action]] = req.params.start;
		    params[config.END[req.params.action]] = req.params.end;
				getData(req, res, user, config.URLS[req.params.action], req.params.action, params, config.TYPES[req.params.action]);

    });

});

module.exports = router;
