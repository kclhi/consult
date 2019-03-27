const request = require('request');
const fs = require('fs');
const config = require('config');
const utils = require('../lib/utils');
const logger = require('../config/winston');

class Provenance {

  static httpRequest(method, action, params, callback) {

    const URL = config.get('provenance_server.URL') + "/" + action;
    const headers = {'Content-Type' : 'application/json'}

    request({

      url: URL,
      headers: headers,
      method: method,
      qs: params

    }, function (error, response, body) {

      if ( error || (response && response.statusCode >= 400) ) {

        logger.error("Cannot contact provenance server. " + error + " " + ( ( body && typeof body === "object" ) ? JSON.stringify(body) : body ) + " " + ( response && response.statusCode ? response.statusCode : "Status unknown." ));
        callback({});

      } else {

        callback(body);

      }

    });

  }

  static get(action, params, callback) {

    this.httpRequest("GET", action, params, callback)

  }

  static post(action, params, callback) {

    this.httpRequest("POST", action, params, callback)

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

    Provenance.new(documentID, 'http://name.space', function(newBody) {

      Provenance.namespace(documentID, 'sub', 'http://sub.name.space', function(namespaceBody) {

        const template = fs.readFileSync(templatePath, 'utf8');

        Provenance.register(documentID, templateID, template, function(registerBody) {

          Provenance.generate(documentID, templateID, fragmentID, fragment, function(generateBody) {

            callback(generateBody);

          });

        });

      });

    });

  }

}

module.exports = Provenance;
