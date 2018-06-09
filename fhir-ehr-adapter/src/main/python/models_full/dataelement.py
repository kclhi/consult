#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
#  Generated from FHIR 1.8.0.10521 (http://hl7.org/fhir/StructureDefinition/DataElement) on 2018-01-16.
#  2018, SMART Health IT.


from . import domainresource

class DataElement(domainresource.DomainResource):
    """ Resource data element.
    
    The formal description of a single piece of information that can be
    gathered and reported.
    """
    
    resource_type = "DataElement"
    
    def __init__(self, jsondict=None, strict=True):
        """ Initialize all valid properties.
        
        :raises: FHIRValidationError on validation errors, unless strict is False
        :param dict jsondict: A JSON dictionary to use for initialization
        :param bool strict: If True (the default), invalid variables will raise a TypeError
        """
        
        self.contact = None
        """ Contact details for the publisher.
        List of `ContactDetail` items (represented as `dict` in JSON). """
        
        self.copyright = None
        """ Use and/or publishing restrictions.
        Type `str`. """
        
        self.date = None
        """ Date this was last changed.
        Type `FHIRDate` (represented as `str` in JSON). """
        
        self.element = None
        """ Definition of element.
        List of `ElementDefinition` items (represented as `dict` in JSON). """
        
        self.experimental = None
        """ If for testing purposes, not real usage.
        Type `bool`. """
        
        self.identifier = None
        """ Additional identifier for the data element.
        List of `Identifier` items (represented as `dict` in JSON). """
        
        self.jurisdiction = None
        """ Intended jurisdiction for data element (if applicable).
        List of `CodeableConcept` items (represented as `dict` in JSON). """
        
        self.mapping = None
        """ External specification mapped to.
        List of `DataElementMapping` items (represented as `dict` in JSON). """
        
        self.name = None
        """ Name for this data element (Computer friendly).
        Type `str`. """
        
        self.publisher = None
        """ Name of the publisher (Organization or individual).
        Type `str`. """
        
        self.status = None
        """ draft | active | retired.
        Type `str`. """
        
        self.stringency = None
        """ comparable | fully-specified | equivalent | convertable | scaleable
        | flexible.
        Type `str`. """
        
        self.title = None
        """ Name for this data element (Human friendly).
        Type `str`. """
        
        self.url = None
        """ Logical uri to reference this data element (globally unique).
        Type `str`. """
        
        self.useContext = None
        """ Content intends to support these contexts.
        List of `UsageContext` items (represented as `dict` in JSON). """
        
        self.version = None
        """ Business version of the data element.
        Type `str`. """
        
        super(DataElement, self).__init__(jsondict=jsondict, strict=strict)
    
    def elementProperties(self):
        js = super(DataElement, self).elementProperties()
        js.extend([
            ("contact", "contact", contactdetail.ContactDetail, True, None, False),
            ("copyright", "copyright", str, False, None, False),
            ("date", "date", fhirdate.FHIRDate, False, None, False),
            ("element", "element", elementdefinition.ElementDefinition, True, None, True),
            ("experimental", "experimental", bool, False, None, False),
            ("identifier", "identifier", identifier.Identifier, True, None, False),
            ("jurisdiction", "jurisdiction", codeableconcept.CodeableConcept, True, None, False),
            ("mapping", "mapping", DataElementMapping, True, None, False),
            ("name", "name", str, False, None, False),
            ("publisher", "publisher", str, False, None, False),
            ("status", "status", str, False, None, True),
            ("stringency", "stringency", str, False, None, False),
            ("title", "title", str, False, None, False),
            ("url", "url", str, False, None, False),
            ("useContext", "useContext", usagecontext.UsageContext, True, None, False),
            ("version", "version", str, False, None, False),
        ])
        return js


from . import backboneelement

class DataElementMapping(backboneelement.BackboneElement):
    """ External specification mapped to.
    
    Identifies a specification (other than a terminology) that the elements
    which make up the DataElement have some correspondence with.
    """
    
    resource_type = "DataElementMapping"
    
    def __init__(self, jsondict=None, strict=True):
        """ Initialize all valid properties.
        
        :raises: FHIRValidationError on validation errors, unless strict is False
        :param dict jsondict: A JSON dictionary to use for initialization
        :param bool strict: If True (the default), invalid variables will raise a TypeError
        """
        
        self.comment = None
        """ Versions, Issues, Scope limitations etc..
        Type `str`. """
        
        self.identity = None
        """ Internal id when this mapping is used.
        Type `str`. """
        
        self.name = None
        """ Names what this mapping refers to.
        Type `str`. """
        
        self.uri = None
        """ Identifies what this mapping refers to.
        Type `str`. """
        
        super(DataElementMapping, self).__init__(jsondict=jsondict, strict=strict)
    
    def elementProperties(self):
        js = super(DataElementMapping, self).elementProperties()
        js.extend([
            ("comment", "comment", str, False, None, False),
            ("identity", "identity", str, False, None, True),
            ("name", "name", str, False, None, False),
            ("uri", "uri", str, False, None, False),
        ])
        return js


from . import codeableconcept
from . import contactdetail
from . import elementdefinition
from . import fhirdate
from . import identifier
from . import usagecontext
