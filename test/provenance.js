let chai = require('chai');
let should = chai.should();
let expect = chai.expect;

const config = require('../lib/config');
const provenance = require('../lib/provenance');
const fs = require('fs');
const uuidv1 = require('uuid/v1');

chai.use(require('chai-http'));

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

			var document = fs.readFileSync('provenance-templates/template-bp-fragment.json', 'utf8');
		  document = document.replace("[pid]", uuidv1());
		  document = document.replace("[company]", "ACME Inc.");
		  document = document.replace("[code]", uuidv1());
		  document = document.replace("[value]", uuidv1());

		  const ID = uuidv1();
		  provenance.add(ID, document, "temp-" + uuidv1(), "provenance-templates/template-bp.json", function(response) {

		    response.should.have.status(200);
				done();

		  });

		});

	});

});
