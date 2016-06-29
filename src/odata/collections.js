/*!
 * Copyright(c) 2014 Jan Blaha (pofider)
 *
 * Orchestrate the OData / request
 */
var xmlbuilder = require('xmlbuilder');

module.exports = function(cfg, originalUrl) {

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

  for ( var key in cfg.model.entitySets) {
    workspaceNode.ele('atom:title', {
      'type' : 'text'
    }, 'Default');
    workspaceNode.ele('collection', {
      'href' : key
    }).ele('atom:title', {
      'type': 'text'
    }, key);
  }

  xml.end({
    pretty : true
  });

  return xml.toString();
};
