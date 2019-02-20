const request = require('request');
const fs = require('fs');

class Provenance {

    static post(method, params, callback) {

        const URL = 'http://localhost:8080/'
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

        const URL = 'http://localhost:8080/'
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

    static list_documents(callback=function(response){}) {

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

    static test() {

        Provenance.new('test-data1', 'http://name.space', function(response) {

            Provenance.namespace('test-data1', 'sub', 'http://sub.name.space', function(response) {

                const t = fs.readFileSync('provenance-templates/template-bp.json', 'utf8');
                Provenance.register('test-data1', 'test-temp1', t, function(response) {

                    const s = fs.readFileSync('provenance-templates/template-bp-fragment.json', 'utf8');
                    Provenance.generate('test-data1', 'test-temp1', 'test-frag1', s, function(response) {

                        Provenance.list_documents(function(response) {

                            JSON.parse(response).forEach(function(ident) {

                                console.log(ident);

                            });

                            console.log();

                            Provenance.exportItem('test-data1', 'document', function(response) { console.log(response); });

                        });

                    });

                });

            });

        });

    }

}

module.exports = Provenance;
