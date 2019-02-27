const request = require('request');
const fs = require('fs');
const config = require('../lib/config');

class Provenance {

    static post(method, params, callback) {

        const URL = config.PROVENANCE_SERVER_URL
        const headers = {'Content-Type' : 'application/json'}

        request({

            url: URL + method,
            headers: headers,
            method: "POST",
            qs: params,

        }, function (error, response, body) {

            callback(response.body);

        });

    }

    static get(method, params, callback) {

        const URL = config.PROVENANCE_SERVER_URL
        const headers = {'Content-Type' : 'application/json'}

        request({

            url: URL + method,
            headers: headers,
            method: "GET",
            qs: params,

        }, function (error, response, body) {

            callback(response.body);

        });

    }

    static new(identifier, default_namespace, callback=function(response){}) {

        const params = {'identifier' : identifier, 'defaultNamespace' : default_namespace}
        this.post('new', params, function(response) { callback(response) })

    }

    static namespace(identifier, prefix, namespace, callback=function(response){}) {

        const params = {'identifier' : identifier, 'prefix' : prefix, 'namespace' : namespace}
        this.post('namespace', params, function(response) { callback(response) });

    }

    static register(document_identifier, template_identifier, data, callback=function(response){}) {

        const params = {'documentIdentifier' : document_identifier, 'templateIdentifier' : template_identifier, 'data' : data}
        this.post('register', params, function(response) { callback(response) })

    }

    static generate(document_identifier, template_identifier, fragment_identifier, data, callback=function(response){}) {

        const params = {'documentIdentifier' : document_identifier, 'templateIdentifier' : template_identifier, 'fragmentIdentifier' : fragment_identifier, 'data' : data}
        this.post('generate', params, function(response) { callback(response) })

    }

    static listDocuments(callback=function(response){}) {

        this.get('list', {}, function(response) { callback(response) });

    }

    static delete(identifier, callback=function(response){}) {

        const params = {'identifier' : identifier}
        this.post('delete', params, function(response) { callback(response) })

    }

    static exportItem(identifier, doctype, callback=function(response){}) {

        const params = {'identifier' : identifier, 'docType' : doctype}
        this.get('export', params, function(response) { callback(response) })

    }

    static add(id, fragment, templateID, templatePath, callback) {

        // ID based on existing templates and data
        Provenance.listDocuments(function(documents) {

            const ID = id;
            const documentID = "data-" + ID;
            const fragmentID = "frag-" + ID;

            fragment = fragment.replace("[id]", ID);

            Provenance.new(documentID, 'http://name.space', function(newResponse) {

                Provenance.namespace(documentID, 'sub', 'http://sub.name.space', function(namespaceResponse) {

                    const template = fs.readFileSync(templatePath, 'utf8');

                    Provenance.register(documentID, templateID, template, function(registerResponse) {

                        Provenance.generate(documentID, templateID, fragmentID, fragment, function(generateResponse) {

                              callback(generateResponse);

                        });

                    });

                });

            });

        });

    }

    static test() {

        var data = fs.readFileSync('provenance-templates/template-bp-fragment.json', 'utf8');
        data = data.replace("[pid]", "3");
        data = data.replace("[company]", "Nokia");
        data = data.replace("[code]", "1234");
        data = data.replace("[value]", "1234");

        this.add("provenance-templates/template-bp.json", data);

    }

}

module.exports = Provenance;
