var _ = require('lodash'),
    debug = require('debug')('plugin.analysis'),
    analytics = require('../lib/analytics');

module.exports = function(datainput) {
    datainput.analytics = {
        invasiveness: analytics.computeInvasiveness(datainput),
        sharedUnrecognized: analytics.sharedUnrecognized(datainput),
    };

/*
    debug("invasiveness: mesured impact of %d target sites, the highest impact is:", _.size(datainput.analytics.compareImpact))
    console.log(JSON.stringify(_.sortBy(datainput.analytics.invasiveness, function(elem) {
                return elem.impact;
         })[0], undefined, 2));
*/

    /* I collect the unrecognized because if a website is present many times, maybe is
       a tracking company not recognized yet. So I use this feedback to update my company List */
    debug("sharedUnrecognized: %d", _.size(datainput.analytics.sharedUnrecognized));
    return datainput;
};

module.exports.argv = {
    'analysis.kind': {
        nargs: 1,
        default: 1,
        desc: 'do some kind of special analysis ? not used ATM.'
    }
};
