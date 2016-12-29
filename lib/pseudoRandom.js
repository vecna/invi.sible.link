var _ = require('lodash');
var hash = require('./various').hash;
var debug = require('debug')('lib:pseudoRandom');

var state = null; 
var SLOTS = 5;

function resetStatus(amount, unit) {
    debug("Initializing Status");
    state = {
        expireOn: moment().add(amount, unit),
        createdOn: moment(),
        rand: _.random(0, 0xffff)
    };
};

function getPseudoRandomSample(collection) {

    if(_.isNull(state))
        resetStatus(2, 'm')

    if(moment().isAfter(state.expireOn)) {
        debug("Expired the pseudoRandom");
        resetStatus();
    }

    debug("Returning %d slots from a starting list of %d",
        SLOTS, _.size(collection));

    return _.times(SLOTS, function(i) {
        var prn = ( (i*SLOTS) + state.rand);
        return _.nth(collection, (prn % _.size(collection) ) );
    });
};

module.exports = {
    getPseudoRandomSample: getPseudoRandomSample
};
