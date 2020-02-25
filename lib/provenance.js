const request = require('request');
const fs = require('fs');
const config = require('config');
const utils = require('../lib/utils');
const logger = require('../config/winston');

class Provenance {

  static httpRequest(method, action, params, port, callback) {

    const URL = config.get('provenance_server.URL').replace("8081", port) + "/" + action;
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

  static get(action, params, port, callback) {

    this.httpRequest("GET", action, params, port, callback)

  }

  static post(action, params, port, callback) {

    this.httpRequest("POST", action, params, port, callback)

  }

  static new(identifier, default_namespace, port, callback=function(response){}) {

    const params = {'identifier' : identifier, 'defaultNamespace' : default_namespace}
    this.post('new', params, port, function(response) { callback(response) })

  }

  static namespace(identifier, prefix, namespace, port, callback=function(response){}) {

    const params = {'identifier' : identifier, 'prefix' : prefix, 'namespace' : namespace}
    this.post('namespace', params, port, function(response) { callback(response) });

  }

  static register(document_identifier, template_identifier, data, port,  callback=function(response){}) {

    const params = {'documentIdentifier' : document_identifier, 'templateIdentifier' : template_identifier, 'templateData' : data}
    this.post('register', params, port, function(response) { callback(response) })

  }

  static generate(document_identifier, template_identifier, fragment_identifier, data, port, callback=function(response){}) {

    const params = {'documentIdentifier' : document_identifier, 'templateIdentifier' : template_identifier, 'fragmentIdentifier' : fragment_identifier, 'data' : data}
    this.post('generate', params, port, function(response) { callback(response) })

  }

  static listDocuments(port, callback=function(response){}) {

    this.get('list', {}, port, function(response) { callback(response) });

  }

  static delete(identifier, port, callback=function(response){}) {

    const params = {'identifier' : identifier}
    this.post('delete', params, port, function(response) { callback(response) })

  }

  static exportItem(identifier, doctype, port, callback=function(response){}) {

    const params = {'identifier' : identifier, 'docType' : doctype}
    this.get('export', params, port, function(response) { callback(response) })

  }

  static add(id, fragment, templateID, templatePath, port, callback) {

    const documentID = "data-" + id;
    const fragmentID = "frag-" + id;

    var fragment = utils.replaceAll(fragment, "\\[id\\]", id);

    Provenance.new(documentID, 'http://name.space', port, function(newBody) {

      Provenance.namespace(documentID, 'sub', 'http://sub.name.space', port, function(namespaceBody) {

        const template = fs.readFileSync(templatePath, 'utf8');

        Provenance.register(documentID, templateID, template, port, function(registerBody) {

          Provenance.generate(documentID, templateID, fragmentID, fragment, port, function(generateBody) {

            callback(generateBody);

          });

        });

      });

    });

  }

}

module.exports = Provenance;
