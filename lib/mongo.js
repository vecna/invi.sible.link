var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var mongodb = Promise.promisifyAll(require('mongodb'));
var debug = require('debug')('lib:mongo');
var nconf = require('nconf');

var dbConnection = function() {
    var url = nconf.get('mongodb');
    if(!url)
        throw new Error("lacking of mongodb URL in config");

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

var remove = function(cName, selector) {
    return Promise.using(dbConnection(), function(db) {
        return db
            .collection(cName)
            .remove(selector);
    })
    .tap(function(r) {
        debug("remove: %j", r);
    });
};

var updateOne = function(cName, selector, updated) {
    return remove(cName, selector)
        .then(function() {
            return writeOne(cName, updated);
        });
};

var writeMany = function(cName, dataObjects) {
    return Promise.using(dbConnection(), function(db) {
        return db
            .collection(cName)
            .insertMany(dataObjects);
    })
    .tap(function() {
        debug("writeMany done: in %s %d objects", cName, _.size(dataObjects));
    });
};

var save = function(cName, doc) {
    return Promise.using(dbConnection(), function(db) {
        return db
            .collection(cName)
            .save(doc);
    });
};

var read = function(cName, selector, sorter) {
    if(_.isUndefined(selector)) selector = {};
    if(_.isUndefined(sorter)) sorter = {};
    return Promise.using(dbConnection(), function(db) {
        return db
            .collection(cName)
            .find(selector)
            .sort(sorter)
            .toArray()
            .catch(function(error) {
                debug("mongo: %s", error);
                return [];
            });
    })
    .tap(function(rv) {
        debug("read in %s by %j sort by %j got %d results",
            cName, selector, sorter, _.size(rv));
    });
};

var readLimit = function(cName, selector, sorter, amount, skip) {
    return Promise.using(dbConnection(), function(db) {
        return db
            .collection(cName)
            .find(selector)
            .sort(sorter)
            .skip(skip)
            .limit(amount)
            .toArray()
    })
    .tap(function(rv) {
        debug("readLimit (done) in %s by %j sort %j amount %d skip %d ret %d",
            cName, selector, sorter, amount, skip, _.size(rv) );
    });
};

var aggregate = function(cName, match, group) {
    return Promise.using(dbConnection(), function(db) {
        return db
            .collection(cName)
            .aggregate([
                { $match: match },
                { $group: group }
            ])
            .toArray();
    })
    .tap(function(ret) {
        debug("aggregate %s match %s group %s → %d entries",
            cName, JSON.stringify(match),
            JSON.stringify(group), _.size(ret));
    });
};


var countByObject = function(cName, idobj) {
    if(_.isUndefined(idobj)) idobj = {};
    debug("countByObject in %s by %j", cName, idobj);
    return Promise.using(dbConnection(), function(db) {
        return db
            .collection(cName)
            .aggregate([
                {
                  $group: {
                    _id: idobj,
                    count: { $sum: 1 }
                  }
                },
                { $sort: { count: -1 } }
            ])
            .toArray()
            .catch(function(error) {
                debug("MongoQuery %s error: %s", cName, error);
                return [];
            });
    });
};


function countByDay(cName, timeVarName, filter, aggext) {

    if(!_.startsWith(timeVarName, '$'))
        throw new Error("developer please: mongoVar wants '$'");

    var queryId = { 
        year:  { $year: timeVarName },
        month: { $month: timeVarName },
        day:   { $dayOfMonth: timeVarName }
    };

    if(_.isObject(aggext) && _.size(_.keys(aggext)) > 0) {
        /* for example: { user: "$userId" } */
        queryId = _.extend(queryId, aggext);
    }

    var totalQ = [
        { $match: filter },
        { $group: {
            _id: queryId,
            count: { $sum: 1 }
        }}
    ]; 

    return Promise.using(dbConnection(), function(db) {
        return db
            .collection(cName)
            .aggregate(totalQ)
            .toArray()
            .catch(function(error) {
                debug("mongo error in aggegate: %s (%s)", error, cName);
                return [];
            });
    });
};

function count(cName, selector) {
    debug("count on %s by %j", cName, selector);
    return Promise.using(dbConnection(), function(db) {
        return db
            .collection(cName)
            .find(selector)
            .count()
            .catch(function(error) {
                debug("mongo error in count: %s (%s)", error, cName);
                return [];
            });
    });
};

function remove(cName, selector) {

    if(!_.size(_.keys(selector)))
        throw new Error("Nope, you can't delete {} ");

    debug("Removing documents %j from %s", selector, cName);

    return Promise.using(dbConnection(), function(db) {
        return db
            .collection(cName)
            .remove(selector);
    });
};

module.exports = {
    updateOne: updateOne,
    writeOne: writeOne,
    writeMany: writeMany,
    save: save,
    read: read,
    readLimit: readLimit,
    countByDay: countByDay,
    countByObject: countByObject,
    count: count,
    aggregate: aggregate,
    remove: remove
};
