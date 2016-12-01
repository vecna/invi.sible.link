var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var mongodb = Promise.promisifyAll(require('mongodb'));
var debug = require('debug')('mongo');
var nconf = require('nconf');

var dbConnection = function() {
    var url = nconf.get('mongodb');
    return mongodb
        .MongoClient
        .connectAsync(url)
        .disposer(function(db) {
            return db.close();
        });
};

var writeOne = function(cName, dataObject) {
    return Promise.using(dbConnection(), function(db) {
        return db
            .collection(cName)
            .insert(dataObject);
    });
};

var upsertOne = function(cName, selector, updated) {
    debug("upsertOne in %s selector %j ", cName, selector);
    return Promise.using(dbConnection(), function(db) {
        return db
            .collection(cName)
            .updateOne(selector, updated, { upsert: true});
    })
    .tap(function(upsertRet) {
        debug("upsertOne return: %j", upsertRet);
    });
};

var writeMany = function(cName, dataObjects) {
    debug("writeMany in %s of %d objects", cName, _.size(dataObjects));
    return Promise.using(dbConnection(), function(db) {
        return db
            .collection(cName)
            .insertMany(dataObjects);
    });
};

var read = function(cName, selector, sorter) {
    if(_.isUndefined(selector)) selector = {};
    if(_.isUndefined(sorter)) sorter = {};
    debug("read in %s by %j selector sort by %j", cName, selector, sorter);
    return Promise.using(dbConnection(), function(db) {
        return db
            .collection(cName)
            .find(selector)
            .sort(sorter)
            .toArray();
    });
};

var readLimit = function(cName, selector, sorter, limitN, past) {
    if(_.isNaN(past)) past = 0;
    debug("readLimit in %s by %j sort %j max %d past %d", 
        cName, selector, sorter, limitN, past);
    return Promise.using(dbConnection(), function(db) {
        return db
            .collection(cName)
            .find(selector)
            .sort(sorter)
            .limit(limitN + past)
            .toArray()
            .then(function(objList) {
                if(past)
                    return _.takeRight(objList, limitN);
                return objList;
            });
    });
};

module.exports = {
    upsertOne: upsertOne,
    writeOne: writeOne,
    writeMany: writeMany,
    read: read,
    readLimit: readLimit
};
