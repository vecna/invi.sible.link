var _ = require('lodash'),
    debug = require('debug')('plugin.analysis'),
    analytics = require('../lib/analytics');


/* Intrusiveness has been removed after commit 80702b3, because without details 
 * on the website visibility per country, it is quite hard compute that */

module.exports = function(staticInput, datainput) {

    datainput.analytics = {
        sharedUnrecognized: analytics.sharedUnrecognized(datainput),
        peeks: analytics.extractPeeks(datainput)
    };

    /* I collect the unrecognized because if a website is present many times, maybe is
       a tracking company not recognized yet. So I use this feedback to update my company List */
    debug("sharedUnrecognized: %d", _.size(datainput.analytics.sharedUnrecognized));
    return datainput;
};

