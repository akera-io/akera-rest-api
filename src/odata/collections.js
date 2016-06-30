/*!
 * Copyright(c) 2014 Jan Blaha (pofider)
 *
 * Orchestrate the OData / request
 */
var xmlbuilder = require('xmlbuilder');
/*!
 * Copyright(c) 2016 Acorn IT
 *
 * OData collections meta-data serialization
 */

module.exports = function(model, originalUrl) {

  var xml = xmlbuilder.create({
    'service' : {
      '@xmlns' : 'http://www.w3.org/2007/app',
      '@xmlns:atom' : 'http://www.w3.org/2005/Atom',
      '@xmlns:m' : 'http://docs.oasis-open.org/odata/ns/metadata',
      '@xml:base' : originalUrl,
      '@m:context' : originalUrl + '$metadata'
    }
  });

  var workspaceNode = xml.ele('workspace');

  var namespaces = model.getNamespaces();

  namespaces.forEach(function(namespace) {
    var ns = model.getNamespace(namespace);
    if (ns.entitySets) {
      Object.keys(ns.entitySets).forEach(function(eSet) {
        workspaceNode.ele('atom:title', {
          'type' : 'text'
        }, 'Default');
        workspaceNode.ele('collection', {
          'href' : eSet
        }).ele('atom:title', {
          'type' : 'text'
        }, eSet);
      });
    }
  });

  xml.end({
    pretty : true
  });

  return xml.toString();
};
