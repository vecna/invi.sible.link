var _ = require('lodash');
var debug = require('debug')('route:getInformativeDefault');
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

/* this is redunded code, it is not OK, has to be split and abstracted 
 * properly between the generic and the campaign  -- it is a copy
 * of getLastElementByType */

function selectInformation(requested) {

    if(requested === "distorsioni") {
        return shapeDis
    var filter = {};
    var amount = 1;
    var sorter = {};
    var column = null;

    if(requested === "distorsioni") {
        return 
        mongo.forcedDBURL = 'mongodb://localhost/e18';

        _.set(sorter, _.get(supported, requested), -1);
    }

    if([ "dibattito", "fbtimpre", "fbtposts" ].indexOf(requested) !== -1) {
        debug("mongoquery on %s [%s]", mongo.forcedDBURL, requested);
    } else if(requested === "entities") {
        mongo.forcedDBURL = 'mongodb://localhost/facebook';
        debug("mongoquery on %s [%s]", mongo.forcedDBURL, requested);
    } else if(requested === "judgment") {
        mongo.forcedDBURL = 'mongodb://localhost/ivl';
        debug("mongoquery on %s [%s]", mongo.forcedDBURL, requested);
    } else
        throw new Error("Invalid type requested");

    return mongo
        .readLimit(column, filter, sorter, amount, 0)
        .map(function(e) {
            e.type = requested;
            return e;
        });
};

function impressionsMerge() {
};

function postsSponsored() {
};

function trackersMerge() {
};

function getInformativeDefault(req) {

    /* Information-type is different from the sister API, getLastElementByType,
     * because this use Information-type and the other Object-type.
     * Objects are named: fbtimpre,fbtposts,dibattito,judgment,entities: they are
     * columns name. Information-type are the name of the information, this API
     * is much more complex, because return data formatted as the GFX wants. */

    if(requested === "distorsioni") {
        var getData = impressionsMerge();
    } else if(requested === "sponsorizzati" ) {
        var getData = postsSponsored();
    } else if(requested === "sorveglianza") {
        var getData = trackersMerge();
    }

    return getData().then(function(e) {
            debug("Returning information type %s", req.params.itype);
            return { json: e };
        })
        .catch(function(error) {
            debug("Error: %s", error.message);
            return { text: error.message };
        });
};

module.exports = getInformativeDefault;
