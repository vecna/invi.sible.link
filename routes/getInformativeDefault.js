var _ = require('lodash');
var debug = require('debug')('route:getInformativeDefault');
var moment = require('moment');
var nconf = require('nconf');

var mongo = require('../lib/mongo');

/* this is a link between campaign backend and 'generalized' backend,
 * still has to be clear, in design perspective, who has to influence what */

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
