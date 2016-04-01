var _ = require('lodash'),
    mongodb = require('./mongodb'),
    dateFields = ['source', 'wayback', 'fetch'],
    unitsC = 'units';

var get = function(specific_hash) {
    return mongodb.findOne(unitsC, {
        _specific_hash: specific_hash
    });
};

module.exports = {
    byTest: function() { console.log("units.byTest not implemented"); },
    byDomain: function() { console.log("units.byDomain not implemented"); },
    get: get
};

