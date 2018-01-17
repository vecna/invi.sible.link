var _ = require('lodash');
var debug = require('debug')('route:getLastObjectByType');
var moment = require('moment');
var nconf = require('nconf');

var mongo = require('../lib/mongo');

/* this is a link between campaign backend and 'generalized' backend,
 * still has to be clear, in design perspective, who has to influence what */

var supported = {
    'fbtimpre': "impressionTime",
    'fbtposts': "publicationTime",
    'dibattito': "created_time",
    'judgment': "when",
    'entities': "publicationTime" // timestamp?
};

function validateType(requested) {

    if([ "dibattito", "fbtimpre", "fbtposts" ].indexOf(requested) !== -1) {
        mongo.forcedDBURL = 'mongodb://localhost/e18';
        debug("mongoquery on %s [%s]", mongo.forcedDBURL, requested);
    } else if(requested === "entities") {
        mongo.forcedDBURL = 'mongodb://localhost/facebook';
        debug("mongoquery on %s [%s]", mongo.forcedDBURL, requested);
    } else if(requested === "judgment") {
        mongo.forcedDBURL = 'mongodb://localhost/ivl';
        debug("mongoquery on %s [%s]", mongo.forcedDBURL, requested);
    } else
        throw new Error("Invalid type requested");

    var sorter = _.set({}, _.get(supported, requested), -1);
    return mongo
        .readLimit(requested, {}, sorter, 1, 0)
        .then(function(l) {
            var r = _.first(l);
            r.type = requested;
            return r;
        });
};


function getLastObjectByType(req) {

    debug("request is: %j", req.params);
    return validateType(req.params.otype)
        .then(function(e) {
            debug("Returning one element of type %s", e.type);
            return { json: e };
        })
        .catch(function(error) {
            debug("error: %s", error.message);
            return { text: error.message };
        });
};

module.exports = getLastObjectByType;
