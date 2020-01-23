#!/usr/bin/env python

import json
import requests

def post(method, params):
    url = 'http://localhost:8080/'
    headers = {'Content-Type' : 'application/json'}
    r = requests.post(url + method, headers=headers, params=params)
    return r.text

def get(method, params):
    url = 'http://localhost:8080/'
    headers = {'Content-Type' : 'application/json'}
    r = requests.get(url + method, headers=headers, params=params)
    return r.text

def new(identifier, default_namespace):
    params = {'identifier' : identifier, 'defaultNamespace' : default_namespace}
    return post('new', params)

def namespace(identifier, prefix, namespace):
    params = {'identifier' : identifier, 'prefix' : prefix, 'namespace' : namespace}
    return post('namespace', params)

def register(document_identifier, template_identifier, data):
    params = {'documentIdentifier' : document_identifier,
            'templateIdentifier' : template_identifier, 'templateData' : data}
    return post('register', params)

def register_template(document_identifier, template_identifier):
    params = {'documentIdentifier' : document_identifier,
            'templateIdentifier' : template_identifier}
    return post('registerTemplate', params)

def new_template(template_identifier, data):
    params = {'templateIdentifier' : template_identifier, 'templateData' : data}
    return post('newTemplate', params)

def generate(document_identifier, template_identifier, fragment_identifier, data):
    params = {'documentIdentifier' : document_identifier,
            'templateIdentifier' : template_identifier,
            'fragmentIdentifier' : fragment_identifier, 'data' : data}
    return post('generate', params)

def list_documents():
    return get('list', {})

def delete(identifier):
    params = {'identifier' : identifier}
    return post('delete', params)

def export(identifier, doctype):
    params = {'identifier' : identifier, 'docType' : doctype}
    return get('export', params)

def geninit(document_identifier, template_identifier, fragment_identifier, data):
    params = {'documentIdentifier' : document_identifier,
            'templateIdentifier' : template_identifier,
            'fragmentIdentifier' : fragment_identifier, 'data' : data}
    return post('geninit', params)

def genzone(document_identifier, template_identifier, fragment_identifier, zone_identifier, data):
    params = {'documentIdentifier' : document_identifier,
            'templateIdentifier' : template_identifier,
            'fragmentIdentifier' : fragment_identifier,
            'zoneIdentifier' : zone_identifier, 'data' : data}
    return post('genzone', params)

def genfinal(document_identifier, template_identifier, fragment_identifier):
    params = {'documentIdentifier' : document_identifier,
            'templateIdentifier' : template_identifier,
            'fragmentIdentifier' : fragment_identifier}
    return post('genfinal', params)

def simulate(template_identifier, limits):
    params = {'templateIdentifier' : template_identifier, 'limits' : limits}
    return post('simulate', params)

def test1():
    dn = 'test-data1'
    new(dn, 'http://name.space')
    namespace(dn, 'sub', 'http://sub.name.space')

    f = open('examples/multizone.json')
    t = f.read()
    f.close()
    register(dn, 'test-temp1', t)

    f = open('examples/multizone-subst.json')
    s = f.read()
    f.close()
    generate(dn, 'test-temp1', 'test-frag1', s)

    f = open('examples/multizone-subst-0.json')
    s = f.read()
    f.close()
    geninit(dn, 'test-temp1', 'test-frag2', s)

    for z, n in [(z, n) for z in ['sz', 'pz'] for n in range(1, 3)]:
        f = open('examples/multizone-subst-{}-{}.json'.format(z, n))
        s = f.read()
        f.close()
        genzone(dn, 'test-temp1', 'test-frag2', ':' + z, s)

    genfinal(dn, 'test-temp1', 'test-frag2')

    for ident in json.loads(list_documents()):
        print ident
    print

    d = export(dn, 'document')
    print d

    delete('test-temp1')
    delete(dn)

def test2():
    dn = 'test-data1'
    new(dn, 'http://name.space')
    namespace(dn, 'sub', 'http://sub.name.space')

    f = open('examples/multizone.json')
    t = f.read()
    f.close()
    register(dn, 'test-temp1', t)

    s = simulate('test-temp1', json.dumps({':sz' : 5, ':pz' : 5}))
    print s

    generate(dn, 'test-temp1', 'test-frag1', s)

    d = export(dn, 'document')
    print d

    delete('test-temp1')
    delete(dn)

if __name__ == '__main__':
    test1()
    test2()
