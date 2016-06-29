/*!
 * Copyright(c) 2014 Jan Blaha (pofider)
 *
 * Configure ODataServer to run on nedb
 */
var akera = require('akera-api');
var util = require('./util.js');
var cfg;

function update(akeraConnection, query, update, cb) {
  this.getDB(akeraConnection, function(err, db) {
    if (err)
      return cb(err);

    db.update(query, update, cb);
  });
}

function remove(collection, query, cb) {
  this.getDB(collection, function(err, db) {
    if (err)
      return cb(err);

    db.remove(query, cb);
  });
}

function insert(collection, doc, cb) {
  this.getDB(collection, function(err, db) {
    if (err)
      return cb(err);

    db.insert(doc, cb);
  });
}

function query(collection, query, cb) {
  console.log('QUERY on %s', collection);
  console.log(query);
  console.log(cb);
  this.getDB(collection, function(err, akeraCon) {
    console.log(err);
    if (err)
      return cb(err);

    console.log(collection, query);

    var table = util.getEntityName(collection, cfg.model);
    console.log(table);
    var aQuery = akeraCon.query.select(table);
    console.log('got query');
    try {
      aQuery = util.transformAkeraQuery(aQuery, query, collection, cfg.model);
    } catch (e) {
      console.log(e.stack);
      cb(e);
    }
    aQuery.all().then(function(result) {
     // console.log(result);
      if (query.$count) {
        query.$inlinecount = query.$count;
      }
      var qrResult = query.$inlinecount ? {
        count : result.length,
        value : result
      } : result;
      console.log(qrResult.length);
      cb(null, qrResult);
      console.log('called cb');
      akeraCon.disconnect().then(function() {
        console.log('akera disconnect');
      }, function(err) {
        console.log('error disconnecting akera');
      });
    }, function(err) {
      cb(err);
      console.log(err.stack);
      akeraCon.disconnect().then(function() {
        console.log('akera disconnect');
      }, function(err) {
        console.log('error disconnecting akera');
      });
    });
    // var qr = query.$count ? db.count(query.$filter) : db.find(query.$filter,
    // query.$select);
    //
    // if (query.$sort) {
    // qr = qr.sort(query.$sort);
    // }
    // if (query.$skip) {
    // qr = qr.skip(query.$skip);
    // }
    // if (query.$limit) {
    // qr = qr.limit(query.$limit);
    // }
    //
    // qr.exec(function (err, val) {
    // if (err)
    // return cb(err);
    //
    // if (!query.$inlinecount)
    // return cb(null, val);
    //
    // db.count(query.$filter, function (err, c) {
    // if (err)
    // return cb(err);
    //
    // cb(null, {
    // count: c,
    // value: val
    // });
    // });
    // });
  });
}

module.exports = function(odataServer, getDB) {
  this.getDB = getDB;
  
  cfg = odataServer.cfg || {};
  cfg.getDB = getDB;
  cfg.update = update;
  cfg.remove = remove;
  cfg.query = query;
  cfg.insert = insert;
};
