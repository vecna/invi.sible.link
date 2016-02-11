var _ = require('lodash'),
    debug = require('debug')('plugin.analysis'),
    analytics = require('../lib/analytics');

module.exports = function(datainput) {
    datainput.analytics = {
        compareImpact: analytics.compareImpact(datainput),
        sharedUnrecognized: analytics.sharedUnrecognized(datainput)
    };
    return datainput;
};

module.exports.argv = {
    'analysis.kind': {
        nargs: 1,
        default: 1,
        desc: 'do some kind of special analysis ? not used ATM.'
    }
};
