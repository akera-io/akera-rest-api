/*!
 * Copyright(c) 2014 Jan Blaha (pofider)
 *
 * Orchestrate the OData query GET requests
 */

var parser = require("odata-parser");
var queryTransform = require("./queryTransform.js");
var url = require("url");
var querystring = require("querystring");
var utils = require('../utils.js');

module.exports = function(cfg, req, res) {
  console.log(cfg.model);
    if (!cfg.model.entitySets[req.params.collection]) {
        var error = new Error("Entity set not Found");
        error.code = 404;
        res.odataError(error);
        return;
    }

    var queryOptions = { $filter: {}};

    var _url = url.parse(req.url, true);
    if (_url.search) {
        var query = _url.query;
        var fixedQS = {};
        if (query.$) fixedQS.$ = query.$;
        if (query.$expand) fixedQS.$expand = query.$expand;
        if (query.$filter) fixedQS.$filter = query.$filter;
        if (query.$format) fixedQS.$format = query.$format;
        if (query.$inlinecount) fixedQS.$inlinecount = query.$inlinecount;
        if (query.$select) fixedQS.$select = query.$select;
        if (query.$skip) fixedQS.$skip = query.$skip;
        if (query.$top) fixedQS.$top = query.$top;
        if (query.$orderby) fixedQS.$orderby = query.$orderby;

        var encodedQS = decodeURIComponent(querystring.stringify(fixedQS));
        if (encodedQS) {
            queryOptions = queryTransform(parser.parse(encodedQS));
        }
        if (query.$count) {
            queryOptions.$inlinecount = true;
        }
    }

    queryOptions.collection = req.params.collection;

    if (req.params.$count) {
        queryOptions.$count = true;
    }

    if (req.params.id) {
        req.params.id = req.params.id.replace(/\"/g, "").replace(/'/g, "");
        queryOptions.$filter = { _id: req.params.id};
    }

    cfg.query(queryOptions.collection, queryOptions, function(err, result) {
        if (err) {
            return res.odataError(err);
        }
        console.log('in callback');
        res.writeHead(200, {'Content-Type': 'application/json', 'OData-Version': '4.0'});

        console.log(queryOptions.$inlinecount);
        var out = {
            "@odata.context": utils.getOdataCtxUrl(req, queryOptions.collection),//req.protocol + '://' +  req.get('host') + cfg.serviceUrl + "$metadata#" + req.params.collection,
            "value": result
        }

        if (queryOptions.$inlinecount) {
            out["@odata.count"] = result.count;
            out.value = result.value;
        }
        console.log('wrote headers');
        cfg.pruneResults(cfg.model, queryOptions.collection, out.value);
        console.log('pruned results');
        console.log(cfg.bufferToBase64);
        cfg.bufferToBase64(cfg.model, queryOptions.collection, out.value);
        console.log('converted to buffer');
       // console.log(JSON.stringify(out, null, '\t'));
        return res.end(JSON.stringify(out));
    });
};
