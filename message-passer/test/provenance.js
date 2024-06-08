let chai = require('chai');
let should = chai.should();
let expect = chai.expect;

const config = require('../lib/config');
const provenance = require('../lib/provenance');
const fs = require('fs');
const { v1: uuidv1 } = require('uuid');

chai.use(require('chai-http'));

function createDocument() {

	var document = fs.readFileSync('provenance-templates/template-bp-fragment.json', 'utf8');
	document = document.replace("[pid]", uuidv1());
	document = document.replace("[company]", "ACME Inc.");
	document = document.replace("[code]", uuidv1());
	document = document.replace("[value]", uuidv1());
	return document;

}

describe('provenance', () => {

	describe('/GET Template list (reachable)', () => {

		it('Template list should be reachable.', (done) => {

			chai.request(config.PROVENANCE_SERVER_URL)
				.get('/list')
	        .end((err, res) => {

	        		res.should.have.status(200);
	        		done();

	        });

		});

	});

	describe('/POST Add template', () => {

		it('Should be able to add sample template', (done) => {

		  provenance.add(uuidv1(), createDocument(), "temp-0", "provenance-templates/template-bp.json", function(response) {

		    response.should.have.status(200);
				done();

			});

		});

	});

	describe('/POST Add two documents with same template', () => {

		it('Should be able to have shared template', (done) => {

		  provenance.add(uuidv1(), createDocument(), "temp-0", "provenance-templates/template-bp.json", function(response) {

				response.should.have.status(200);

				provenance.add(uuidv1(), createDocument(), "temp-0", "provenance-templates/template-bp.json", function(response) {

					response.should.have.status(200);
					done();

			  });

		  });

		});

	});

});
