var _ = require('lodash');
var debug = require('debug')('route:getObjectByType');
var moment = require('moment');
var nconf = require('nconf');

var mongo = require('../lib/mongo');

var supported = {
    'fbtimpre': {
        timeVar: "impressionTime",
        dburl: 'mongodb://localhost/e18' },
    'fbtposts': {
        timeVar: "publicationTime",
        dburl: 'mongodb://localhost/e18' },
    'dibattito': {
        timeVar: "created_time",
        dburl: 'mongodb://localhost/e18' },
    'judgment': {
        timeVar: "when",
        dburl: 'mongodb://localhost/ivl' },
    'entities': {
        timeVar: "publicationTime",
        dburl: 'mongodb://localhost/facebook' },
    'sponsored': {
        timeVar: "savingTime",
        dburl: 'mongodb://localhost/e18' },

};


function InvalidTypeJSONError(type) {
    return {
        'json': {
            error: "Invalid type requested",
            type: type,
            accepted: _.keys(supported)
        }
    };
};


/* this is a link between campaign backend and 'generalized' backend,
 * still has to be clear, in design perspective, who has to influence what */
function getLastObjectByType(type) {
    if(_.keys(supported).indexOf(type) == -1)
        return InvalidTypeJSONError(type);

    setDB(type);
    var sorter = _.set({}, supported[type].timeVar, -1);

    return mongo
        .readLimit(type, {}, sorter, 1, 0)
        .then(_.first)
        .then(function(r) {
            r.type = type;
            debug("Retrieved last element in %s since %s", type,
                _.get(r, supported[type].timeVar));
            return r;
        })
        .catch(function(e) {
            debug("[+~] ByType: %s in %s", e.message, type);
            return { type: type, error: e.message, result: "empty" };
        });
};

function getObjectByIdType(type, id) {
    if(_.keys(supported).indexOf(type) == -1)
        return InvalidTypeJSONError(type);

    setDB(type);
    return mongo
        .readLimit(type, {id: id}, {}, 1, 0)
        .then(_.first)
        .then(function(r) {
            r.type = type;
            debug("Retrieved element by Id [%s] from %s", id, type);
            return r;
        })
        .catch(function(e) {
            debug("[+~] ById: %s in %s", e.message, type);
            return { type: type, error: e.message, result: "empty" };
        });
};


function setDB(type) {
    mongo.forcedDBURL = supported[type].dburl;
    debug("mongoquery on %s [%s]", mongo.forcedDBURL, type);
};


module.exports = {
    theLast: function(req) {
        return getLastObjectByType(req.params.otype)
            .then(function(retval) {
                return { json: retval };
            });
    },
    byId: function(req) {
        return getObjectByIdType(req.params.otype, req.params.id)
            .then(function(retval) {
                return { json: retval };
            });
    },
    getLastObjectByType: getLastObjectByType,
    getObjectByIdType: getObjectByIdType,
    supported: supported
};
