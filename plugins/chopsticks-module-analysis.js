var _ = require('lodash'),
    debug = require('debug')('plugin.analysis'),
    analytics = require('../lib/analytics');

module.exports = function(datainput) {

    datainput.analytics = {
        intrusiveness: analytics.computeIntrusiveness(datainput),
        sharedUnrecognized: analytics.sharedUnrecognized(datainput),
        peeks: analytics.extractPeeks(datainput)
    };

    /* I collect the unrecognized because if a website is present many times, maybe is
       a tracking company not recognized yet. So I use this feedback to update my company List */
    debug("sharedUnrecognized: %d", _.size(datainput.analytics.sharedUnrecognized));
    return datainput;
};

