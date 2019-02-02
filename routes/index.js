var express = require('express');
var request = require('request');
var router = express.Router();

/* GET home page. */
router.post('/', function(req, res, next) {

    console.log(req.body.response_url);
   
    request.post(
	req.body.response_url.replace("https://consult.hscr.kcl.ac.uk", "http://localhost:8065"),
	{ json: {
		"response_type": "ephemeral", 
		"text": `
			---
			#### Weather in Toronto, Ontario for the Week of February 16th, 2016

			| Day                 | Description                      | High   | Low    |
				|:--------------------|:---------------------------------|:-------|:-------|
				| Monday, Feb. 15     | Cloudy with a chance of flurries | 3 °C   | -12 °C |
				| Tuesday, Feb. 16    | Sunny                            | 4 °C   | -8 °C  |
				| Wednesday, Feb. 17  | Partly cloudly                   | 4 °C   | -14 °C |
				| Thursday, Feb. 18   | Cloudy with a chance of rain     | 2 °C   | -13 °C |
				| Friday, Feb. 19     | Overcast                         | 5 °C   | -7 °C  |
				| Saturday, Feb. 20   | Sunny with cloudy patches        | 7 °C   | -4 °C  |
				| Sunday, Feb. 21     | Partly cloudy                    | 6 °C   | -9 °C  |
				---
			`
		}
	
	},
	function (error, response, body) {
		console.log(response.statusCode);
		if (!error && response.statusCode == 200) {
			console.log(body)
		} else {
			console.log(error)
		}
	});

    res.end();

});

module.exports = router;
