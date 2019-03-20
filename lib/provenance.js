const request = require('request');
const fs = require('fs');
const config = require('../lib/config');
const utils = require('../lib/utils');

class Provenance {

  static post(method, params, callback) {

    const URL = config.PROVENANCE_SERVER_URL + "/" + method;
    const headers = {'Content-Type' : 'application/json'}

    request({

      url: URL,
      headers: headers,
      method: "POST",
      qs: params

    }, function (error, response, body) {

      if ( error || (response && response.statusCode >= 400) ) {

        callback(error + " " + ( response.body ? response.body.toString() : "" ) + " " + ( response.statusCode ? response.statusCode : "" ));

      } else {

        callback(response);

      }

    });

  }

  static get(method, params, callback) {

    const URL = config.PROVENANCE_SERVER_URL + "/" + method;
    const headers = {'Content-Type' : 'application/json'}

    request({

      url: URL,
      headers: headers,
      method: "GET",
      qs: params

    }, function (error, response, body) {

      if ( error || (response && response.statusCode >= 400) ) {

        callback(error + " " + ( response.body ? response.body.toString() : "" ) + " " + ( response.statusCode ? response.statusCode : "" ));

      } else {

        callback(response);

      }

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

    const documentID = "data-" + id;
    const fragmentID = "frag-" + id;

    fragment = utils.replaceAll(fragment, "\\[id\\]", id);

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

  }

}

module.exports = Provenance;
