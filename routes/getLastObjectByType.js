var _ = require('lodash');
var debug = require('debug')('route:getLastObjectByType');
var moment = require('moment');
var nconf = require('nconf');

var mongo = require('../lib/mongo');

/* this is a link between campaign backend and 'generalized' backend,
 * still has to be clear, in design perspective, who has to influence what */
function getLastObjectByType(req) {

    var requested = req.params.otype;

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
        throw new Error("Invalid type requested ", requested);

    var supported = {
        'fbtimpre': "impressionTime",
        'fbtposts': "publicationTime",
        'dibattito': "created_time",
        'judgment': "when",
        'entities': "publicationTime" // timestamp?
    };
    var sorter = _.set({}, _.get(supported, requested), -1);

    return mongo
        .readLimit(requested, {}, sorter, 1, 0)
        .then(function(l) {
            var r = _.first(l);
            debug("[+] %s got %d", requested, _.size(r));
            r.type = requested;
            return { json: r};
        })
        .catch(function(e) {
            debug("[+~] %s in %s", e.message, requested);
            return { json: { type: requested, error: e.message, result: "empty" }};
        });
};

module.exports = getLastObjectByType;
